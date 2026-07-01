const authService = require('../services/authService');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { getTokenCookieOptions, getClearCookieOptions } = require('../utils/cookieConfig');

/**
 * Register a new user
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password', 400));
  }

  const user = await authService.registerUser(name, email, password);
  const token = authService.generateToken(user._id, user.role);

  res.cookie('token', token, getTokenCookieOptions());

  return sendResponse(
    res,
    201,
    { user: { ...user, isVerified: true }, token },
    'Registration successful.'
  );
});

/**
 * Log in an existing user
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await authService.loginUser(email, password);
  const token = authService.generateToken(user._id, user.role);

  res.cookie('token', token, getTokenCookieOptions());

  return sendResponse(res, 200, { user, token }, 'Login successful');
});

/**
 * Log out user and clear cookie
 */
const logout = (req, res) => {
  res.clearCookie('token', getClearCookieOptions());
  return sendResponse(res, 200, null, 'Logged out successfully');
};

/**
 * Get details of current authenticated user profile
 */
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return sendResponse(res, 200, { user });
});

module.exports = {
  register,
  login,
  logout,
  getProfile
};
