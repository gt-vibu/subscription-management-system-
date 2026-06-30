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
 * Supports optional retroactive pricing toggle that adjusts active subscriptions
 */
const updatePlan = async (planId, updateData, actorId, actorRole) => {
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
      changedBy: actorId,
      actorRole: actorRole || 'SUPER_ADMIN'
    });

    // Retroactive pricing: adjust active subscriptions if flag is set
    if (updateData.retroactive === true && oldPrice > 0) {
      const Subscription = require('../models/Subscription');
      const activeSubscriptions = await Subscription.find({
        plan: plan._id,
        status: 'ACTIVE'
      });

      const priceRatio = oldPrice / newPrice; // > 1 means price decreased (extend), < 1 means price increased (shorten)

      for (const sub of activeSubscriptions) {
        const now = new Date();
        const remainingMs = sub.endDate.getTime() - now.getTime();
        if (remainingMs > 0) {
          const adjustedRemainingMs = Math.round(remainingMs * priceRatio);
          sub.endDate = new Date(now.getTime() + adjustedRemainingMs);
          await sub.save();
        }
      }
    }
  }

  // Update plan fields (exclude retroactive flag from being saved to the plan document)
  const { retroactive, ...fieldsToUpdate } = updateData;
  Object.keys(fieldsToUpdate).forEach((key) => {
    plan[key] = fieldsToUpdate[key];
  });

  return await plan.save();
};

/**
 * Archive a subscription plan (sets status to 'ARCHIVED')
 * Includes active subscriber count for pre-archive confirmation
 */
const archivePlan = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.status === 'ARCHIVED') {
    throw new AppError('Plan is already archived', 400);
  }

  // Count active subscribers on this plan for confirmation
  const Subscription = require('../models/Subscription');
  const activeSubscriberCount = await Subscription.countDocuments({
    plan: plan._id,
    status: 'ACTIVE'
  });

  plan.status = 'ARCHIVED';
  const archivedPlan = await plan.save();

  // Return plan with subscriber count metadata
  const result = archivedPlan.toObject();
  result.activeSubscriberCount = activeSubscriberCount;
  return result;
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
