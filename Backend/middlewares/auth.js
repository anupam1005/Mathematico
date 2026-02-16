const { verifyAccessToken } = require('../utils/jwt');

const buildUserFromToken = (decoded) => {
  const email = decoded?.email || '';
  const role = decoded?.role || 'student';

  return {
    id: decoded?.id,
    email,
    name: decoded?.name || (email ? email.split('@')[0] : 'User'),
    role,
    isAdmin: role === 'admin',
    is_admin: role === 'admin',
    email_verified: true,
    is_active: true
  };
};

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
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = buildUserFromToken(decoded);
    return next();
  } catch (error) {
    // Prevent double response
    if (res.headersSent) {
      return next(error);
    }
    
    // Provide more specific error messages
    let errorMessage = 'Invalid or expired token';
    if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token format';
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token not active yet';
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    if (!res.headersSent) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    return next();
  }

  if (!req.user.isAdmin && !req.user.is_admin) {
    if (!res.headersSent) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
        timestamp: new Date().toISOString()
      });
    }
    return next();
  }

  next();
};

/**
 * Middleware to check if user is authenticated (any valid user)
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    if (!res.headersSent) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }
    return next();
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
    req.user = buildUserFromToken(decoded);
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