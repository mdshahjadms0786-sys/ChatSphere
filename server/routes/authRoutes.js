const express = require('express');
const router = express.Router();
const passport = require('passport');
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

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.put('/profile', protect, updateProfile);

module.exports = router;