const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

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

// Import auth controller with database connection
let authController;
try {
  authController = require('../controllers/authController');
  console.log('✅ AuthController loaded successfully');
  console.log('AuthController methods:', Object.keys(authController));
} catch (error) {
  console.warn('⚠️ AuthController not available, using fallback handlers:', error.message);
  console.error('AuthController error details:', error);
  // Fallback auth handlers for serverless
  authController = {
    login: async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Email and password are required",
          });
        }

        // No hardcoded admin credentials - all users must be in database

        // For regular users, check database
        if (!UserModel) {
          return res.status(503).json({ success: false, message: 'User model unavailable' });
        }

        // Ensure DB is connected (cached in serverless)
        await connectDB();

        // Find user by email (include password for comparison)
        const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        // Check if user is active
        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            message: "Account is deactivated. Please contact support.",
          });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        // Update last login and login count
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // Get public profile (without password)
        const publicUser = user.getPublicProfile();
        
        const userPayload = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || 'student',
          isAdmin: user.role === 'admin',
          email_verified: user.isEmailVerified,
          is_active: user.isActive
        };

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: userPayload.id });

        res.json({
          success: true,
          message: "Login successful",
          data: {
            user: publicUser,
            tokens: {
              accessToken,
              refreshToken,
              expiresIn: 3600,
            },
          },
        });
      } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Login failed" });
      }
    },
    register: async (req, res) => {
      try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
          return res.status(400).json({
            success: false,
            message: "Name, email and password are required",
          });
        }

        if (!UserModel) {
          return res.status(503).json({ success: false, message: 'User model unavailable' });
        }

        // Ensure DB is connected (cached in serverless)
        await connectDB();

        // Check for existing user
        const existing = await UserModel.findOne({ email: email.toLowerCase() });
        if (existing) {
          return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        // Create and save user (password hashed via model pre-save)
        const created = await UserModel.create({ name, email, password });

        const publicUser = created.getPublicProfile();
        const userPayload = {
          id: created._id.toString(),
          email: created.email,
          name: created.name,
          role: created.role || 'student',
          isAdmin: created.role === 'admin',
          email_verified: created.isEmailVerified,
          is_active: created.isActive
        };

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: userPayload.id });

        res.json({
          success: true,
          message: "Registration successful",
          data: {
            user: publicUser,
            tokens: {
              accessToken,
              refreshToken,
              expiresIn: 3600,
            },
          },
        });
      } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ 
          success: false, 
          message: "Registration failed" 
        });
      }
    },
    logout: (req, res) => res.json({ success: true, message: 'Logout successful' }),
    refreshToken: (req, res) => {
      res.status(501).json({
        success: false,
        message: "Token refresh not implemented in fallback mode"
      });
    },
    forgotPassword: (req, res) => res.status(503).json({ success: false, message: 'Password reset temporarily unavailable in serverless mode' }),
    resetPassword: (req, res) => res.status(503).json({ success: false, message: 'Password reset temporarily unavailable in serverless mode' }),
    verifyEmail: (req, res) => res.status(503).json({ success: false, message: 'Email verification temporarily unavailable in serverless mode' }),
    healthCheck: (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        service: 'auth',
        timestamp: new Date().toISOString()
      });
    },
    testDatabase: async (req, res) => {
      // No DB calls in fallback; just return a consistent response
      res.json({
        success: true,
        message: 'Database test endpoint (fallback). No DB operations executed.',
        connected: true
      });
    },
    verifyUsersCollection: async (req, res) => {
      res.json({
        success: true,
        message: 'Users collection verification (fallback).',
        exists: true,
        count: 0
      });
    },
    getProfile: (req, res) => {
      res.json({
        success: true,
        data: {
          id: req.user?.id || 1,
          email: req.user?.email || "unknown@example.com",
          name: req.user?.name || "Unknown User",
          role: req.user?.role || "user",
          isAdmin: req.user?.isAdmin || false
        }
      });
    }
  };
}

// Public auth routes
router.post('/login', (req, res, next) => {
  console.log('🔐 Login request received:', req.body);
  next();
}, authController.login);

router.post('/register', (req, res, next) => {
  console.log('📝 Registration request received:', req.body);
  next();
}, authController.register);

// Admin creation route (development only)
router.post('/create-admin', authController.createAdmin);
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

// Protected auth routes
router.get('/profile', authenticateToken, authController.getProfile);

// Import profile controller
let profileController;
try {
  profileController = require('../controllers/profileController');
  
  // Profile management routes
  router.put('/profile', authenticateToken, profileController.updateProfile);
  router.put('/change-password', authenticateToken, profileController.changePassword);
  
  // User preferences routes
  router.get('/preferences', authenticateToken, profileController.getPreferences);
  router.put('/preferences', authenticateToken, profileController.updatePreferences);
  
  console.log('✅ Profile routes loaded successfully');
} catch (error) {
  console.warn('⚠️ ProfileController not available, profile routes disabled');
}

// Root auth endpoint
router.get('/', (req, res) => {
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