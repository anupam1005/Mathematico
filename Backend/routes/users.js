const express = require('express');
const router = express.Router();
const { strictAuthenticateToken } = require('../middleware/strictJwtAuth');
const { connectDB } = require('../config/database');

// Import User model - serverless-safe direct import
// The User model uses mongoose.models.User || mongoose.model() pattern
const User = require('../models/User');

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
router.use(strictAuthenticateToken);

// ============= USER MANAGEMENT =============

/**
 * Get current user information
 */
const getCurrentUser = async (req, res) => {
  try {
    await connectDB();
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
        // Normalize status fields for frontend compatibility
        isActive: user.isActive !== false,
        is_active: user.isActive !== false,
        status: user.isActive !== false ? 'active' : 'inactive',
        isEmailVerified: user.isEmailVerified === true,
        email_verified: user.isEmailVerified === true,
        isAdmin: user.role === 'admin',
        is_admin: user.role === 'admin',
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
    await connectDB();

    // Validate authenticated user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const { name } = req.body;
    const updateData = {};
    
    // Only allow name field updates
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Name must be a non-empty string',
          timestamp: new Date().toISOString()
        });
      }
      updateData.name = name.trim();
    }

    // Ensure no data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        timestamp: new Date().toISOString()
      });
    }

    // Verify user exists before update
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Update user with only allowed fields
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== false,
        is_active: user.isActive !== false,
        status: user.isActive !== false ? 'active' : 'inactive',
        isEmailVerified: user.isEmailVerified === true,
        email_verified: user.isEmailVerified === true,
        isAdmin: user.role === 'admin',
        is_admin: user.role === 'admin',
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
    await connectDB();
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
        isActive: user.isActive !== false,
        is_active: user.isActive !== false,
        status: user.isActive !== false ? 'active' : 'inactive',
        isEmailVerified: user.isEmailVerified === true,
        email_verified: user.isEmailVerified === true,
        isAdmin: user.role === 'admin',
        is_admin: user.role === 'admin',
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

// User by ID route (admin only) - keep this LAST to avoid shadowing other routes
router.get('/:id', getUserById);

module.exports = router;
