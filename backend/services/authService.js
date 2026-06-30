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
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Helper to generate, hash and send an OTP
 */
const generateAndSendOtp = async (user) => {
  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP code using SHA-256 for secure storage
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  // Set OTP fields
  user.verificationOtpHash = otpHash;
  user.verificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

  await user.save();

  // Send the email with the OTP code
  const emailMessage = `Your email verification code is: ${otp}. It will expire in 10 minutes.`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; rounded: 8px;">
      <h2 style="color: #4F46E5; text-align: center;">Verify Your Email Address</h2>
      <p>Hello ${user.name},</p>
      <p>Thank you for registering on our subscription platform. Please enter the following 6-digit verification code to complete your registration:</p>
      <div style="background-color: #F3F4F6; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0; border-radius: 6px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #6B7280;">This code is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Verify Your Email - One-Time Verification Code (OTP)',
    message: emailMessage,
    html: emailHtml
  });
};

/**
 * Register a new user with 'USER' role (unverified by default)
 */
const registerUser = async (name, email, password) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already registered. Please login instead.', 400);
  }

  // Create new user (role is USER by default, isVerified is false by default)
  const newUser = new User({
    name,
    email,
    password,
    role: 'USER',
    isActive: true,
    isVerified: true // Temporarily set to true by default to bypass OTP verification
  });

  // Save the user details
  await newUser.save();

  // Generate and send email verification OTP
  // await generateAndSendOtp(newUser); // Temporarily commented out

  // Exclude password and sensitive verification fields from returned object
  const userObj = newUser.toObject();
  delete userObj.password;
  delete userObj.verificationOtpHash;
  delete userObj.verificationOtpExpires;

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

  // Check if email is verified
  if (!user.isVerified) {
    // Temporarily auto-verify users upon login to bypass OTP
    user.isVerified = true;
    await user.save();
    // await generateAndSendOtp(user);
    // throw new AppError('Your email is not verified. A verification code has been sent to your email.', 403);
  }

  // Exclude password and verification fields from returned object
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.verificationOtpHash;
  delete userObj.verificationOtpExpires;

  return userObj;
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  generateAndSendOtp
};
