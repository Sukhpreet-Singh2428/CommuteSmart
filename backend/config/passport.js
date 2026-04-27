const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// ── Google Strategy ──────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          authProvider: 'google',
          emailVerified: true, // OAuth emails are pre-verified
          profilePhoto: profile.photos?.[0]?.value || '',
        });
      } else {
        // Migration: update existing users
        if (!user.googleId || user.authProvider !== 'google') {
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.emailVerified = true;
          
          // Remove fake password if it exists
          if (user.password && user.password.startsWith('oauth-')) {
              user.password = undefined;
          }
          await user.save();
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️ Google OAuth strategy not initialized. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
}

// ── GitHub Strategy ──────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
    scope: ['user:email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || 
                    profile.username + '@github.com';
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username,
          email,
          githubId: profile.id,
          authProvider: 'github',
          emailVerified: true, // OAuth emails are pre-verified
          profilePhoto: profile.photos?.[0]?.value || '',
        });
      } else {
        // Migration: update existing users
        if (!user.githubId || user.authProvider !== 'github') {
          user.githubId = profile.id;
          user.authProvider = 'github';
          user.emailVerified = true;
          
          // Remove fake password if it exists
          if (user.password && user.password.startsWith('oauth-')) {
              user.password = undefined;
          }
          await user.save();
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('⚠️ GitHub OAuth strategy not initialized. Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.');
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
