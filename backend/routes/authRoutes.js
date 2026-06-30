const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const { validateRegister, validateLogin, validateVerifyEmail, validateResendOtp } = require('../validators/authValidator');

const router = express.Router();

// Apply auth rate limiter for login and registration attempts
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);
router.post('/verify-email', authLimiter, validateVerifyEmail, authController.verifyEmail);
router.post('/resend-otp', authLimiter, validateResendOtp, authController.resendOtp);

// Fetch current user details
router.get('/me', protect, authController.getProfile);

module.exports = router;
