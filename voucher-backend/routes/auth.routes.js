const express = require('express');
const router = express.Router();
const passport = require('passport');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validate, registerSchema, loginSchema } = require('../utils/validate.util');
const { asyncHandler } = require('../middleware/error.middleware');
const { register, login, googleCallback, getMe, logout } = require('../controllers/auth.controller');

// Email/Password Auth
router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/logout', protect, asyncHandler(logout));

// Current User
router.get('/me', protect, asyncHandler(getMe));

// Google OAuth
router.get('/google',
  (req, res, next) => {
    if (req.query.ref) req.session.pendingReferralCode = req.query.ref.toUpperCase();
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`, session: false }),
  asyncHandler(googleCallback)
);

module.exports = router;
