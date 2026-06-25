const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const {
  getDashboard, getTopVouchers, getLowVouchers,
  getRedemptionsOverTime, getCategoryBreakdown, getUserActivity,
  getGrossValue, getAvgTimeToRedeem, getUserGrowth,
} = require('../controllers/analytics.controller');

// All analytics require admin
router.use(protect, adminOnly);

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/top-vouchers', asyncHandler(getTopVouchers));
router.get('/low-vouchers', asyncHandler(getLowVouchers));
router.get('/redemptions-over-time', asyncHandler(getRedemptionsOverTime));
router.get('/category-breakdown', asyncHandler(getCategoryBreakdown));
router.get('/user-activity', asyncHandler(getUserActivity));
router.get('/gross-value', asyncHandler(getGrossValue));
router.get('/avg-time-to-redeem', asyncHandler(getAvgTimeToRedeem));
router.get('/user-growth', asyncHandler(getUserGrowth));

module.exports = router;
