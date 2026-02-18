const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { upload } = require('../utils/fileUpload');
const authController = require('../controllers/authController');
const { loginWithRateLimit } = require('../controllers/authControllerValidated');

const methodNotAllowed = (expectedMethod, path) => (req, res) => {
  res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Use ${expectedMethod} ${path}.`,
    expectedMethod,
    path,
    timestamp: new Date().toISOString()
  });
};

// Public auth routes
router.post('/login', loginWithRateLimit);
router.get('/login', methodNotAllowed('POST', '/login'));
router.post('/register', authController.register);
router.get('/register', methodNotAllowed('POST', '/register'));
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

// Health check route
router.get('/health', authController.healthCheck);

// Database test route
router.get('/test-database', authController.testDatabase);

// Users collection verification route
router.get('/verify-users', authController.verifyUsersCollection);

// JWT test route
router.get('/test-jwt', authController.testJWT);

// Protected auth routes
router.get('/profile', authenticateToken, authController.getProfile);

// Import profile controller
let profileController;
try {
  profileController = require('../controllers/profileController');

  // Profile management routes
  router.put('/profile', authenticateToken, profileController.updateProfile);
  router.post('/profile/picture', authenticateToken, upload.single('profilePicture'), profileController.uploadProfilePicture);
  router.delete('/profile/picture', authenticateToken, profileController.deleteProfilePicture);
  router.put('/change-password', authenticateToken, profileController.changePassword);

  // User preferences routes
  router.get('/preferences', authenticateToken, profileController.getPreferences);
  router.put('/preferences', authenticateToken, profileController.updatePreferences);
  router.delete('/account', authenticateToken, profileController.deleteAccount);

} catch (error) {
}

// Root auth endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working',
    endpoints: {
      login: '/login',
      register: '/register',
      logout: '/logout',
      refresh: '/refresh-token',
      test: '/test',
      health: '/health'
    },
    authController: authController ? 'loaded' : 'fallback',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;