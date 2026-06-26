const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { getMyReferrals, validateReferralCode, getAllReferrals, applyReferral } = require('../controllers/referral.controller');

// Public
router.get('/validate/:code', asyncHandler(validateReferralCode));

// User
router.get('/my', protect, asyncHandler(getMyReferrals));
router.post('/apply', protect, asyncHandler(applyReferral));

// Admin
router.get('/', protect, adminOnly, asyncHandler(getAllReferrals));

module.exports = router;
