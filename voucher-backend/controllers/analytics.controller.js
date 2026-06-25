const Voucher = require('../models/Voucher.model');
const Redemption = require('../models/Redemption.model');
const User = require('../models/User.model');
const { sendSuccess } = require('../utils/response.util');

/**
 * GET /api/analytics/dashboard
 * Admin dashboard overview stats
 */
const getDashboard = async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsersThisMonth, totalVouchers,
    activeVouchers, expiredVouchers, totalRedemptions,
    redemptionsThisMonth, redemptionsThisWeek,
    totalPointsInCirculation,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: thirtyDaysAgo } }),
    Voucher.countDocuments(),
    Voucher.countDocuments({ isActive: true, expiryDate: { $gte: now } }),
    Voucher.countDocuments({ expiryDate: { $lt: now } }),
    Redemption.countDocuments(),
    Redemption.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Redemption.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$points' } } }]),
  ]);

  return sendSuccess(res, {
    stats: {
      users: { total: totalUsers, newThisMonth: newUsersThisMonth },
      vouchers: { total: totalVouchers, active: activeVouchers, expired: expiredVouchers },
      redemptions: { total: totalRedemptions, thisMonth: redemptionsThisMonth, thisWeek: redemptionsThisWeek },
      points: { totalInCirculation: totalPointsInCirculation[0]?.total || 0 },
    },
  }, 'Dashboard stats fetched');
};

/**
 * GET /api/analytics/top-vouchers
 * Top redeemed vouchers
 */
const getTopVouchers = async (req, res) => {
  const { limit = 10 } = req.query;

  const topVouchers = await Voucher.find()
    .sort({ redeemedCount: -1 })
    .limit(parseInt(limit))
    .select('title merchant category redeemedCount totalLimit isActive expiryDate discountType discountValue pointsCost isFeatured')
    .lean({ virtuals: true });

  return sendSuccess(res, { vouchers: topVouchers }, 'Top vouchers fetched');
};

/**
 * GET /api/analytics/low-vouchers
 * Least redeemed / expiring soon
 */
const getLowVouchers = async (req, res) => {
  const { limit = 10 } = req.query;
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [leastRedeemed, expiringSoon] = await Promise.all([
    Voucher.find({ isActive: true, expiryDate: { $gte: new Date() } })
      .sort({ redeemedCount: 1 })
      .limit(parseInt(limit))
      .select('title merchant category redeemedCount totalLimit expiryDate')
      .lean({ virtuals: true }),
    Voucher.find({
      isActive: true,
      expiryDate: { $gte: new Date(), $lte: sevenDaysFromNow },
    })
      .sort({ expiryDate: 1 })
      .limit(parseInt(limit))
      .select('title merchant category redeemedCount expiryDate')
      .lean({ virtuals: true }),
  ]);

  return sendSuccess(res, { leastRedeemed, expiringSoon }, 'Low-performance vouchers fetched');
};

/**
 * GET /api/analytics/redemptions-over-time
 * Redemptions grouped by day/week/month
 */
const getRedemptionsOverTime = async (req, res) => {
  const { period = 'daily', days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  let groupFormat;
  if (period === 'monthly') groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  else if (period === 'weekly') groupFormat = { $week: '$createdAt' };
  else groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  const data = await Redemption.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: groupFormat,
        count: { $sum: 1 },
        pointsUsed: { $sum: '$pointsUsed' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Normalize _id -> date so the frontend always has a `date` field regardless of period
  const normalized = data.map((d) => ({ date: d._id, count: d.count, pointsUsed: d.pointsUsed }));

  return sendSuccess(res, { data: normalized, period }, 'Redemptions over time fetched');
};

/**
 * GET /api/analytics/category-breakdown
 * Redemptions by category
 */
const getCategoryBreakdown = async (req, res) => {
  const data = await Redemption.aggregate([
    {
      $lookup: {
        from: 'vouchers',
        localField: 'voucher',
        foreignField: '_id',
        as: 'voucher',
      },
    },
    { $unwind: '$voucher' },
    {
      $group: {
        _id: '$voucher.category',
        redemptions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
    {
      $project: {
        category: '$_id',
        redemptions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
    { $sort: { redemptions: -1 } },
  ]);

  const total = data.reduce((sum, c) => sum + c.redemptions, 0) || 1;
  const withPct = data.map((c) => ({
    ...c,
    percentage: Math.round((c.redemptions / total) * 100),
  }));

  return sendSuccess(res, { data: withPct }, 'Category breakdown fetched');
};

/**
 * GET /api/analytics/user-activity
 * Top users by redemption count
 */
const getUserActivity = async (req, res) => {
  const { limit = 10 } = req.query;

  const topUsers = await Redemption.aggregate([
    { $match: { status: { $in: ['active', 'used'] } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$user',
        redemptionCount: { $sum: 1 },
        pointsUsed: { $sum: '$pointsUsed' },
        lastRedemption: { $first: '$$ROOT' },
      },
    },
    { $sort: { 'lastRedemption.createdAt': -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'vouchers',
        localField: 'lastRedemption.voucher',
        foreignField: '_id',
        as: 'voucher',
      },
    },
    { $unwind: { path: '$voucher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: '$user.name',
        email: '$user.email',
        avatar: '$user.avatar',
        points: '$user.points',
        referralCount: '$user.referralCount',
        redemptionCount: 1,
        pointsUsed: 1,
        status: '$lastRedemption.status',
        createdAt: '$lastRedemption.createdAt',
        voucher: '$voucher.title',
      },
    },
  ]);

  return sendSuccess(res, { users: topUsers }, 'User activity fetched');
};

/**
 * GET /api/analytics/gross-value
 * Sum of originalPrice for redeemed vouchers in the window, via lookup
 * (Redemption has no originalPrice of its own — it's read off the linked Voucher).
 */
const getGrossValue = async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
  const prevStart = new Date(startDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

  const computeGrossValue = async (from, to) => {
    const match = to
      ? { createdAt: { $gte: from, $lt: to }, status: { $in: ['active', 'used'] } }
      : { createdAt: { $gte: from }, status: { $in: ['active', 'used'] } };

    const result = await Redemption.aggregate([
      { $match: match },
      { $lookup: { from: 'vouchers', localField: 'voucher', foreignField: '_id', as: 'voucher' } },
      { $unwind: '$voucher' },
      { $group: { _id: null, grossValue: { $sum: { $ifNull: ['$voucher.originalPrice', 0] } } } },
    ]);
    return result[0]?.grossValue || 0;
  };

  const [grossValue, prevGrossValue] = await Promise.all([
    computeGrossValue(startDate, null),
    computeGrossValue(prevStart, startDate),
  ]);

  const changePct = prevGrossValue > 0
    ? Math.round(((grossValue - prevGrossValue) / prevGrossValue) * 1000) / 10
    : null;

  return sendSuccess(res, { grossValue, changePct }, 'Gross value fetched');
};

/**
 * GET /api/analytics/avg-time-to-redeem
 * Average days between a voucher's creation and a redemption of it.
 * Proxy metric — schema has no separate "claimed" or "viewed" event.
 */
const getAvgTimeToRedeem = async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
  const prevStart = new Date(startDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);

  const computeAvgDays = async (from, to) => {
    const match = to ? { createdAt: { $gte: from, $lt: to } } : { createdAt: { $gte: from } };
    const result = await Redemption.aggregate([
      { $match: match },
      { $lookup: { from: 'vouchers', localField: 'voucher', foreignField: '_id', as: 'voucher' } },
      { $unwind: '$voucher' },
      { $project: { diffMs: { $subtract: ['$createdAt', '$voucher.createdAt'] } } },
      { $match: { diffMs: { $gte: 0 } } },
      { $group: { _id: null, avgMs: { $avg: '$diffMs' } } },
    ]);
    return result[0]?.avgMs ?? null;
  };

  const [avgMs, prevAvgMs] = await Promise.all([
    computeAvgDays(startDate, null),
    computeAvgDays(prevStart, startDate),
  ]);

  const avgDays = avgMs !== null ? Math.round((avgMs / (1000 * 60 * 60 * 24)) * 10) / 10 : null;
  const prevAvgDays = prevAvgMs !== null ? prevAvgMs / (1000 * 60 * 60 * 24) : null;
  const changePct = (avgDays !== null && prevAvgDays)
    ? Math.round(((avgDays - prevAvgDays) / prevAvgDays) * 1000) / 10
    : null;

  return sendSuccess(res, { avgDays, changePct }, 'Avg time to redeem fetched');
};

/**
 * GET /api/analytics/user-growth
 * Cumulative user signups by month for a line/area chart.
 */
const getUserGrowth = async (req, res) => {
  const { months = 6 } = req.query;
  const monthsBack = parseInt(months);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (monthsBack - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const monthlySignups = await User.aggregate([
    { $match: { role: 'user', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        newUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const baselineCount = await User.countDocuments({ role: 'user', createdAt: { $lt: startDate } });

  const monthKeys = [];
  const cursor = new Date(startDate);
  for (let i = 0; i < monthsBack; i++) {
    monthKeys.push(cursor.toISOString().slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const signupMap = Object.fromEntries(monthlySignups.map((m) => [m._id, m.newUsers]));
  let cumulative = baselineCount;
  const data = monthKeys.map((key) => {
    cumulative += signupMap[key] || 0;
    return { month: key, newUsers: signupMap[key] || 0, cumulativeUsers: cumulative };
  });

  const newThisWeek = await User.countDocuments({
    role: 'user',
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  return sendSuccess(res, { data, newThisWeek }, 'User growth fetched');
};

module.exports = {
  getDashboard,
  getTopVouchers,
  getLowVouchers,
  getRedemptionsOverTime,
  getCategoryBreakdown,
  getUserActivity,
  getGrossValue,
  getAvgTimeToRedeem,
  getUserGrowth,
};