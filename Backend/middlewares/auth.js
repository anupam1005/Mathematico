const { verifyAccessToken } = require('../utils/jwt');

function getBearerToken(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
}

/**
 * Authenticate requests using JWT access tokens.
 * - Reads `Authorization: Bearer <token>`
 * - Populates `req.user` with decoded token payload
 */
function authenticateToken(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required',
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'Unauthorized',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Require admin role.
 * Supports `role: 'admin'` and legacy flags.
 */
function requireAdmin(req, res, next) {
  const user = req.user || {};
  const isAdmin =
    user.role === 'admin' ||
    user.isAdmin === true ||
    user.is_admin === true ||
    user.admin === true;

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      timestamp: new Date().toISOString()
    });
  }

  return next();
}

module.exports = { authenticateToken, requireAdmin };

