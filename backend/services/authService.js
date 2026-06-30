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
    process.env.JWT_SECRET,
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

  // Find user and select password, loginAttempts, and lockUntil fields
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  
  if (!user) {
    throw new AppError('Incorrect email or password', 401);
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    throw new AppError(`Your account is temporarily locked. Please try again in ${remainingMinutes} minutes.`, 403);
  }

  // Verify password
  if (!(await user.comparePassword(password))) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
      user.loginAttempts = 0; // Reset counter for next cycle
      await user.save();
      throw new AppError('Your account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.', 403);
    }
    
    await user.save();
    throw new AppError('Incorrect email or password', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
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
