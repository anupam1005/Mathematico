const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Import dependencies for auth logic
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

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
    login: (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            message: "Email and password are required",
          });
        }

        let userPayload;
        if (email === "dc2006089@gmail.com" && password === "Myname*321") {
          userPayload = {
            id: 1,
            email,
            name: "Admin User",
            role: "admin",
            isAdmin: true,
          };
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: userPayload.id });

        res.json({
          success: true,
          message: "Login successful",
          data: {
            user: {
              ...userPayload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
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
    register: (req, res) => res.status(503).json({ success: false, message: 'Registration temporarily unavailable in serverless mode' }),
    logout: (req, res) => res.json({ success: true, message: 'Logout successful' }),
    refreshToken: (req, res) => {
      try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
          return res.status(400).json({
            success: false,
            message: "Refresh token is required"
          });
        }

        // For demo purposes, generate new tokens
        const userPayload = {
          id: 1,
          email: "dc2006089@gmail.com",
          name: "Admin User",
          role: "admin",
          isAdmin: true,
        };

        const newAccessToken = generateAccessToken(userPayload);
        const newRefreshToken = generateRefreshToken({ id: userPayload.id });

        res.json({
          success: true,
          message: "Token refreshed successfully",
          data: {
            tokens: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              expiresIn: 3600
            }
          }
        });
      } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to refresh token"
        });
      }
    },
    forgotPassword: (req, res) => res.status(503).json({ success: false, message: 'Password reset temporarily unavailable in serverless mode' }),
    resetPassword: (req, res) => res.status(503).json({ success: false, message: 'Password reset temporarily unavailable in serverless mode' }),
    verifyEmail: (req, res) => res.status(503).json({ success: false, message: 'Email verification temporarily unavailable in serverless mode' }),
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
router.post('/login', authController.login);
router.post('/register', authController.register);
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