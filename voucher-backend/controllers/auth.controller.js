const User = require('../models/User.model');
const { generateAccessToken } = require('../utils/jwt.util');
const { generateReferralCode } = require('../utils/referral.util');
const { sendSuccess, sendError } = require('../utils/response.util');
const { awardSignupBonus, processReferral } = require('../services/points.service');

/**
 * POST /api/auth/register
 * Register with email/password + optional referral code
 */
const register = async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'Email already registered', 409);
  }

  const newReferralCode = generateReferralCode();
  const signupBonus = parseInt(process.env.SIGNUP_BONUS_POINTS) || 100;

  const user = await User.create({
    name,
    email,
    password,
    referralCode: newReferralCode,
    points: signupBonus,
    pointsHistory: [{
      type: 'bonus',
      points: signupBonus,
      description: 'Welcome signup bonus',
      reference: 'SIGNUP_BONUS',
    }],
  });

  // Process referral if code provided — wrapped so a referral error never breaks registration
  if (referralCode) {
    try {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        await processReferral(referrer._id, user._id, referralCode.toUpperCase());
        user.referredBy = referrer._id;
        await user.save();
      }
    } catch (err) {
      console.error('Referral processing failed during registration:', err.message);
    }
  }

  // Re-fetch to get updated points after referral bonus
  const freshUser = await User.findById(user._id);
  const token = generateAccessToken(freshUser);

  return sendSuccess(res, {
    token,
    user: {
      id: freshUser._id,
      name: freshUser.name,
      email: freshUser.email,
      role: freshUser.role,
      points: freshUser.points,
      referralCode: freshUser.referralCode,
      avatar: freshUser.avatar,
    },
  }, 'Registration successful', 201);
};

/**
 * POST /api/auth/login
 * Login with email/password
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.password) {
    return sendError(res, 'This account uses Google login. Please sign in with Google.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    return sendError(res, 'Account has been deactivated. Contact support.', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateAccessToken(user);

  return sendSuccess(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      referralCode: user.referralCode,
      avatar: user.avatar,
    },
  }, 'Login successful');
};

/**
 * GET /api/auth/google/callback (handled by Passport, this sends the JWT response)
 */
const googleCallback = (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    const token = generateAccessToken(user);
    // Redirect to frontend with token (frontend reads from URL param)
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  return sendSuccess(res, { user }, 'User fetched');
};

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, server-side session clear)
 */
const logout = (req, res) => {
  req.logout?.(() => {});
  return sendSuccess(res, {}, 'Logged out successfully');
};

module.exports = { register, login, googleCallback, getMe, logout };
