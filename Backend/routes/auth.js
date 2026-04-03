const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { upload } = require('../utils/fileUpload');
const { strictAuthenticateToken, strictRequireAdmin } = require('../middleware/strictJwtAuth');
const { asyncHandler } = require('../middleware/serverlessErrorGuard');

const methodNotAllowed = (expectedMethod, path) => (req, res) => {
  res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Use ${expectedMethod} ${path}.`,
    expectedMethod,
    path,
    timestamp: new Date().toISOString()
  });
};

// Public auth routes - all require database connection
router.post('/login', asyncHandler(authController.login));
router.get('/login', methodNotAllowed('POST', '/login'));
router.post('/register', asyncHandler(authController.register));
router.get('/register', methodNotAllowed('POST', '/register'));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.get('/refresh', methodNotAllowed('POST', '/refresh'));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));
router.post('/verify-email', asyncHandler(authController.verifyEmail));

// Health check route
router.get('/health', authController.healthCheck);

// Protected auth routes - require both database and strict authentication
router.get('/profile', strictAuthenticateToken, asyncHandler(authController.getProfile));

// Import profile controller
let profileController;
try {
  profileController = require('../controllers/profileController');

  // Profile management routes - require both database and strict authentication
  router.put('/profile', strictAuthenticateToken, asyncHandler(profileController.updateProfile));
  router.post('/profile/picture', strictAuthenticateToken, upload.single('profilePicture'), asyncHandler(profileController.uploadProfilePicture));
  router.delete('/profile/picture', strictAuthenticateToken, asyncHandler(profileController.deleteProfilePicture));
  router.put('/change-password', strictAuthenticateToken, asyncHandler(profileController.changePassword));

  // User preferences routes - require both database and strict authentication
  router.get('/preferences', strictAuthenticateToken, asyncHandler(profileController.getPreferences));
  router.put('/preferences', strictAuthenticateToken, asyncHandler(profileController.updatePreferences));
  router.delete('/account', strictAuthenticateToken, asyncHandler(profileController.deleteAccount));

} catch (error) {
  console.warn('[AUTH_ROUTES] Optional profile controller failed to load:', error?.message || String(error));
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
      health: '/health'
    },
    authController: authController ? 'loaded' : 'fallback',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;