const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's the hardcoded admin
    if (decoded.email === 'dc2006089@gmail.com' && decoded.role === 'admin') {
      req.user = {
        id: 1,
        email: 'dc2006089@gmail.com',
        name: 'Admin User',
        role: 'admin',
        isAdmin: true
      };
      next();
      return;
    }
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    
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
      role: user.role,
      isAdmin: user.role === 'admin'
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token',
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

/**
 * Generate JWT token
 */
const generateJWT = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Verify JWT token (for production)
 */
const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireUser,
  requireUserOrAdmin,
  generateJWT,
  verifyJWT
};
