const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.chatsphere_token) {
      token = req.cookies.chatsphere_token;
    } else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      const err = new Error('Not authorized, no token');
      err.statusCode = 401;
      return next(err);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const error = new Error('Not authorized, invalid token');
      error.statusCode = 401;
      return next(error);
    }

    const user = await User.findById(decoded.id).select(
      '-password -refreshToken'
    );

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 401;
      return next(err);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = protect;