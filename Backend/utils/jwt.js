const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// JWT Secrets - MUST be different and strong
const ACTUAL_JWT_SECRET = process.env.JWT_SECRET;
const ACTUAL_JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Validate that secrets are set and different
if (!ACTUAL_JWT_SECRET || !ACTUAL_JWT_REFRESH_SECRET) {
  console.warn('⚠️ JWT secrets not configured, using temporary fallback for testing');
  // Don't throw error in production for now, use fallback
}

if (ACTUAL_JWT_SECRET === ACTUAL_JWT_REFRESH_SECRET) {
  throw new Error('❌ CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

// Token expiration times
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // Short-lived
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // Long-lived

/**
 * Generate access token
 * @param {Object} payload - User data to include in token
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  const secret = ACTUAL_JWT_SECRET || 'temp-fallback-secret-for-testing-only';
  return jwt.sign(payload, secret, { 
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: 'mathematico-backend',
    audience: 'mathematico-frontend'
  });
}

/**
 * Generate refresh token (random string, not JWT)
 * This creates a cryptographically secure random token
 * @returns {string} Random refresh token
 */
function generateRefreshToken() {
  // Generate 32 bytes of random data and convert to hex (64 characters)
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash refresh token for secure storage
 * @param {string} token - Plain refresh token
 * @returns {string} Hashed token (SHA-256)
 */
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify hashed refresh token
 * @param {string} plainToken - Plain token from client
 * @param {string} hashedToken - Hashed token from database
 * @returns {boolean} True if tokens match
 */
function verifyHashedRefreshToken(plainToken, hashedToken) {
  const hash = hashRefreshToken(plainToken);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedToken));
}

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyAccessToken(token) {
  const secret = ACTUAL_JWT_SECRET || 'temp-fallback-secret-for-testing-only';
  return jwt.verify(token, secret, {
    issuer: 'mathematico-backend',
    audience: 'mathematico-frontend'
  });
}

/**
 * Get token expiration time in milliseconds
 * @param {string} expiresIn - Expiration string (e.g., '15m', '30d')
 * @returns {number} Expiration time in milliseconds
 */
function getTokenExpirationMs(expiresIn) {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  return value * units[unit];
}

/**
 * Calculate token expiration date
 * @param {string} expiresIn - Expiration string
 * @returns {Date} Expiration date
 */
function calculateTokenExpiration(expiresIn) {
  return new Date(Date.now() + getTokenExpirationMs(expiresIn));
}

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Set secure HTTP-only cookie for refresh token
 * @param {Object} res - Express response object
 * @param {string} token - Refresh token
 */
function setRefreshTokenCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  const cookiePath = '/api/v1/auth/refresh-token';

  res.cookie('refreshToken', token, {
    httpOnly: true,        // Prevents JavaScript access
    secure: isProduction,  // HTTPS only in production
    sameSite,              // Allow cross-origin refresh in production
    maxAge: getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN),
    path: cookiePath // Only send to refresh endpoint
  });
}

/**
 * Clear refresh token cookie
 * @param {Object} res - Express response object
 */
function clearRefreshTokenCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = isProduction ? 'none' : 'lax';
  const cookiePath = '/api/v1/auth/refresh-token';

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: cookiePath
  });
}

/**
 * Generate token pair (access + refresh)
 * @param {Object} user - User object
 * @returns {Object} Token pair with expiration info
 */
function generateTokenPair(user) {
  const accessToken = generateAccessToken({
    id: user._id || user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.role === 'admin'
  });
  
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiry = calculateTokenExpiration(JWT_REFRESH_EXPIRES_IN);
  
  return {
    accessToken,
    refreshToken,
    refreshTokenHash,
    refreshTokenExpiry,
    accessTokenExpiresIn: JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresIn: JWT_REFRESH_EXPIRES_IN
  };
}

module.exports = {
  // Token generation
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  
  // Token verification
  verifyAccessToken,
  verifyHashedRefreshToken,
  
  // Token hashing
  hashRefreshToken,
  
  // Cookie management
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  
  // Utilities
  decodeToken,
  calculateTokenExpiration,
  getTokenExpirationMs
};
