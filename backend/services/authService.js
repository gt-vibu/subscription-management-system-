const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { excludePassword } = require('../utils/userHelpers');

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
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already registered. Please login instead.', 400);
  }

  const newUser = new User({
    name,
    email,
    password,
    role: 'USER',
    isActive: true,
    isVerified: true
  });

  await newUser.save();

  return excludePassword(newUser);
};

/**
 * Authenticate user credentials
 */
const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  
  if (!user) {
    throw new AppError('Incorrect email or password', 401);
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    throw new AppError(`Your account is temporarily locked. Please try again in ${remainingMinutes} minutes.`, 403);
  }

  if (!(await user.comparePassword(password))) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000;
      user.loginAttempts = 0;
      await user.save();
      throw new AppError('Your account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.', 403);
    }
    
    await user.save();
    throw new AppError('Incorrect email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  return excludePassword(user);
};

module.exports = {
  generateToken,
  registerUser,
  loginUser
};
