const User = require('../models/User');
const AppError = require('../utils/appError');
const subscriptionService = require('./subscriptionService');

/**
 * Escape special regex characters in user input to prevent ReDoS / NoSQL injection.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Get paginated and searchable list of users (Super Admin only)
 */
const getUsers = async (searchQuery = '', page = 1, limit = 10, role = '', sortBy = '', sortOrder = 'asc') => {
  const skip = (page - 1) * limit;

  const filter = {};
  if (searchQuery) {
    const sanitized = escapeRegex(searchQuery);
    filter.$or = [
      { name: { $regex: sanitized, $options: 'i' } },
      { email: { $regex: sanitized, $options: 'i' } }
    ];
  }

  if (role && role !== 'ALL') {
    const allowedRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
    const upperRole = role.toUpperCase();
    if (allowedRoles.includes(upperRole)) {
      filter.role = upperRole;
    }
  }

  let sortOptions = { role: 1, name: 1 };
  const allowedSortFields = ['name', 'email', 'role', 'createdAt', 'isActive'];
  if (sortBy && allowedSortFields.includes(sortBy)) {
    sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(sortOptions)
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

  const newUser = new User({
    name,
    email,
    password,
    role,
    isActive: true,
    isVerified: true
  });

  await newUser.save();

  const userObj = newUser.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Manually change/override a user's subscription (Super Admin only)
 */
const changeUserSubscription = async (targetUserId, planIdOrData, months = 1) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Handle case where planIdOrData is an object (new behavior)
  if (planIdOrData && typeof planIdOrData === 'object') {
    const { action, planId, subscriptionId, months: optMonths, billingCycle } = planIdOrData;
    const finalMonths = optMonths ? Number(optMonths) : months;

    if (action === 'subscribe') {
      if (!planId) {
        throw new AppError('Plan ID is required to subscribe.', 400);
      }
      const sub = await subscriptionService.subscribe(targetUserId, planId, billingCycle, finalMonths);
      return { status: 'CREATED', subscription: sub };
    }

    if (action === 'cancel') {
      if (!subscriptionId) {
        throw new AppError('Subscription ID is required to cancel.', 400);
      }
      const sub = await subscriptionService.cancelSubscription(targetUserId, subscriptionId);
      return { status: 'CANCELLED', subscription: sub };
    }

    if (action === 'change') {
      if (!subscriptionId || !planId) {
        throw new AppError('Subscription ID and Plan ID are required to change subscription.', 400);
      }
      const result = await subscriptionService.changeSubscriptionPlan(targetUserId, subscriptionId, planId, billingCycle, finalMonths);
      return { status: 'UPDATED', subscription: result.subscription };
    }
  }

  // Legacy fallback (when planIdOrData is a string or null representing planId)
  const planId = planIdOrData;
  const activeSub = await subscriptionService.getActiveSubscriptionByUserId(targetUserId);

  if (!planId) {
    if (!activeSub) {
      throw new AppError('User does not have an active subscription to cancel.', 400);
    }
    await subscriptionService.cancelSubscription(targetUserId, activeSub._id);
    return { status: 'CANCELLED' };
  }

  if (activeSub) {
    const result = await subscriptionService.changeSubscriptionPlan(targetUserId, activeSub._id, planId, months);
    return { status: 'UPDATED', subscription: result.subscription };
  } else {
    const sub = await subscriptionService.subscribe(targetUserId, planId, months);
    return { status: 'CREATED', subscription: sub };
  }
};

/**
 * Deactivate a user account (Admin / Super Admin)
 */
const deactivateUser = async (targetUserId, actorId, actorRole) => {
  // Prevent self-deactivation
  if (targetUserId.toString() === actorId.toString()) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent Admin from deactivating Super Admin accounts
  if (actorRole === 'ADMIN' && user.role === 'SUPER_ADMIN') {
    throw new AppError('Admins cannot deactivate Super Admin accounts.', 403);
  }

  if (!user.isActive) {
    throw new AppError('User account is already deactivated.', 400);
  }

  user.isActive = false;
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

module.exports = {
  getUsers,
  changeRole,
  deleteUser,
  createUserAccount,
  changeUserSubscription,
  deactivateUser
};
