const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply super admin protection globally on this router
router.use(protect);
router.use(restrictTo('SUPER_ADMIN'));

router.get('/', userController.getUsersList);
router.post('/', userController.createUser);
router.patch('/:id/role', userController.changeUserRole);
router.patch('/:id/subscription', userController.updateUserSubscription);
router.delete('/:id', userController.deleteUser);

module.exports = router;
