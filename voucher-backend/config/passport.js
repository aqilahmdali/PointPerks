const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model');
const { generateReferralCode } = require('../utils/referral.util');
const { processReferral } = require('../services/points.service');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Existing user by Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Link to existing email account
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            user.avatar = profile.photos?.[0]?.value || user.avatar;
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        const newReferralCode = generateReferralCode();
        const signupBonus = parseInt(process.env.SIGNUP_BONUS_POINTS) || 100;

        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email,
          avatar: profile.photos?.[0]?.value,
          role: 'user',
          referralCode: newReferralCode,
          points: signupBonus,
          pointsHistory: [{
            type: 'earned',
            points: signupBonus,
            description: 'Welcome bonus points',
            reference: 'SIGNUP_BONUS',
          }],
          isVerified: true,
          lastLogin: new Date(),
        });

        // Apply referral if one was provided before the Google redirect
        const pendingRef = req.session?.pendingReferralCode;
        if (pendingRef) {
          const referrer = await User.findOne({ referralCode: pendingRef });
          if (referrer && referrer._id.toString() !== user._id.toString()) {
            user.referredBy = referrer._id;
            await user.save();
            await processReferral(referrer._id, user._id, pendingRef);
          }
          delete req.session.pendingReferralCode;
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
