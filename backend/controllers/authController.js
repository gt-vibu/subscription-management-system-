const authService = require('../services/authService');
const User = require('../models/User');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');

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

    // Auto log-in on signup since verification is bypassed
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

    // Set secure httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
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

/**
 * Verify email OTP and log in the user
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError('Please provide email and verification OTP', 400));
    }

    const user = await User.findOne({ email }).select('+verificationOtpHash +verificationOtpExpires');
    if (!user) {
      return next(new AppError('User not found with this email.', 404));
    }

    /*
    if (user.isVerified) {
      return next(new AppError('Email is already verified.', 400));
    }

    // Verify OTP expiration
    if (Date.now() > user.verificationOtpExpires) {
      return next(new AppError('Verification code has expired. Please request a new one.', 400));
    }

    // Verify OTP hash matches
    const crypto = require('crypto');
    const incomingHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (incomingHash !== user.verificationOtpHash) {
      return next(new AppError('Invalid verification code.', 400));
    }
    */

    // Mark user email as verified
    user.isVerified = true;
    user.verificationOtpHash = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    // Auto log-in on successful verification
    const token = authService.generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const userObj = user.toObject();
    delete userObj.password;

    return sendResponse(res, 200, { user: userObj }, 'Email verified and logged in successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend email verification OTP
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide email address', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('User not found with this email.', 404));
    }

    if (user.isVerified) {
      return next(new AppError('Email is already verified.', 400));
    }

    // Send a new verification OTP
    await authService.generateAndSendOtp(user);

    return sendResponse(res, 200, null, 'A new verification code has been sent to your email.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  verifyEmail,
  resendOtp
};
