const mongoose = require('mongoose');
const Redemption = require('../models/Redemption.model');
const Voucher = require('../models/Voucher.model');
const User = require('../models/User.model');
const { generateRedemptionCode } = require('../utils/voucherCode.util');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.util');
const { generateQRCodeBase64, buildRedemptionQRPayload } = require('../services/qrcode.service');
const { generateVoucherPDF } = require('../services/pdf.service');
const { deductPointsForRedemption, refundPoints } = require('../services/points.service');

/**
 * POST /api/redemptions
 * Redeem a voucher
 */
const redeemVoucher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { voucherId } = req.body;
    const userId = req.user._id;

    // 1. Fetch voucher
    const voucher = await Voucher.findById(voucherId).session(session);
    if (!voucher) {
      await session.abortTransaction();
      return sendError(res, 'Voucher not found', 404);
    }

    // 2. Check availability
    if (!voucher.isActive) {
      await session.abortTransaction();
      return sendError(res, 'This voucher is no longer active', 400);
    }
    if (voucher.expiryDate < new Date()) {
      await session.abortTransaction();
      return sendError(res, 'This voucher has expired', 400);
    }
    if (voucher.startDate > new Date()) {
      await session.abortTransaction();
      return sendError(res, 'This voucher is not yet available', 400);
    }
    if (voucher.totalLimit !== null && voucher.redeemedCount >= voucher.totalLimit) {
      await session.abortTransaction();
      return sendError(res, 'This voucher has been fully claimed', 400);
    }

    // 3. Check per-user limit
    const userRedemptionCount = await Redemption.countDocuments({
      user: userId,
      voucher: voucherId,
      status: { $in: ['active', 'used'] },
    }).session(session);

    if (userRedemptionCount >= voucher.perUserLimit) {
      await session.abortTransaction();
      return sendError(res, `You have already redeemed this voucher (limit: ${voucher.perUserLimit})`, 400);
    }

    // 4. Check user has enough points
    const user = await User.findById(userId).session(session);
    if (voucher.pointsCost > 0 && user.points < voucher.pointsCost) {
      await session.abortTransaction();
      return sendError(res, `Insufficient points. You have ${user.points} pts, need ${voucher.pointsCost} pts`, 400);
    }

    // 5. Generate redemption code
    const redemptionCode = generateRedemptionCode();

    // 6. Create redemption (with voucher snapshot)
    const [redemption] = await Redemption.create([{
      user: userId,
      voucher: voucherId,
      redemptionCode,
      pointsUsed: voucher.pointsCost,
      expiresAt: voucher.expiryDate,
      voucherSnapshot: {
        title: voucher.title,
        description: voucher.description,
        merchant: voucher.merchant,
        category: voucher.category,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
    }], { session });

    // 7. Generate QR code
    const qrPayload = buildRedemptionQRPayload(redemption);
    const qrCodeData = await generateQRCodeBase64(qrPayload);
    redemption.qrCodeData = qrCodeData;
    await redemption.save({ session });

    // 8. Deduct points if required
    if (voucher.pointsCost > 0) {
      user.points -= voucher.pointsCost;
      user.pointsHistory.push({
        type: 'spent',
        points: -voucher.pointsCost,
        description: `Redeemed: ${voucher.title}`,
        reference: redemptionCode,
      });
      await user.save({ session });
    }

    // 9. Increment voucher redemption count
    await Voucher.findByIdAndUpdate(
      voucherId,
      { $inc: { redeemedCount: 1 } },
      { session }
    );

    await session.commitTransaction();

    return sendSuccess(res, {
      redemption: {
        ...redemption.toObject(),
        voucher,
      },
    }, 'Voucher redeemed successfully!', 201);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/redemptions/my
 * Get current user's redemption history
 */
const getMyRedemptions = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [redemptions, total] = await Promise.all([
    Redemption.find(filter)
      .populate('voucher', 'title merchant category image discountType discountValue')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Redemption.countDocuments(filter),
  ]);

  return sendPaginated(res, redemptions, total, page, limit, 'Redemption history fetched');
};

/**
 * GET /api/redemptions/:id
 * Get a single redemption detail (owner or admin)
 */
const getRedemption = async (req, res) => {
  const redemption = await Redemption.findById(req.params.id)
    .populate('voucher')
    .populate('user', 'name email avatar');

  if (!redemption) return sendError(res, 'Redemption not found', 404);

  // Check ownership or admin
  if (
    req.user.role !== 'admin' &&
    redemption.user._id.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Access denied', 403);
  }

  return sendSuccess(res, { redemption }, 'Redemption fetched');
};

/**
 * GET /api/redemptions/:id/pdf
 * Download voucher as PDF
 */
const downloadRedemptionPDF = async (req, res) => {
  const redemption = await Redemption.findById(req.params.id)
    .populate('voucher')
    .populate('user', 'name email');

  if (!redemption) return sendError(res, 'Redemption not found', 404);

  if (
    req.user.role !== 'admin' &&
    redemption.user._id.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Access denied', 403);
  }

  const pdfBuffer = await generateVoucherPDF(redemption, redemption.user, redemption.voucher);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="voucher-${redemption.redemptionCode}.pdf"`,
    'Content-Length': pdfBuffer.length,
  });

  return res.end(pdfBuffer);
};

/**
 * POST /api/redemptions/:id/cancel (user - if active, admin can always cancel)
 */
const cancelRedemption = async (req, res) => {
  const redemption = await Redemption.findById(req.params.id).populate('voucher');
  if (!redemption) return sendError(res, 'Redemption not found', 404);

  if (
    req.user.role !== 'admin' &&
    redemption.user.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 'Access denied', 403);
  }

  if (redemption.status !== 'active') {
    return sendError(res, `Cannot cancel a redemption with status: ${redemption.status}`, 400);
  }

  redemption.status = 'cancelled';
  await redemption.save();

  // Refund points if any were spent
  if (redemption.pointsUsed > 0) {
    await refundPoints(
      redemption.user,
      redemption.pointsUsed,
      redemption.voucherSnapshot?.title || 'Voucher',
      redemption.redemptionCode
    );
  }

  // Decrement voucher count
  await Voucher.findByIdAndUpdate(redemption.voucher, { $inc: { redeemedCount: -1 } });

  return sendSuccess(res, {}, 'Redemption cancelled and points refunded');
};

/**
 * GET /api/redemptions (admin) - all redemptions
 */
const getAllRedemptions = async (req, res) => {
  const { page = 1, limit = 20, status, voucherId, userId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (voucherId) filter.voucher = voucherId;
  if (userId) filter.user = userId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [redemptions, total] = await Promise.all([
    Redemption.find(filter)
      .populate('user', 'name email avatar')
      .populate('voucher', 'title merchant category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Redemption.countDocuments(filter),
  ]);

  return sendPaginated(res, redemptions, total, page, limit, 'All redemptions fetched');
};

/**
 * PATCH /api/redemptions/:id/mark-used (admin)
 */
const markAsUsed = async (req, res) => {
  const redemption = await Redemption.findById(req.params.id);
  if (!redemption) return sendError(res, 'Redemption not found', 404);
  if (redemption.status !== 'active') {
    return sendError(res, `Cannot mark as used: current status is ${redemption.status}`, 400);
  }

  redemption.status = 'used';
  redemption.usedAt = new Date();
  await redemption.save();

  return sendSuccess(res, { redemption }, 'Redemption marked as used');
};

/**
 * DELETE /api/redemptions/:id (admin)
 */
const deleteRedemption = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const redemption = await Redemption.findById(req.params.id).session(session);
    if (!redemption) {
      await session.abortTransaction();
      return sendError(res, 'Redemption not found', 404);
    }

    if (redemption.status !== 'cancelled') {
      await Voucher.updateOne(
        { _id: redemption.voucher, redeemedCount: { $gt: 0 } },
        { $inc: { redeemedCount: -1 } },
        { session }
      );
    }

    await Redemption.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    return sendSuccess(res, {}, 'Redemption deleted successfully');
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = {
  redeemVoucher, getMyRedemptions, getRedemption,
  downloadRedemptionPDF, cancelRedemption, getAllRedemptions, markAsUsed,
  deleteRedemption,
};
