const authService = require('../services/authService');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');

/**
 * Utility to parse expiry string (e.g. '30m', '7d') into milliseconds
 */
const parseExpiresIn = (expiresIn) => {
  const match = String(expiresIn).trim().match(/^(\d+)([smhd])$/);
  if (!match) return 30 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 30 * 60 * 1000;
  }
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }

    const user = await authService.registerUser(name, email, password);
    const token = authService.generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: parseExpiresIn(process.env.JWT_EXPIRES_IN || '30m')
    });

    return sendResponse(
      res,
      201,
      { user: { ...user, isVerified: true } },
      'Registration successful.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.loginUser(email, password);
    const token = authService.generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
      maxAge: parseExpiresIn(process.env.JWT_EXPIRES_IN || '30m')
    });

    return sendResponse(res, 200, { user }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user and clear cookie
 */
const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/'
  });
  return sendResponse(res, 200, null, 'Logged out successfully');
};

/**
 * Get details of current authenticated user profile
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user has the ID from the protect middleware
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    return sendResponse(res, 200, { user });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  register,
  login,
  logout,
  getProfile
};
