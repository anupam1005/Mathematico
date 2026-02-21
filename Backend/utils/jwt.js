const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Token expiration times
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // Short-lived
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'; // Long-lived

function getJwtSecrets() {
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET || '').trim();

  // Production security checks
  if (process.env.NODE_ENV === 'production') {
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
    }
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
    if (jwtRefreshSecret.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long in production');
    }
  }

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
  }

  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }

  // Check for weak/default secrets
  const weakSecrets = ['secret', 'jwt-secret', 'default-secret', 'test-secret', '123456', 'password'];
  if (weakSecrets.includes(jwtSecret.toLowerCase()) || weakSecrets.includes(jwtRefreshSecret.toLowerCase())) {
    throw new Error('JWT secrets cannot use weak/default values');
  }

  return { jwtSecret, jwtRefreshSecret };
}

function validateJwtConfig() {
  // Throws if invalid. Intentionally no return value.
  getJwtSecrets();
}

/**
 * Generate access token
 * @param {Object} payload - User data to include in token
 * @returns {string} JWT access token
 */
function generateAccessToken(payload) {
  const { jwtSecret } = getJwtSecrets();

  return jwt.sign(payload, jwtSecret, { 
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
    issuer: 'mathematico-backend',
    audience: 'mathematico-frontend',
    keyid: 'access-key-v1' // Key ID for rotation support
  });
}

/**
 * Generate access token with minimal secure payload
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
function generateMinimalAccessToken(user) {
  const { jwtSecret } = getJwtSecrets();
  
  // Minimal secure payload with tokenVersion for replay detection
  const payload = {
    sub: user._id || user.id,
    role: user.role,
    tokenVersion: user.tokenVersion || 0
  };

  return jwt.sign(payload, jwtSecret, { 
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
    issuer: 'mathematico-backend',
    audience: 'mathematico-frontend',
    keyid: 'access-key-v2' // Updated key ID for new payload format
  });
}

/**
 * Generate refresh token (random string, not JWT)
 * This creates a cryptographically secure random token
 * @returns {string} Random refresh token
 */
function generateRefreshToken() {
  // Generate 64 bytes of random data for enhanced security (512 bits)
  // This exceeds the minimum 256-bit requirement
  return crypto.randomBytes(64).toString('hex');
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
  const { jwtSecret } = getJwtSecrets();

  return jwt.verify(token, jwtSecret, {
    algorithms: ['HS256'], // Explicitly allow only HS256
    issuer: 'mathematico-backend',
    audience: 'mathematico-frontend',
    clockTolerance: 30 // Allow 30 seconds clock skew
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
    path: cookiePath,      // Only send to refresh endpoint
    // Additional security attributes
    domain: process.env.COOKIE_DOMAIN || undefined,
    partitioned: true      // Enable partitioned cookies for better privacy
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
    path: cookiePath,
    domain: process.env.COOKIE_DOMAIN || undefined,
    partitioned: true
  });
}

/**
 * Generate token pair (access + refresh) with minimal secure payload
 * @param {Object} user - User object
 * @returns {Object} Token pair with expiration info
 */
function generateTokenPair(user) {
  // Use minimal secure payload for access token
  const accessToken = generateMinimalAccessToken(user);
  
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

/**
 * Legacy token pair generation for backward compatibility
 * @param {Object} user - User object
 * @returns {Object} Token pair with full payload (deprecated)
 */
function generateLegacyTokenPair(user) {
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
  generateMinimalAccessToken,
  generateRefreshToken,
  generateTokenPair,
  generateLegacyTokenPair, // For backward compatibility
  
  // Token verification
  verifyAccessToken,
  verifyHashedRefreshToken,
  
  // Token hashing
  hashRefreshToken,
  
  // Cookie management
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  
  // Validation (call during startup)
  validateJwtConfig,

  // Utilities
  decodeToken,
  calculateTokenExpiration,
  getTokenExpirationMs
};
