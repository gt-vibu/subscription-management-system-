const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

// User subscription lifecycle routes (restricted to USER role to prevent admins from creating personal user subscriptions)
router.get('/my', protect, subscriptionController.getMySubscription);
router.post('/subscribe', protect, restrictTo('USER'), subscriptionController.subscribeToPlan);
router.post('/change', protect, restrictTo('USER'), subscriptionController.changePlan);
router.post('/cancel', protect, restrictTo('USER'), subscriptionController.cancelSubscription);

// Admin route to retrieve all subscriptions system-wide
router.get('/all', protect, restrictTo('ADMIN', 'SUPER_ADMIN'), subscriptionController.getAllSubscriptions);

module.exports = router;
