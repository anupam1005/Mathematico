/**
 * AUTH ENDPOINT PROTECTION STRATEGY - SERVERLESS-SAFE
 * 
 * Login limiter: soft limiter (high threshold), no Redis hard dependency
 * Register limiter: stricter than login, prevent spam accounts  
 * Admin routes: strict limiter, Redis preferred
 * Public routes: soft limiter
 * 
 * NEVER blocks auth endpoints due to service failures
 */

const { authLimiterSoft, authLimiterStrict, adminLimiterStrict, publicLimiterSoft } = require('./rateLimiter');

/**
 * Auth endpoint protection configuration
 */
const authProtection = {
  // Login endpoint - soft limiter, high threshold, never blocks due to Redis issues
  login: authLimiterSoft,
  
  // Register endpoint - stricter than login to prevent spam
  register: authLimiterStrict,
  
  // Admin routes - strict protection
  admin: adminLimiterStrict,
  
  // Public mobile routes - soft protection  
  public: publicLimiterSoft
};

/**
 * Auth protection middleware factory
 */
const createAuthProtection = (type) => {
  const limiter = authProtection[type];
  if (!limiter) {
    console.warn('[AUTH_PROTECTION] Unknown protection type:', type);
    return (req, res, next) => next(); // No protection if type unknown
  }
  return limiter;
};

module.exports = {
  createAuthProtection,
  authProtection,
  authLimiterSoft,
  authLimiterStrict,
  adminLimiterStrict,
  publicLimiterSoft
};
