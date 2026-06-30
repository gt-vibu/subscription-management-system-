const subscriptionService = require('../services/subscriptionService');
const { sendResponse } = require('../utils/responseHandler');
const AppError = require('../utils/appError');

/**
 * Get all active subscriptions and history for the logged-in user
 */
const getMySubscription = async (req, res, next) => {
  try {
    const details = await subscriptionService.getUserSubscriptionDetails(req.user._id);
    return sendResponse(res, 200, details);
  } catch (error) {
    next(error);
  }
};

/**
 * Subscribe user to a plan (allows multiple subscriptions on different plans)
 */
const subscribeToPlan = async (req, res, next) => {
  try {
    const { planId, months } = req.body;
    if (!planId) {
      return next(new AppError('Please provide a planId', 400));
    }

    const sub = await subscriptionService.subscribe(req.user._id, planId, months ? Number(months) : undefined);
    return sendResponse(res, 201, sub, 'Subscription activated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change a specific active subscription to a different plan
 */
const changePlan = async (req, res, next) => {
  try {
    const { planId, subscriptionId, months } = req.body;
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
      months ? Number(months) : undefined
    );
    const message = result.type === 'upgrade' 
      ? 'Subscription upgraded successfully' 
      : 'Subscription downgraded successfully';

    return sendResponse(res, 200, result.subscription, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an active subscription (optionally by subscriptionId)
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.body;
    const cancelledSub = await subscriptionService.cancelSubscription(req.user._id, subscriptionId);
    return sendResponse(res, 200, cancelledSub, 'Subscription cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all subscriptions (Admin/Super Admin only)
 */
const getAllSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions();
    return sendResponse(res, 200, subscriptions);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySubscription,
  subscribeToPlan,
  changePlan,
  cancelSubscription,
  getAllSubscriptions
};
