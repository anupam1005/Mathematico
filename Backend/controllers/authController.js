const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

// Auth Controller - Handles authentication requests (No Database Version)

/**
 * User login
 */
const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if it's the admin user
    // SECURITY: Use environment variables for admin credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Admin credentials not configured',
        timestamp: new Date().toISOString()
      });
    }
    
    if (email === adminEmail && password === adminPassword) {
      // Generate JWT tokens for admin
      const userPayload = {
        id: 1,
        email: email,
        name: 'Admin User',
        role: 'admin',
        isAdmin: true,
        is_admin: true,
        email_verified: true,
        is_active: true
      };
      
      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken(userPayload);
      
      console.log('✅ Admin login successful');
      
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userPayload,
          accessToken: accessToken,
          refreshToken: refreshToken,
          tokenType: 'Bearer'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // For non-admin users, return error (no database to check against)
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid credentials. Only admin access is available.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * User registration (disabled - no database)
 */
const register = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User registration is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new access token
    const userPayload = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      isAdmin: decoded.isAdmin,
      is_admin: decoded.is_admin,
      email_verified: decoded.email_verified,
      is_active: decoded.is_active
    };
    
    const newAccessToken = generateAccessToken(userPayload);
    
    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        tokenType: 'Bearer'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid refresh token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Logout (no database to update)
 */
const logout = async (req, res) => {
  return res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
  try {
    // User info is available from the JWT token in req.user
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No user information available',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: {
        user: user
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get user information',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify email (disabled - no database)
 */
const verifyEmail = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Email verification is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Forgot password (disabled - no database)
 */
const forgotPassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password reset is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Reset password (disabled - no database)
 */
const resetPassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password reset is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Change password (disabled - no database)
 */
const changePassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password change is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword
};