const { verifyAccessToken } = require('../utils/jwt');

/**
 * Middleware to authenticate JWT access tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    console.log('Token verified for user:', user.email, 'Role:', user.role);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token',
      error: 'FORBIDDEN',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
  }

  if (!req.user.isAdmin && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'FORBIDDEN',
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Middleware to check if user is active
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireActiveUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    });
  }

  if (!req.user.is_active && req.user.isActive !== true) {
    return res.status(403).json({
      success: false,
      message: 'Account is inactive',
      error: 'FORBIDDEN',
      timestamp: new Date().toISOString()
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireActiveUser
};
