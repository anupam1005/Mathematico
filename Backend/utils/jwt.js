const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// JWT Secrets - MUST be different and strong
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Fallback secrets for development (NOT for production)
const FALLBACK_JWT_SECRET = 'ea8d2dd209821c788f00430dbada14059f8729cdb9787927fc66d4b614ce934d8a605ca223405bddd2b4c984ed8490c7c62550d579f1b245754ee2f0c6e6fe33';
const FALLBACK_JWT_REFRESH_SECRET = '4f5093c4703da4e343a60514af3d606f885386828349a58d2cec5c6d66bb829b373361b340518abc1011e697cecd71dfcad0a32cc4a1e05a167e11076877f090';

// Use environment variables or fallback to config values
const ACTUAL_JWT_SECRET = JWT_SECRET || FALLBACK_JWT_SECRET;
const ACTUAL_JWT_REFRESH_SECRET = JWT_REFRESH_SECRET || FALLBACK_JWT_REFRESH_SECRET;

// Validate that secrets are set and different
if (!ACTUAL_JWT_SECRET || !ACTUAL_JWT_REFRESH_SECRET) {
  console.error('❌ CRITICAL: JWT secrets are not available');
  console.error('❌ JWT_SECRET:', JWT_SECRET ? 'SET' : 'NOT SET');
  console.error('❌ JWT_REFRESH_SECRET:', JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');
  throw new Error('❌ CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}

if (ACTUAL_JWT_SECRET === ACTUAL_JWT_REFRESH_SECRET) {
  throw new Error('❌ CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

if (ACTUAL_JWT_SECRET.length < 64 || ACTUAL_JWT_REFRESH_SECRET.length < 64) {
  console.warn('⚠️ WARNING: JWT secrets should be at least 64 characters long for production');
}

console.log('🔑 JWT_SECRET loaded: YES (length:', ACTUAL_JWT_SECRET.length, ')');
console.log('🔑 JWT_REFRESH_SECRET loaded: YES (length:', ACTUAL_JWT_REFRESH_SECRET.length, ')');
console.log('🔑 Using environment variables:', JWT_SECRET ? 'YES' : 'NO (using fallback)');

// Token expiration times
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // Short-lived
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // Long-lived

console.log('⏱️ Access token expires in:', JWT_ACCESS_EXPIRES_IN);
console.log('⏱️ Refresh token expires in:', JWT_REFRESH_EXPIRES_IN);

/**
 * Generate access token
 * @param {Object} payload - User data to include in token
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACTUAL_JWT_SECRET, { 
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
  return jwt.verify(token, ACTUAL_JWT_SECRET, {
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
  
  res.cookie('refreshToken', token, {
    httpOnly: true,        // Prevents JavaScript access
    secure: isProduction,  // HTTPS only in production
    sameSite: 'strict',    // CSRF protection
    maxAge: getTokenExpirationMs(JWT_REFRESH_EXPIRES_IN),
    path: '/api/v1/auth/refresh' // Only send to refresh endpoint
  });
}

/**
 * Clear refresh token cookie
 * @param {Object} res - Express response object
 */
function clearRefreshTokenCookie(res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh'
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
