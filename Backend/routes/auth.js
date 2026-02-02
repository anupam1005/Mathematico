const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { upload } = require('../utils/fileUpload');

// Import dependencies for auth logic
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const connectDB = require('../config/database');
let UserModel;
try {
  UserModel = require('../models/User');
  console.log('✅ User model loaded in auth routes');
} catch (e) {
  console.warn('⚠️ Failed to load User model in auth routes:', e && e.message ? e.message : e);
}

// Import auth controller
const authController = require('../controllers/authController');
console.log('✅ AuthController loaded successfully');

// Public auth routes
router.post('/login', (req, res, next) => {
  console.log('🔐 Login request received:', req.body);
  next();
}, authController.login);

router.post('/register', (req, res, next) => {
  console.log('📝 Registration request received:', req.body);
  next();
}, authController.register);
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
  
  console.log('✅ Profile routes loaded successfully');
} catch (error) {
  console.warn('⚠️ ProfileController not available, profile routes disabled');
}

// Root auth endpoint
router.get('/', (req, res) => {
  console.log('🔐 Auth root endpoint accessed');
  res.json({
    success: true,
    message: 'Auth API is working ✅',
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
  console.log('🔐 Auth test endpoint requested');
  res.json({
    success: true,
    message: 'Auth routes are working ✅',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;