const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Import auth controller
let authController;
try {
  authController = require('../controllers/authController');
} catch (error) {
  console.warn('AuthController not available, using fallback handlers');
  // Fallback handlers if controller is missing
  authController = {
    login: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' }),
    register: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' }),
    logout: (req, res) => res.json({ success: true, message: 'Logout successful' }),
    refreshToken: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' }),
    forgotPassword: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' }),
    resetPassword: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' }),
    verifyEmail: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' }),
    getProfile: (req, res) => res.status(503).json({ success: false, message: 'Auth service temporarily unavailable' })
  };
}

// Public auth routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// Protected auth routes
router.get('/profile', authenticateToken, authController.getProfile);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working ✅',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;