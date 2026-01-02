const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Import MongoDB models with safe fallback
let User;
try {
  User = require('../models/User');
  console.log('✅ MongoDB models loaded for users routes');
} catch (error) {
  console.warn('⚠️ User model not available, using fallback user store');
  User = {
    findById: async () => null,
    updateUser: async () => null
  };
}

// Root endpoint (public info)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users API',
    authRequired: true,
    endpoints: {
      me: '/me',
      update: '/me [PUT]',
      getById: '/:id'
    },
    timestamp: new Date().toISOString()
  });
});

// Apply authentication middleware to all protected routes
router.use(authenticateToken);

// ============= USER MANAGEMENT =============

/**
 * Get current user information
 */
const getCurrentUser = async (req, res) => {
  try {
    // Use DB for persistent users (both admin and students)
    const tokenUser = req.user || {};
    if (!tokenUser.id) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    const user = await User.findById(tokenUser.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        is_admin: user.is_admin,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      },
      message: 'User information retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user information',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update current user information
 */
const updateCurrentUser = async (req, res) => {
  try {
    // Database connection handled by controllers

    const { name, email } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Don't allow users to change their role or admin status
    delete updateData.role;
    delete updateData.is_admin;

    const user = await User.updateUser(req.user.id, updateData);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        is_admin: user.is_admin,
        updated_at: user.updatedAt
      },
      message: 'User information updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user information',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user by ID (for admin users)
 */
const getUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        timestamp: new Date().toISOString()
      });
    }

    // Database connection handled by controllers

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        is_admin: user.is_admin,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      },
      message: 'User information retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user information',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= ROUTES =============

// Current user routes
router.get('/me', getCurrentUser);
router.put('/me', updateCurrentUser);

// User by ID route (admin only)
router.get('/:id', getUserById);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Users routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
