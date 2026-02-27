/**
 * Centralized CORS Configuration
 * 
 * This module consolidates all CORS-related environment variables
 * into a single ALLOWED_ORIGINS configuration for better security
 * and maintainability.
 */

/**
 * Parse and validate allowed origins from environment
 * @returns {string[]} Array of allowed origins
 */
function getAllowedOrigins() {
  // Primary consolidated variable
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  
  // Fallback to legacy variables for backward compatibility during migration
  const legacyOrigins = [
    process.env.APP_ORIGIN,
    process.env.ADMIN_ORIGIN,
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.WEB_URL
  ].filter(Boolean);
  
  // Mobile and development origins (always allowed)
  const mobileOrigins = [
    'exp://*',
    'capacitor://*',
    'ionic://*'
  ];
  
  let origins = [];
  
  if (allowedOriginsEnv) {
    // Parse comma-separated origins from ALLOWED_ORIGINS
    origins = allowedOriginsEnv
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
  } else {
    // Use legacy origins if ALLOWED_ORIGINS is not set
    origins = legacyOrigins;
    
    // Warn about deprecated usage in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Using legacy CORS variables. Please migrate to ALLOWED_ORIGINS');
      console.warn('   Legacy variables detected:', legacyOrigins);
    }
  }
  
  // Always include mobile origins
  origins.push(...mobileOrigins);
  
  // Remove duplicates and return
  return Array.from(new Set(origins));
}

/**
 * Validate CORS configuration
 */
function validateCorsConfig() {
  const origins = getAllowedOrigins();
  
  if (origins.length === 0) {
    console.warn('⚠️ No CORS origins configured. This may block legitimate requests.');
  }
  
  // Check for wildcard usage (security concern in production)
  const hasWildcard = origins.some(origin => origin === '*' || origin === '*/*');
  
  if (hasWildcard && process.env.NODE_ENV === 'production') {
    console.error('🚨 SECURITY WARNING: Wildcard CORS origin detected in production');
    console.error('   This allows any website to make requests to your API');
    console.error('   Please use specific origins in ALLOWED_ORIGINS');
  }
  
  // Log configuration in non-production
  if (process.env.NODE_ENV !== 'production') {
    console.log('🌐 CORS Configuration:');
    console.log('   Allowed origins:', origins);
    if (hasWildcard) {
      console.warn('   ⚠️ Wildcard origin detected - suitable for development only');
    }
  }
}

/**
 * Generate CORS options for Express cors middleware
 * @returns {Object} CORS configuration object
 */
function getCorsOptions() {
  const allowedOrigins = getAllowedOrigins();
  
  return {
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow Expo development URLs
      if (origin.startsWith('exp://') || origin.includes('expo')) {
        return callback(null, true);
      }
      
      // Allow mobile app origins
      if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
        return callback(null, true);
      }
      
      // Check against allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Origin not allowed
      const error = new Error(`CORS: Origin ${origin} not allowed`);
      error.code = 'CORS_ORIGIN_NOT_ALLOWED';
      return callback(error);
    },
    
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count'
    ],
    maxAge: process.env.NODE_ENV === 'production' ? 86400 : 3600 // 24h in prod, 1h in dev
  };
}

/**
 * Middleware to log CORS violations (security)
 */
function logCorsViolation(req, res, next) {
  const origin = req.get('Origin');
  
  if (origin && !getAllowedOrigins().includes(origin)) {
    console.warn('🚨 CORS Violation Attempt:', {
      origin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

module.exports = {
  getAllowedOrigins,
  validateCorsConfig,
  getCorsOptions,
  logCorsViolation
};
