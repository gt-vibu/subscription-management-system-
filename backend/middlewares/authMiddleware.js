const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

/**
 * Enforce authentication (reject request if token missing/invalid)
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_subscription_jwt_token_key_2026');
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }

    const currentUser = await User.findById(decoded.userId).select('role isActive');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication (allows request if token is missing or invalid)
 */
const optionalProtect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_subscription_jwt_token_key_2026');
    } catch (err) {
      return next();
    }

    const currentUser = await User.findById(decoded.userId).select('role isActive');
    if (currentUser && currentUser.isActive) {
      req.user = currentUser;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  optionalProtect
};
