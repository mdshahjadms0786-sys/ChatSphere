const twilio = require('twilio');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const error = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// Existing auth functions
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return next(error(400, 'Please provide name, email and password'));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(error(400, 'Email already registered'));
    }

    const user = await User.create({ name, email, password, phone });

    generateToken(res, user._id);

    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(error(400, 'Please provide email and password'));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(error(401, 'Invalid email or password'));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(error(401, 'Invalid email or password'));
    }

    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save();

    generateToken(res, user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    res.cookie('chatsphere_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    if (req.user) {
      req.user.status = 'offline';
      req.user.lastSeen = Date.now();
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

// New OTP functions
const normalizePhone = (phone) => {
  if (!phone.startsWith('+')) {
    return '+91' + phone;
  }
  return phone;
};

const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return next(error(400, 'Please provide phone number'));
    }

    const normalizedPhone = normalizePhone(phone);

    const existingUser = await User.findOne({
      phone: normalizedPhone,
      isVerified: true,
    });
    if (existingUser) {
      return next(error(400, 'Phone number already registered'));
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: normalizedPhone, channel: 'sms' });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      phone: normalizedPhone,
    });
  } catch (err) {
    next(err);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp || !name) {
      return next(error(400, 'Please provide phone, otp and name'));
    }

    const normalizedPhone = normalizePhone(phone);

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: normalizedPhone, code: otp });

    if (verificationCheck.status !== 'approved') {
      return next(error(400, 'Invalid or expired OTP'));
    }

    let user = await User.findOne({ phone: normalizedPhone });

    if (user) {
      user.isVerified = true;
      await user.save();
    } else {
      const crypto = require('crypto');
      user = await User.create({
        name,
        phone: normalizedPhone,
        isVerified: true,
        password: crypto.randomBytes(32).toString('hex'),
      });
    }

    generateToken(res, user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Google OAuth functions
const googleCallback = async (req, res, next) => {
  try {
    const user = req.user;
    generateToken(res, user._id);

    user.status = 'online';
    user.lastSeen = Date.now();
    await user.save();

    res.redirect(process.env.CLIENT_URL + '/chat');
  } catch (err) {
    next(err);
  }
};

const googleAuthFailure = (req, res) => {
  res.redirect(process.env.CLIENT_URL + '/login?error=google_auth_failed');
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, about, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(error(404, 'User not found'));
    }

    if (name) user.name = name;
    if (about !== undefined) user.about = about;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  sendOTP,
  verifyOTP,
  googleCallback,
  googleAuthFailure,
  updateProfile,
};
