const statsService = require('../services/statsService');
const { sendResponse } = require('../utils/responseHandler');
const catchAsync = require('../utils/catchAsync');

/**
 * Get platform metrics (MRR, user counts, role splits, plan subscribers)
 * Accessible by: ADMIN, SUPER_ADMIN
 */
const getPlatformStats = catchAsync(async (req, res) => {
  const stats = await statsService.getPlatformStats();
  return sendResponse(res, 200, stats);
});

/**
 * Get audit logs for plan price changes
 * Accessible by: SUPER_ADMIN
 */
const getPricingLogs = catchAsync(async (req, res) => {
  const logs = await statsService.getPricingLogs();
  return sendResponse(res, 200, logs);
});

/**
 * Get public platform metrics (MRR, user count, active subscriptions, recent users list)
 * Accessible by: PUBLIC
 */
const getPublicStats = catchAsync(async (req, res) => {
  const publicStats = await statsService.getPublicPlatformStats();
  return sendResponse(res, 200, publicStats);
});

module.exports = {
  getPlatformStats,
  getPricingLogs,
  getPublicStats
};
