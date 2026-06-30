const express = require('express');
const statsController = require('../controllers/statsController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply auth protection globally
router.use(protect);

// Platform stats accessible by admins
router.get('/', restrictTo('ADMIN', 'SUPER_ADMIN'), statsController.getPlatformStats);

// Pricing log audits accessible specifically by super admin
router.get('/pricing-logs', restrictTo('SUPER_ADMIN'), statsController.getPricingLogs);

module.exports = router;
