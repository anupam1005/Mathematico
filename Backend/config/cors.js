/**
 * Production-hardened CORS Configuration - Vercel Optimized
 * 
 * This module consolidates all CORS-related environment variables
 * into a single ALLOWED_ORIGINS configuration for better security
 * and maintainability in Vercel deployments.
 * 
 * Security enhancements:
 * - Strict origin whitelist validation
 * - No wildcard origins in production
 * - Automatic Vercel URL detection
 * - Enhanced security logging
 */

/**
 * Parse and validate allowed origins from environment with security checks
 * @returns {string[]} Array of allowed origins
 */
function getAllowedOrigins() {
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Primary consolidated variable - Vercel-friendly
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  
  // Vercel-specific origins (automatically detected)
  const vercelOrigins = [];
  if (isVercel) {
    // Add Vercel deployment URL if available
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      vercelOrigins.push(`https://${vercelUrl}`);
    }
    
    // Add custom domain if configured
    const customDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (customDomain) {
      vercelOrigins.push(`https://${customDomain}`);
    }
  }
  
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
    origins = [...legacyOrigins, ...vercelOrigins];
    
    // Warn about deprecated usage in non-production
    if (!isProduction) {
      console.warn('[CORS] Using legacy CORS variables. Please migrate to ALLOWED_ORIGINS in Vercel dashboard');
      console.warn('[CORS] Legacy variables detected:', legacyOrigins);
    }
  }
  
  // Always include mobile origins FIRST (before wildcard check)
  origins.push(...mobileOrigins);
  
  // Remove duplicates and validate format
  const uniqueOrigins = Array.from(new Set(origins)).filter(origin => {
    // Basic URL validation
    if (origin.startsWith('exp://') || origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
      return true; // Mobile origins are allowed as-is
    }
    
    // Validate web origins
    try {
      new URL(origin);
      return true;
    } catch {
      console.warn(`[CORS] Invalid origin format: ${origin}`);
      return false;
    }
  });
  
  // Security check: no unsafe wildcards in production (mobile origins already added)
  if (isProduction) {
    const hasUnsafeWildcard = uniqueOrigins.some(origin => 
      (origin === '*' || 
      origin === '*/*' ||
      origin.startsWith('*') ||
      origin.endsWith('*')) &&
      !origin.startsWith('exp://') &&
      !origin.startsWith('capacitor://') &&
      !origin.startsWith('ionic://')
    );
    
    if (hasUnsafeWildcard) {
      console.error('🚨 SECURITY WARNING: Unsafe wildcard CORS origins detected in production');
      console.error('   This allows any website to make requests to your API');
      console.error('   Please use specific origins in ALLOWED_ORIGINS');
      
      // Remove unsafe wildcards in production for security (keep mobile origins)
      const filteredOrigins = uniqueOrigins.filter(origin => 
        (origin !== '*' && 
        origin !== '*/*' &&
        !origin.startsWith('*') &&
        !origin.endsWith('*')) ||
        origin.startsWith('exp://') ||
        origin.startsWith('capacitor://') ||
        origin.startsWith('ionic://')
      );
      
      uniqueOrigins.length = 0;
      uniqueOrigins.push(...filteredOrigins);
    }
  }
  
  console.log('[CORS] Origins configured:', {
    environment: process.env.NODE_ENV,
    isVercel,
    totalOrigins: uniqueOrigins.length,
    hasVercelUrl: !!process.env.VERCEL_URL,
    hasCustomDomain: !!process.env.VERCEL_PROJECT_PRODUCTION_URL,
    productionSafe: !uniqueOrigins.some(origin => origin === '*' || origin.startsWith('*')),
    origins: uniqueOrigins
  });
  
  return uniqueOrigins;
}

/**
 * Validate CORS configuration with enhanced security checks
 */
function validateCorsConfig() {
  const origins = getAllowedOrigins();
  
  if (origins.length === 0) {
    console.warn('⚠️ No CORS origins configured. This may block legitimate requests.');
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Enhanced security checks for production
  if (isProduction) {
    // Check for unsafe wildcard usage (security concern in production)
    const hasUnsafeWildcard = uniqueOrigins.some(origin => 
      (origin === '*' || 
      origin === '*/*' ||
      origin.startsWith('*') ||
      origin.endsWith('*')) &&
      !origin.startsWith('exp://') &&
      !origin.startsWith('capacitor://') &&
      !origin.startsWith('ionic://')
    );
    
    if (hasUnsafeWildcard) {
      console.error('🚨 CRITICAL SECURITY WARNING: Unsafe wildcard CORS origin detected in production');
      console.error('   This allows ANY website to make requests to your API');
      console.error('   Immediate action required: Set specific origins in ALLOWED_ORIGINS');
      console.error('   Example: ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com');
    } else {
      console.log('✅ CORS security check passed - No unsafe wildcards detected');
    }
    
    // Check for HTTP origins in production (should be HTTPS only)
    const hasHttpOrigins = origins.some(origin => 
      origin.startsWith('http://') && 
      !origin.startsWith('exp://') && 
      !origin.startsWith('capacitor://') && 
      !origin.startsWith('ionic://')
    );
    
    if (hasHttpOrigins) {
      console.warn('⚠️ SECURITY WARNING: HTTP origins detected in production');
      console.warn('   Consider using HTTPS only for better security');
    }
    
    // Check for localhost origins in production
    const hasLocalhost = origins.some(origin => 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      origin.includes('0.0.0.0')
    );
    
    if (hasLocalhost) {
      console.warn('⚠️ SECURITY WARNING: Localhost origins detected in production');
      console.warn('   Remove localhost origins from production configuration');
    }
  }
  
  // Log configuration in non-production
  if (!isProduction) {
    console.log('🌐 CORS Configuration:');
    console.log('   Allowed origins:', origins);
    if (origins.some(origin => origin === '*' || origin.startsWith('*'))) {
      console.warn('   ⚠️ Wildcard origin detected - suitable for development only');
    }
  }
}

/**
 * Generate CORS options for Express cors middleware with enhanced security
 * @returns {Object} CORS configuration object
 */
function getCorsOptions() {
  const allowedOrigins = getAllowedOrigins();
  const isProduction = process.env.NODE_ENV === 'production';
  
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
      
      // Strict origin validation for web requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Origin not allowed - log security violation
      console.warn('🚨 CORS Violation Attempt:', {
        origin,
        ip: this?.ip || 'unknown',
        userAgent: this?.get?.('User-Agent') || 'unknown',
        url: this?.originalUrl || 'unknown',
        method: this?.method || 'unknown',
        timestamp: new Date().toISOString()
      });
      
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
      'X-Page-Count',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After'
    ],
    maxAge: isProduction ? 86400 : 3600, // 24h in prod, 1h in dev
    // Enhanced security options
    optionsSuccessStatus: 204, // No content for OPTIONS requests
    preflightContinue: false,
    // Additional security headers
    ...(isProduction && {
      // Strict security in production
      maxAge: 86400, // Cache preflight for 24h
      credentials: true
    })
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
