const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const AppError = require('../utils/appError');

/**
 * Calculate the end date based on billing cycle and optional duration (months)
 */
const calculateEndDate = (billingCycle, startDate = new Date(), months = 1) => {
  const date = new Date(startDate);
  if (billingCycle === 'ANNUAL') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    // Add 30 days * number of months
    date.setDate(date.getDate() + (30 * months));
  }
  return date;
};

/**
 * Get active subscription for a specific user
 */
const getActiveSubscriptionByUserId = async (userId) => {
  return await Subscription.findOne({
    user: userId,
    status: 'ACTIVE'
  }).populate('plan');
};

/**
 * Get subscription details & history for a user
 */
const getUserSubscriptionDetails = async (userId) => {
  const active = await getActiveSubscriptionByUserId(userId);
  const history = await Subscription.find({
    user: userId,
    status: { $ne: 'ACTIVE' }
  }).populate('plan').sort({ createdAt: -1 });

  return { active, history };
};

/**
 * Subscribe a user to a plan
 */
const subscribe = async (userId, planId, months = 1) => {
  // Check if user already has an active subscription
  const existingActive = await getActiveSubscriptionByUserId(userId);
  if (existingActive) {
    throw new AppError('You already have an active subscription. Use Upgrade/Downgrade instead.', 400);
  }

  // Fetch the plan
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }

  if (plan.status === 'ARCHIVED') {
    throw new AppError('This plan is archived and no longer accepting new subscriptions.', 400);
  }

  const startDate = new Date();
  const endDate = calculateEndDate(plan.billingCycle, startDate, months);

  return await Subscription.create({
    user: userId,
    plan: planId,
    status: 'ACTIVE',
    startDate,
    endDate
  });
};

/**
 * Upgrade or Downgrade subscription (switches plan)
 */
const changeSubscriptionPlan = async (userId, newPlanId, months = 1) => {
  const activeSub = await getActiveSubscriptionByUserId(userId);
  if (!activeSub) {
    throw new AppError('You do not have an active subscription to change. Please subscribe first.', 400);
  }

  if (activeSub.plan._id.toString() === newPlanId.toString()) {
    throw new AppError('You are already subscribed to this plan.', 400);
  }

  // Fetch the new plan
  const newPlan = await Plan.findById(newPlanId);
  if (!newPlan) {
    throw new AppError('Target plan not found', 404);
  }

  if (newPlan.status === 'ARCHIVED') {
    throw new AppError('Target plan is archived and cannot be subscribed to.', 400);
  }

  // Determine whether it is an upgrade or downgrade (based on price)
  const isUpgrade = newPlan.price > activeSub.plan.price;
  const actionType = isUpgrade ? 'upgrade' : 'downgrade';

  // For simplicity and clean accounting, we mark the previous active subscription as EXPIRED/CANCELLED
  // and start a fresh subscription cycle for the new plan
  activeSub.status = 'EXPIRED';
  await activeSub.save();

  const startDate = new Date();
  const endDate = calculateEndDate(newPlan.billingCycle, startDate, months);

  const newSub = await Subscription.create({
    user: userId,
    plan: newPlanId,
    status: 'ACTIVE',
    startDate,
    endDate
  });

  return {
    subscription: newSub,
    type: actionType
  };
};

/**
 * Cancel user's active subscription
 */
const cancelSubscription = async (userId) => {
  const activeSub = await getActiveSubscriptionByUserId(userId);
  if (!activeSub) {
    throw new AppError('No active subscription found to cancel.', 400);
  }

  activeSub.status = 'CANCELLED';
  return await activeSub.save();
};

/**
 * Get all subscriptions across the system (Admin only)
 */
const getAllSubscriptions = async () => {
  return await Subscription.find({})
    .populate('user', 'name email')
    .populate('plan', 'name price billingCycle')
    .sort({ createdAt: -1 });
};

module.exports = {
  subscribe,
  changeSubscriptionPlan,
  cancelSubscription,
  getUserSubscriptionDetails,
  getAllSubscriptions,
  getActiveSubscriptionByUserId
};
