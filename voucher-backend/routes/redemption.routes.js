const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { redemptionLimiter } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const {
  redeemVoucher, getMyRedemptions, getRedemption,
  downloadRedemptionPDF, cancelRedemption, getAllRedemptions, markAsUsed,
  deleteRedemption,
} = require('../controllers/redemption.controller');

// User routes
router.post('/', protect, redemptionLimiter, asyncHandler(redeemVoucher));
router.get('/my', protect, asyncHandler(getMyRedemptions));
router.get('/:id', protect, asyncHandler(getRedemption));
router.get('/:id/pdf', protect, asyncHandler(downloadRedemptionPDF));
router.post('/:id/cancel', protect, asyncHandler(cancelRedemption));

// Admin routes
router.get('/', protect, adminOnly, asyncHandler(getAllRedemptions));
router.patch('/:id/mark-used', protect, adminOnly, asyncHandler(markAsUsed));
router.delete('/:id', protect, adminOnly, asyncHandler(deleteRedemption));

module.exports = router;
