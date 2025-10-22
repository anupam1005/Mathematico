const { verifyAccessToken } = require('../utils/jwt');
const mongoose = require('mongoose');

/**
 * Middleware to authenticate JWT token (No Database Version)
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token is required',
      timestamp: new Date().toISOString(),
      instructions: {
        step1: 'Login at /api/v1/auth/login with admin credentials',
        step2: 'Use the returned accessToken in Authorization header',
        step3: 'Format: Authorization: Bearer <your-token>',
        example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      publicInfo: 'Visit /api/v1/admin/info for API information without authentication',
      endpoints: {
        login: '/api/v1/auth/login',
        info: '/api/v1/admin/info',
        health: '/api/v1/auth/health'
      }
    });
  }

  try {
    // Verify JWT token using the proper utility function
    console.log('🔍 Attempting to verify token...');
    console.log('🔍 Token (first 50 chars):', token.substring(0, 50) + '...');
    const decoded = verifyAccessToken(token);
    console.log('✅ Token verified successfully:', { id: decoded.id, email: decoded.email, role: decoded.role, idType: typeof decoded.id });
    
    // Check if it's the admin user (hardcoded email)
    const adminEmail = 'dc2006089@gmail.com';
    if (decoded.email === adminEmail && decoded.role === 'admin') {
      req.user = {
        id: new mongoose.Types.ObjectId(), // Use proper ObjectId instead of number
        email: adminEmail,
        name: 'Admin User',
        role: 'admin',
        isAdmin: true,
        is_admin: true,
        email_verified: true,
        is_active: true
      };
      console.log('✅ Admin user authenticated:', req.user.email);
      return next();
    }
    
    // For regular users, allow access with basic user info
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
      role: decoded.role || 'student',
      isAdmin: decoded.role === 'admin',
      is_admin: decoded.role === 'admin',
      email_verified: true,
      is_active: true
    };
    console.log('✅ Regular user authenticated:', req.user.email);
    return next();
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
      details: error.message
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!req.user.isAdmin && !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Middleware to check if user is authenticated (any valid user)
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const adminEmail = 'dc2006089@gmail.com';
    
    if (decoded.email === adminEmail && decoded.role === 'admin') {
      req.user = {
        id: new mongoose.Types.ObjectId(), // Use proper ObjectId instead of number
        email: adminEmail,
        name: 'Admin User',
        role: 'admin',
        isAdmin: true,
        is_admin: true,
        email_verified: true,
        is_active: true
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Invalid token, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAuth,
  optionalAuth
};