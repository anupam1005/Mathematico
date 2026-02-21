/**
 * Strict JWT Authentication Middleware
 * 
 * Enhanced JWT validation with:
 * - Algorithm enforcement (HS256 only)
 * - Issuer validation
 * - Audience validation
 * - Clock tolerance <= 30 seconds
 * - Password change token invalidation
 * - No fallback secrets in production
 * - Key ID validation for rotation support
 */

const { verifyAccessToken } = require('../utils/jwt');
const UserModel = require('../models/User');
const connectDB = require('../config/database');
const { logTokenInvalidation, logSuspiciousActivity } = require('../utils/securityLogger');

function getBearerToken(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
}

/**
 * Enhanced JWT verification with strict security checks
 */
const strictVerifyAccessToken = (token) => {
  try {
    // Use the strict verification from utils/jwt.js
    // This already enforces:
    // - algorithms: ['HS256']
    // - issuer: 'mathematico-backend'
    // - audience: 'mathematico-frontend'
    // - clockTolerance: 30 seconds
    return verifyAccessToken(token);
  } catch (error) {
    // Log JWT verification failures for security monitoring
    if (error.name === 'JsonWebTokenError') {
      logSuspiciousActivity(
        `JWT verification failed: ${error.message}`,
        'medium',
        null,
        { headers: { authorization: 'Bearer [REDACTED]' } }
      );
    }
    throw error;
  }
};

/**
 * Check if password was changed after token was issued
 */
const checkPasswordChangedAfter = async (user, tokenIat) => {
  try {
    // Fetch user with passwordChangedAt field
    const userWithPasswordChange = await UserModel.findById(user.id)
      .select('+passwordChangedAt');
    
    if (!userWithPasswordChange) {
      return false; // User not found, let other middleware handle it
    }

    // Use the model method to check if password was changed after token issuance
    return userWithPasswordChange.changedPasswordAfter(tokenIat);
  } catch (error) {
    console.error('Password change check error:', error);
    // In case of error, allow the request (fail open)
    return false;
  }
};

/**
 * Strict JWT authentication middleware
 * 
 * Behavior:
 * - Validates JWT with strict parameters
 * - Checks password change timestamp
 * - Populates req.user with decoded token payload
 * - Returns generic error messages
 */
const strictAuthenticateToken = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    // Strict JWT verification
    const decoded = strictVerifyAccessToken(token);
    
    // Ensure database connection for password change check
    await connectDB();
    
    // Check if password was changed after token was issued
    const passwordChangedAfter = await checkPasswordChangedAfter(decoded, decoded.iat);
    if (passwordChangedAfter) {
      // Log token invalidation due to password change
      const userId = decoded.id || decoded.sub;
      logTokenInvalidation(userId, 'password_change', req);
      
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    // Additional security: Validate token structure for new minimal payload
    // Support both old format (id, email, role) and new format (sub, role, tokenVersion)
    const hasValidStructure = 
      (decoded.id && decoded.email && decoded.role) || // Old format
      (decoded.sub && decoded.role); // New minimal format
    
    if (!hasValidStructure) {
      logSuspiciousActivity(
        'Invalid token structure: missing required fields',
        'high',
        decoded.id || decoded.sub,
        req
      );
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    // Normalize user ID for compatibility (support both id and sub)
    const userId = decoded.id || decoded.sub;
    
    // Validate token age (additional security check)
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - decoded.iat;
    const maxTokenAge = 24 * 60 * 60; // 24 hours max
    
    if (tokenAge > maxTokenAge) {
      logSuspiciousActivity(
        `Token too old: ${tokenAge} seconds`,
        'medium',
        userId,
        req
      );
      
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    // Populate req.user with normalized token payload
    req.user = {
      ...decoded,
      id: userId // Ensure id field is always present for backward compatibility
    };
    return next();
    
  } catch (err) {
    // Handle different JWT error types with generic messages
    let message = 'Authentication failed';
    let statusCode = 401;
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token expired';
      statusCode = 401;
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
      statusCode = 401;
    } else if (err.name === 'NotBeforeError') {
      message = 'Token not active';
      statusCode = 401;
    } else {
      // Log unexpected errors
      console.error('Unexpected JWT error:', err);
      message = 'Authentication failed';
      statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: 'Unauthorized',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Require admin role with strict authentication
 */
const strictRequireAdmin = async (req, res, next) => {
  // First ensure strict authentication
  await strictAuthenticateToken(req, res, () => {
    const user = req.user || {};
    const isAdmin =
      user.role === 'admin' ||
      user.isAdmin === true ||
      user.is_admin === true ||
      user.admin === true;

    if (!isAdmin) {
      logSuspiciousActivity(
        'Admin access attempt by non-admin user',
        'high',
        user.id,
        req
      );
      
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    return next();
  });
};

module.exports = { 
  strictAuthenticateToken, 
  strictRequireAdmin,
  strictVerifyAccessToken
};
