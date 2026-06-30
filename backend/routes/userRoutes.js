const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

// All user-management routes require authentication
router.use(protect);

// --- Routes accessible to ADMIN and SUPER_ADMIN ---
router.get('/', restrictTo('ADMIN', 'SUPER_ADMIN'), userController.getUsersList);
router.patch('/:id/subscription', restrictTo('ADMIN', 'SUPER_ADMIN'), userController.updateUserSubscription);
router.patch('/:id/deactivate', restrictTo('ADMIN', 'SUPER_ADMIN'), userController.deactivateUser);

// --- Routes restricted to SUPER_ADMIN only ---
router.post('/', restrictTo('SUPER_ADMIN'), userController.createUser);
router.patch('/:id/role', restrictTo('SUPER_ADMIN'), userController.changeUserRole);
router.delete('/:id', restrictTo('SUPER_ADMIN'), userController.deleteUser);

module.exports = router;
