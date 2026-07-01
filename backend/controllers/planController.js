const planService = require('../services/planService');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Get subscription plans (users see active, admins see all)
 */
const getPlans = catchAsync(async (req, res) => {
  const isAdmin = req.user && ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
  const plans = await planService.getPlans(isAdmin);
  return sendResponse(res, 200, plans);
});

/**
 * Get plan by ID
 */
const getPlanById = catchAsync(async (req, res) => {
  const plan = await planService.getPlanById(req.params.id);
  return sendResponse(res, 200, plan);
});

/**
 * Create a plan (Admin/Super Admin only)
 */
const createPlan = catchAsync(async (req, res, next) => {
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
});

/**
 * Update plan details (Admin/Super Admin only)
 */
const updatePlan = catchAsync(async (req, res) => {
  const updatedPlan = await planService.updatePlan(req.params.id, req.body, req.user._id, req.user.role);
  return sendResponse(res, 200, updatedPlan, 'Plan updated successfully');
});

/**
 * Archive a plan (Admin/Super Admin only)
 */
const archivePlan = catchAsync(async (req, res) => {
  const archivedPlan = await planService.archivePlan(req.params.id);
  return sendResponse(res, 200, archivedPlan, 'Plan archived successfully');
});

/**
 * Restore a plan (Admin/Super Admin only)
 */
const restorePlan = catchAsync(async (req, res) => {
  const restoredPlan = await planService.restorePlan(req.params.id);
  return sendResponse(res, 200, restoredPlan, 'Plan restored successfully');
});

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  archivePlan,
  restorePlan
};
