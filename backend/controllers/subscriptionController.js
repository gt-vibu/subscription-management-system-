const subscriptionService = require('../services/subscriptionService');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all active subscriptions and history for the logged-in user
 */
const getMySubscription = catchAsync(async (req, res) => {
  const details = await subscriptionService.getUserSubscriptionDetails(req.user._id);
  return sendResponse(res, 200, details);
});

/**
 * Subscribe user to a plan (allows multiple subscriptions on different plans)
 */
const subscribeToPlan = catchAsync(async (req, res, next) => {
  const { planId, months, billingCycle } = req.body;
  if (!planId) {
    return next(new AppError('Please provide a planId', 400));
  }

  const sub = await subscriptionService.subscribe(
    req.user._id, 
    planId, 
    billingCycle, 
    months ? Number(months) : undefined
  );
  return sendResponse(res, 201, sub, 'Subscription activated successfully');
});

/**
 * Change a specific active subscription to a different plan
 */
const changePlan = catchAsync(async (req, res, next) => {
  const { planId, subscriptionId, months, billingCycle } = req.body;
  if (!planId) {
    return next(new AppError('Please provide a planId', 400));
  }
  if (!subscriptionId) {
    return next(new AppError('Please provide a subscriptionId to change', 400));
  }

  const result = await subscriptionService.changeSubscriptionPlan(
    req.user._id,
    subscriptionId,
    planId,
    billingCycle,
    months ? Number(months) : undefined
  );
  const message = result.type === 'upgrade' 
    ? 'Subscription upgraded successfully' 
    : 'Subscription downgraded successfully';

  return sendResponse(res, 200, result.subscription, message);
});

/**
 * Cancel an active subscription (optionally by subscriptionId)
 */
const cancelSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.body;
  const cancelledSub = await subscriptionService.cancelSubscription(req.user._id, subscriptionId);
  return sendResponse(res, 200, cancelledSub, 'Subscription cancelled successfully');
});

/**
 * Get all subscriptions (Admin/Super Admin only)
 */
const getAllSubscriptions = catchAsync(async (req, res) => {
  const subscriptions = await subscriptionService.getAllSubscriptions();
  return sendResponse(res, 200, subscriptions);
});

module.exports = {
  getMySubscription,
  subscribeToPlan,
  changePlan,
  cancelSubscription,
  getAllSubscriptions
};
