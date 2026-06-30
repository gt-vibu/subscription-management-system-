const planService = require('../services/planService');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');

/**
 * Get subscription plans (users see active, admins see all)
 */
const getPlans = async (req, res, next) => {
  try {
    // Check if the user is authenticated and is an admin/super admin
    const isAdmin = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const plans = await planService.getPlans(isAdmin);

    return sendResponse(res, 200, plans);
  } catch (error) {
    next(error);
  }
};

/**
 * Get plan by ID
 */
const getPlanById = async (req, res, next) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    return sendResponse(res, 200, plan);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a plan (Admin/Super Admin only)
 */
const createPlan = async (req, res, next) => {
  try {
    const { name, description, price, billingCycle, features } = req.body;

    if (!name || !description || price === undefined || !features) {
      return next(new AppError('Please provide all required fields: name, description, price, features', 400));
    }

    const newPlan = await planService.createPlan({
      name,
      description,
      price,
      billingCycle,
      features
    });

    return sendResponse(res, 201, newPlan, 'Plan created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update plan details (Admin/Super Admin only)
 */
const updatePlan = async (req, res, next) => {
  try {
    // Pass actor ID (req.user._id) to log pricing changes
    const updatedPlan = await planService.updatePlan(req.params.id, req.body, req.user._id);
    return sendResponse(res, 200, updatedPlan, 'Plan updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Archive a plan (Admin/Super Admin only)
 */
const archivePlan = async (req, res, next) => {
  try {
    const archivedPlan = await planService.archivePlan(req.params.id);
    return sendResponse(res, 200, archivedPlan, 'Plan archived successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a plan (Admin/Super Admin only)
 */
const restorePlan = async (req, res, next) => {
  try {
    const restoredPlan = await planService.restorePlan(req.params.id);
    return sendResponse(res, 200, restoredPlan, 'Plan restored successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  archivePlan,
  restorePlan
};
