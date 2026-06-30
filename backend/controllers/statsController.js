const statsService = require('../services/statsService');
const { sendResponse } = require('../utils/responseHandler');

/**
 * Get platform metrics (MRR, user counts, role splits, plan subscribers)
 * Accessible by: ADMIN, SUPER_ADMIN
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await statsService.getPlatformStats();
    return sendResponse(res, 200, stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs for plan price changes
 * Accessible by: SUPER_ADMIN
 */
const getPricingLogs = async (req, res, next) => {
  try {
    const logs = await statsService.getPricingLogs();
    return sendResponse(res, 200, logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getPricingLogs
};
