const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const router = express.Router();

// Apply auth rate limiter for login and registration attempts
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);

// Fetch current user details
router.get('/me', protect, authController.getProfile);

module.exports = router;
