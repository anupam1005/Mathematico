const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
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
    // Verify JWT token using the proper utility function
    const decoded = verifyAccessToken(token);
    
    // Check if it's the hardcoded admin
    if (decoded.email === 'dc2006089@gmail.com' && decoded.role === 'admin') {
      req.user = {
        id: 1,
        email: 'dc2006089@gmail.com',
        name: 'Admin User',
        role: 'admin',
        isAdmin: true,
        is_admin: true,
        email_verified: true,
        is_active: true
      };
      next();
      return;
    }
    
    // Find user in database using the correct field name
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Set user information in request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isAdmin: user.role === 'admin',
      is_admin: user.role === 'admin',
      email_verified: user.email_verified || true,
      is_active: user.is_active !== false
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to require specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Middleware to require admin role
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to require user role
 */
const requireUser = requireRole('user');

/**
 * Middleware to require either user or admin role
 */
const requireUserOrAdmin = requireRole(['user', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireUser,
  requireUserOrAdmin
};
