const userService = require('../services/userService');
const { sendPaginatedResponse, sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');

/**
 * Get searchable and paginated users list (Super Admin only)
 */
const getUsersList = async (req, res, next) => {
  try {
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role || '';
    const sortBy = req.query.sortBy || '';
    const sortOrder = req.query.sortOrder || 'asc';

    const { users, total } = await userService.getUsers(searchQuery, page, limit, role, sortBy, sortOrder);

    return sendPaginatedResponse(res, 200, users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

/**
 * Promote or demote user roles (Super Admin only)
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role) {
      return next(new AppError('Please specify the new role (USER, ADMIN, SUPER_ADMIN)', 400));
    }

    // Pass actor ID (req.user._id) to prevent self-role modification
    const updatedUser = await userService.changeRole(targetUserId, role, req.user._id);

    return sendResponse(res, 200, updatedUser, `Role successfully changed to ${role}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user account (Super Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    // Pass actor ID (req.user._id) to prevent self-deletion
    await userService.deleteUser(targetUserId, req.user._id);

    return sendResponse(res, 200, { id: targetUserId }, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user account with specified role (Super Admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return next(new AppError('Please provide name, email, password, and role', 400));
    }

    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return next(new AppError('Invalid role specified', 400));
    }

    // Strong password check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(new AppError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).', 400));
    }

    const newUser = await userService.createUserAccount(name, email, password, role);

    return sendResponse(res, 201, newUser, `Account successfully created with role ${role}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Manually upgrade or downgrade a user's subscription (Super Admin only)
 */
const updateUserSubscription = async (req, res, next) => {
  try {
    const { planId, months, action, subscriptionId, billingCycle } = req.body;
    const targetUserId = req.params.id;

    const result = await userService.changeUserSubscription(targetUserId, {
      action,
      planId,
      subscriptionId,
      months: months ? Number(months) : undefined,
      billingCycle
    });

    return sendResponse(res, 200, result, 'User subscription successfully modified');
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a user account (Admin / Super Admin)
 */
const deactivateUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    const deactivatedUser = await userService.deactivateUser(
      targetUserId,
      req.user._id,
      req.user.role
    );

    return sendResponse(res, 200, deactivatedUser, 'User account deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsersList,
  changeUserRole,
  deleteUser,
  createUser,
  updateUserSubscription,
  deactivateUser
};
