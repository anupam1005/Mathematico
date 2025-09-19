const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../../controllers/authController');
const profileController = require('../../controllers/profileController');

// Import middleware
const { authenticateToken, requireUserOrAdmin } = require('../../middlewares/auth');

// Shared API routes (auth, profile, etc.)
// These routes are accessible by both mobile and admin users

// Authentication routes (no auth required)
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// User profile routes (auth required)
router.get('/me', authenticateToken, requireUserOrAdmin, profileController.getProfile);
router.put('/me', authenticateToken, requireUserOrAdmin, profileController.updateProfile);
router.put('/me/password', authenticateToken, requireUserOrAdmin, profileController.changePassword);
router.put('/me/avatar', authenticateToken, requireUserOrAdmin, profileController.updateAvatar);

// User preferences
router.get('/preferences', authenticateToken, requireUserOrAdmin, profileController.getPreferences);
router.put('/preferences', authenticateToken, requireUserOrAdmin, profileController.updatePreferences);

// User notifications
router.get('/notifications', authenticateToken, requireUserOrAdmin, profileController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, requireUserOrAdmin, profileController.markNotificationAsRead);
router.put('/notifications/read-all', authenticateToken, requireUserOrAdmin, profileController.markAllNotificationsAsRead);

// User activity
router.get('/activity', authenticateToken, requireUserOrAdmin, profileController.getActivity);
router.get('/activity/recent', authenticateToken, requireUserOrAdmin, profileController.getRecentActivity);

// Health check for auth service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
