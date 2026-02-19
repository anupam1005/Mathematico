const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { upload } = require('../utils/fileUpload');
const { authenticateToken } = require('../middlewares/auth');
const createRateLimitStore = require('../utils/rateLimitStore');

// Login rate limiting - stricter than global limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: { 
    success: false, 
    message: 'Too many login attempts, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore()
});

// Auth rate limiting for other endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many requests, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore()
});

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
router.post('/login', loginLimiter, authController.login);
router.get('/login', methodNotAllowed('POST', '/login'));
router.post('/register', authLimiter, authController.register);
router.get('/register', methodNotAllowed('POST', '/register'));
router.post('/logout', authLimiter, authController.logout);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/verify-email', authLimiter, authController.verifyEmail);

// Health check route
router.get('/health', authController.healthCheck);

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