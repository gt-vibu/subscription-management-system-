const express = require('express');
const planController = require('../controllers/planController');
const { protect, optionalProtect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { validatePlanCreate, validatePlanUpdate } = require('../validators/planValidator');

const router = express.Router();

// Publicly viewable catalog of plans (checks auth optionally to display archived plans to admins)
router.get('/', optionalProtect, planController.getPlans);
router.get('/:id', planController.getPlanById);

// Admin-only operations for creating, updating, archiving, and restoring plans
router.post('/', protect, restrictTo('ADMIN', 'SUPER_ADMIN'), validatePlanCreate, planController.createPlan);
router.put('/:id', protect, restrictTo('ADMIN', 'SUPER_ADMIN'), validatePlanUpdate, planController.updatePlan);
router.post('/:id/archive', protect, restrictTo('ADMIN', 'SUPER_ADMIN'), planController.archivePlan);
router.post('/:id/restore', protect, restrictTo('ADMIN', 'SUPER_ADMIN'), planController.restorePlan);

module.exports = router;
