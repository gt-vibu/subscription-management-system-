const AppError = require('../utils/appError');

/**
 * Validate plan creation payload
 */
const validatePlanCreate = (req, res, next) => {
  const { name, description, price, billingCycle, features } = req.body;

  if (!name || !name.trim()) {
    return next(new AppError('Plan name is required.', 400));
  }

  if (!description || !description.trim()) {
    return next(new AppError('Plan description is required.', 400));
  }

  if (price === undefined || typeof price !== 'number' || price < 0) {
    return next(new AppError('Price must be a positive number in cents.', 400));
  }

  if (billingCycle && !['MONTHLY', 'ANNUAL'].includes(billingCycle)) {
    return next(new AppError('Billing cycle must be either MONTHLY or ANNUAL.', 400));
  }

  if (!features || !Array.isArray(features) || features.length === 0) {
    return next(new AppError('Plan must have a non-empty array of features.', 400));
  }

  next();
};

/**
 * Validate plan updating payload
 */
const validatePlanUpdate = (req, res, next) => {
  const { name, description, price, billingCycle, features } = req.body;

  if (name !== undefined && !name.trim()) {
    return next(new AppError('Plan name cannot be empty.', 400));
  }

  if (description !== undefined && !description.trim()) {
    return next(new AppError('Plan description cannot be empty.', 400));
  }

  if (price !== undefined && (typeof price !== 'number' || price < 0)) {
    return next(new AppError('Price must be a positive number in cents.', 400));
  }

  if (billingCycle !== undefined && !['MONTHLY', 'ANNUAL'].includes(billingCycle)) {
    return next(new AppError('Billing cycle must be either MONTHLY or ANNUAL.', 400));
  }

  if (features !== undefined && (!Array.isArray(features) || features.length === 0)) {
    return next(new AppError('Features must be a non-empty array.', 400));
  }

  next();
};

module.exports = {
  validatePlanCreate,
  validatePlanUpdate
};
