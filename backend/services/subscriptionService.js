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
 * Get all active subscriptions for a specific user (supports multi-subscription)
 */
const getActiveSubscriptionsByUserId = async (userId) => {
  return await Subscription.find({
    user: userId,
    status: 'ACTIVE'
  }).populate('plan');
};

/**
 * Get a single active subscription (legacy helper — returns first match)
 */
const getActiveSubscriptionByUserId = async (userId) => {
  return await Subscription.findOne({
    user: userId,
    status: 'ACTIVE'
  }).populate('plan');
};

/**
 * Get subscription details & history for a user (multi-subscription aware)
 */
const getUserSubscriptionDetails = async (userId) => {
  const active = await getActiveSubscriptionsByUserId(userId);
  const history = await Subscription.find({
    user: userId,
    status: { $ne: 'ACTIVE' }
  }).populate('plan').sort({ createdAt: -1 });

  return { active, history };
};

/**
 * Subscribe a user to a plan (allows multiple active subscriptions on different plans)
 */
const subscribe = async (userId, planId, billingCycle = 'MONTHLY', months = 1) => {
  // Normalize billingCycle
  const cycle = (billingCycle || 'MONTHLY').toUpperCase();

  // Check if user already has an active subscription on the SAME plan
  const existingOnSamePlan = await Subscription.findOne({
    user: userId,
    plan: planId,
    status: 'ACTIVE'
  });
  if (existingOnSamePlan) {
    throw new AppError('You are already subscribed to this plan. Choose a different plan or cancel first.', 400);
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
  let endDate;
  let pricePaid;

  if (cycle === 'ANNUAL') {
    pricePaid = Math.round(plan.price * 12 * 0.85); // 15% discount
    endDate = calculateEndDate('ANNUAL', startDate);
  } else {
    pricePaid = plan.price * months;
    endDate = calculateEndDate('MONTHLY', startDate, months);
  }

  return await Subscription.create({
    user: userId,
    plan: planId,
    status: 'ACTIVE',
    billingCycle: cycle,
    pricePaid,
    startDate,
    endDate
  });
};

/**
 * Change a specific active subscription to a new plan
 */
const changeSubscriptionPlan = async (userId, subscriptionId, newPlanId, billingCycle = 'MONTHLY', months = 1) => {
  const cycle = (billingCycle || 'MONTHLY').toUpperCase();

  const activeSub = await Subscription.findOne({
    _id: subscriptionId,
    user: userId,
    status: 'ACTIVE'
  }).populate('plan');

  if (!activeSub) {
    throw new AppError('Active subscription not found.', 400);
  }

  if (activeSub.plan._id.toString() === newPlanId.toString()) {
    throw new AppError('You are already subscribed to this plan.', 400);
  }

  // Check if user already has an active sub on the target plan
  const existingOnTarget = await Subscription.findOne({
    user: userId,
    plan: newPlanId,
    status: 'ACTIVE'
  });
  if (existingOnTarget) {
    throw new AppError('You already have an active subscription on the target plan.', 400);
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

  // Mark previous active subscription as EXPIRED and start a fresh cycle
  activeSub.status = 'EXPIRED';
  await activeSub.save();

  const startDate = new Date();
  let endDate;
  let pricePaid;

  if (cycle === 'ANNUAL') {
    pricePaid = Math.round(newPlan.price * 12 * 0.85); // 15% discount
    endDate = calculateEndDate('ANNUAL', startDate);
  } else {
    pricePaid = newPlan.price * months;
    endDate = calculateEndDate('MONTHLY', startDate, months);
  }

  const newSub = await Subscription.create({
    user: userId,
    plan: newPlanId,
    status: 'ACTIVE',
    billingCycle: cycle,
    pricePaid,
    startDate,
    endDate
  });

  return {
    subscription: newSub,
    type: actionType
  };
};

/**
 * Cancel a specific active subscription by subscription ID
 */
const cancelSubscription = async (userId, subscriptionId) => {
  const query = { user: userId, status: 'ACTIVE' };

  // If subscriptionId is provided, cancel that specific one
  if (subscriptionId) {
    query._id = subscriptionId;
  }

  const activeSub = await Subscription.findOne(query);
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
  getActiveSubscriptionByUserId,
  getActiveSubscriptionsByUserId
};
