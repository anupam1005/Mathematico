const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../../controllers/authController');

// Import middleware
const { authenticateToken } = require('../../middlewares/auth');

// Test route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working!',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      me: 'GET /api/auth/me'
    },
    timestamp: new Date().toISOString()
  });
});

// Auth routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// Protected routes (authentication required)
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
