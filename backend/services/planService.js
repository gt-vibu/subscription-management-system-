const Plan = require('../models/Plan');
const PricingLog = require('../models/PricingLog');
const AppError = require('../utils/appError');

/**
 * Get active plans (for user catalog) or all plans (for admin)
 */
const getPlans = async (isAdmin = false) => {
  const query = isAdmin ? {} : { status: 'ACTIVE' };
  // Optimize: project only relevant fields if requested, or return all
  return await Plan.find(query).sort({ price: 1 });
};

/**
 * Get plan by ID
 */
const getPlanById = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  return plan;
};

/**
 * Create a new subscription plan
 */
const createPlan = async (planData) => {
  // Check if a plan with the same name already exists
  const existingPlan = await Plan.findOne({ name: planData.name });
  if (existingPlan) {
    throw new AppError('A plan with this name already exists.', 400);
  }

  return await Plan.create(planData);
};

/**
 * Update plan details and log price updates
 */
const updatePlan = async (planId, updateData, actorId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  // Handle pricing log auditing if price changes
  const oldPrice = plan.price;
  const newPrice = Number(updateData.price);

  if (!isNaN(newPrice) && oldPrice !== newPrice) {
    await PricingLog.create({
      plan: plan._id,
      planName: plan.name,
      oldPrice,
      newPrice,
      changedBy: actorId
    });
  }

  // Update plan fields
  Object.keys(updateData).forEach((key) => {
    plan[key] = updateData[key];
  });

  return await plan.save();
};

/**
 * Archive a subscription plan (sets status to 'ARCHIVED')
 */
const archivePlan = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.status === 'ARCHIVED') {
    throw new AppError('Plan is already archived', 400);
  }

  plan.status = 'ARCHIVED';
  return await plan.save();
};

/**
 * Restore an archived subscription plan (sets status to 'ACTIVE')
 */
const restorePlan = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.status === 'ACTIVE') {
    throw new AppError('Plan is already active', 400);
  }

  plan.status = 'ACTIVE';
  return await plan.save();
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  archivePlan,
  restorePlan
};
