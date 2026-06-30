const AppError = require('../utils/appError');

/**
 * Validate registration parameters
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return next(new AppError('Name is required.', 400));
  }

  if (!email || !email.trim()) {
    return next(new AppError('Email is required.', 400));
  }

  // Basic email regex
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  if (!password) {
    return next(new AppError('Password is required.', 400));
  }

  // Strong password regex: Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return next(new AppError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).', 400));
  }

  next();
};

/**
 * Validate login parameters
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return next(new AppError('Email is required.', 400));
  }

  if (!password) {
    return next(new AppError('Password is required.', 400));
  }

  next();
};

/**
 * Validate email verification parameters
 */
const validateVerifyEmail = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !email.trim()) {
    return next(new AppError('Email is required.', 400));
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  if (!otp || otp.trim().length !== 6) {
    return next(new AppError('Please provide a valid 6-digit verification code.', 400));
  }

  next();
};

/**
 * Validate resend verification parameters
 */
const validateResendOtp = (req, res, next) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return next(new AppError('Email is required.', 400));
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendOtp
};
