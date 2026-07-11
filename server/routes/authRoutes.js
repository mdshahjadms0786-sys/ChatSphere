const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  sendOTP,
  verifyOTP,
  googleCallback,
  googleAuthFailure,
  updateProfile,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

// OTP rate limiting: max 3 attempts per phone per 15 min
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP attempts, please try again later' },
  keyGenerator: (req) => req.body.phone || req.ip,
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/api/auth/google/failure',
  session: false,
}), googleCallback);

router.get('/google/failure', googleAuthFailure);

router.post('/send-otp', otpLimiter, sendOTP);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.put('/profile', protect, updateProfile);

module.exports = router;