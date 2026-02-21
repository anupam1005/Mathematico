const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { upload } = require('../utils/fileUpload');
const { strictAuthenticateToken, strictRequireAdmin } = require('../middleware/strictJwtAuth');
const enhancedRateLimiter = require('../middleware/enhancedRateLimiter');
const ensureDatabase = require('../middleware/ensureDatabase');

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
router.post('/login', enhancedRateLimiter, ensureDatabase, authController.login);
router.get('/login', methodNotAllowed('POST', '/login'));
router.post('/register', enhancedRateLimiter, ensureDatabase, authController.register);
router.get('/register', methodNotAllowed('POST', '/register'));
router.post('/logout', ensureDatabase, authController.logout);
router.post('/refresh-token', ensureDatabase, authController.refreshToken);
router.post('/forgot-password', enhancedRateLimiter, ensureDatabase, authController.forgotPassword);
router.post('/reset-password', ensureDatabase, authController.resetPassword);
router.post('/verify-email', ensureDatabase, authController.verifyEmail);

// Health check route
router.get('/health', authController.healthCheck);

// Protected auth routes - require both database and strict authentication
router.get('/profile', ensureDatabase, strictAuthenticateToken, authController.getProfile);

// Import profile controller
let profileController;
try {
  profileController = require('../controllers/profileController');

  // Profile management routes - require both database and strict authentication
  router.put('/profile', ensureDatabase, strictAuthenticateToken, profileController.updateProfile);
  router.post('/profile/picture', ensureDatabase, strictAuthenticateToken, upload.single('profilePicture'), profileController.uploadProfilePicture);
  router.delete('/profile/picture', ensureDatabase, strictAuthenticateToken, profileController.deleteProfilePicture);
  router.put('/change-password', ensureDatabase, strictAuthenticateToken, profileController.changePassword);

  // User preferences routes - require both database and strict authentication
  router.get('/preferences', ensureDatabase, strictAuthenticateToken, profileController.getPreferences);
  router.put('/preferences', ensureDatabase, strictAuthenticateToken, profileController.updatePreferences);
  router.delete('/account', ensureDatabase, strictAuthenticateToken, profileController.deleteAccount);

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
      health: '/health'
    },
    authController: authController ? 'loaded' : 'fallback',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;