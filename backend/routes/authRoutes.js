const express = require('express');
const router = express.Router();
// const {signup, login} = require('../controllers/authController');
const {signup, login, getMe, logout, forgotPassword, verifyOtp, resetPassword, buildOAuthRedirect} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const passport = require('../config/passport');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Forgot password OTP flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);


const jwt = require('jsonwebtoken');

// ── Google OAuth Routes ───────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: process.env.CLIENT_URL + '/login?error=google_failed'
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(process.env.CLIENT_URL + '/dashboard');
  }
);

// ── GitHub OAuth Routes ───────────────────────────────────────
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { 
    session: false, 
    failureRedirect: process.env.CLIENT_URL + '/login?error=github_failed'
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(process.env.CLIENT_URL + '/dashboard');
  }
);

module.exports = router;
