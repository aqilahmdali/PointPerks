const Voucher = require('../models/Voucher.model');
const Redemption = require('../models/Redemption.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');

/**
 * GET /api/vouchers
 * List vouchers with filters & pagination (public + auth users)
 */
const getVouchers = async (req, res) => {
  const {
    category, search, page = 1, limit = 12,
    sortBy = 'createdAt', order = 'desc',
    showExpired = 'false', featured,
  } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (showExpired === 'false') {
    filter.isActive = true;
    filter.expiryDate = { $gte: new Date() };
    filter.startDate = { $lte: new Date() };
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { merchant: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [vouchers, total] = await Promise.all([
    Voucher.find(filter)
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Voucher.countDocuments(filter),
  ]);

  return sendPaginated(res, vouchers, total, page, limit, 'Vouchers fetched');
};

/**
 * GET /api/vouchers/:id
 * Single voucher detail
 */
const getVoucher = async (req, res) => {
  const voucher = await Voucher.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!voucher) return sendError(res, 'Voucher not found', 404);

  // Check if requesting user has already redeemed
  let userRedemption = null;
  if (req.user) {
    userRedemption = await Redemption.findOne({
      user: req.user._id,
      voucher: voucher._id,
      status: { $in: ['active', 'used'] },
    }).select('redemptionCode status createdAt');
  }

  return sendSuccess(res, { voucher, userRedemption }, 'Voucher fetched');
};

/**
 * POST /api/vouchers (admin)
 */
const createVoucher = async (req, res) => {
  const voucher = await Voucher.create({
    ...req.body,
    createdBy: req.user._id,
  });

  return sendSuccess(res, { voucher }, 'Voucher created successfully', 201);
};

/**
 * PUT /api/vouchers/:id (admin)
 */
const updateVoucher = async (req, res) => {
  const voucher = await Voucher.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!voucher) return sendError(res, 'Voucher not found', 404);
  return sendSuccess(res, { voucher }, 'Voucher updated successfully');
};

/**
 * DELETE /api/vouchers/:id (admin)
 */
const deleteVoucher = async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) return sendError(res, 'Voucher not found', 404);

  const hasRedemptions = await Redemption.countDocuments({ voucher: req.params.id });
  if (hasRedemptions > 0) {
    // Soft delete - just deactivate
    voucher.isActive = false;
    await voucher.save();
    return sendSuccess(res, {}, 'Voucher deactivated (has existing redemptions)');
  }

  await Voucher.findByIdAndDelete(req.params.id);
  return sendSuccess(res, {}, 'Voucher deleted successfully');
};

/**
 * GET /api/vouchers/categories/summary
 * Category list with counts (public)
 */
const getCategorySummary = async (req, res) => {
  const summary = await Voucher.aggregate([
    {
      $match: {
        isActive: true,
        expiryDate: { $gte: new Date() },
        startDate: { $lte: new Date() },
      },
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalRedeemed: { $sum: '$redeemedCount' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return sendSuccess(res, { summary }, 'Category summary fetched');
};

/**
 * PATCH /api/vouchers/:id/toggle (admin)
 * Toggle active status
 */
const toggleVoucherStatus = async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) return sendError(res, 'Voucher not found', 404);

  voucher.isActive = !voucher.isActive;
  await voucher.save();

  return sendSuccess(res, { voucher }, `Voucher ${voucher.isActive ? 'activated' : 'deactivated'}`);
};

module.exports = {
  getVouchers, getVoucher, createVoucher, updateVoucher,
  deleteVoucher, getCategorySummary, toggleVoucherStatus,
};
