const User = require('../models/User');
const AppError = require('../utils/appError');
const subscriptionService = require('./subscriptionService');

/**
 * Get paginated and searchable list of users (Super Admin only)
 */
const getUsers = async (searchQuery = '', page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Optimize search: use standard regex match
  const filter = {};
  if (searchQuery) {
    filter.$or = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { email: { $regex: searchQuery, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ role: 1, name: 1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return { users, total };
};

/**
 * Change a user's role (Super Admin only)
 */
const changeRole = async (targetUserId, newRole, actorId) => {
  // Prevent self-role modification
  if (targetUserId.toString() === actorId.toString()) {
    throw new AppError('You cannot change your own role.', 400);
  }

  // Verify valid role enum
  if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(newRole)) {
    throw new AppError('Invalid role specified.', 400);
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.role = newRole;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Delete / Remove a user from the system
 */
const deleteUser = async (targetUserId, actorId) => {
  // Prevent self-deletion
  if (targetUserId.toString() === actorId.toString()) {
    throw new AppError('You cannot delete your own account.', 400);
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting another Super Admin if needed, but let's allow general management as per requirements
  await User.findByIdAndDelete(targetUserId);
  return { id: targetUserId };
};

/**
 * Create a new user account with specified role (Super Admin only)
 */
const createUserAccount = async (name, email, password, role) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email is already registered.', 400);
  }

  const { generateAndSendOtp } = require('./authService');

  const newUser = new User({
    name,
    email,
    password,
    role,
    isActive: true,
    isVerified: false
  });

  await generateAndSendOtp(newUser);

  const userObj = newUser.toObject();
  delete userObj.password;
  delete userObj.verificationOtpHash;
  delete userObj.verificationOtpExpires;
  return userObj;
};

/**
 * Manually change/override a user's subscription (Super Admin only)
 */
const changeUserSubscription = async (targetUserId, planId, months = 1) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const activeSub = await subscriptionService.getActiveSubscriptionByUserId(targetUserId);

  if (!planId) {
    if (!activeSub) {
      throw new AppError('User does not have an active subscription to cancel.', 400);
    }
    await subscriptionService.cancelSubscription(targetUserId);
    return { status: 'CANCELLED' };
  }

  if (activeSub) {
    const result = await subscriptionService.changeSubscriptionPlan(targetUserId, planId, months);
    return { status: 'UPDATED', subscription: result.subscription };
  } else {
    const sub = await subscriptionService.subscribe(targetUserId, planId, months);
    return { status: 'CREATED', subscription: sub };
  }
};

module.exports = {
  getUsers,
  changeRole,
  deleteUser,
  createUserAccount,
  changeUserSubscription
};
