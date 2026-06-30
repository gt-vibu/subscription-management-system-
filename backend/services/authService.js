const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { sendEmail } = require('./emailService');

/**
 * Generate a JWT token containing the userId and role
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'super_secret_subscription_jwt_token_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
  );
};



const registerUser = async (name, email, password) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already registered. Please login instead.', 400);
  }

  // Create new user (role is USER by default, isVerified is true by default)
  const newUser = new User({
    name,
    email,
    password,
    role: 'USER',
    isActive: true,
    isVerified: true
  });

  // Save the user details
  await newUser.save();

  // Exclude password from returned object
  const userObj = newUser.toObject();
  delete userObj.password;

  return userObj;
};

/**
 * Authenticate user credentials
 */
const loginUser = async (email, password) => {
  // Check if email and password are provided
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Find user and explicitly select password and verification fields
  const user = await User.findOne({ email }).select('+password +verificationOtpHash +verificationOtpExpires');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Exclude password from returned object
  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

module.exports = {
  generateToken,
  registerUser,
  loginUser
};
