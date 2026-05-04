/**
 * environmentValidator.js — Startup environment validation middleware
 *
 * Rules:
 * - FRONTEND_URL required ONLY if ENABLE_WEB_CLIENT=true
 * - MOBILE_DEEP_LINK_URL required if password reset enabled
 * - Auth routes bypass env middleware (never block login/register)
 * - Health route bypasses env middleware
 * - Only hard-fail for: MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
 */

// Cache validation results to avoid repeated checks
let validationCache = {
  validated: false,
  result: null,
  timestamp: null,
  environment: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Core required variables for any deployment
 */
const validateCoreVariables = () => {
  const errors = [];
  
  const mongoUri = (process.env.MONGO_URI || '').trim();
  const jwtSecret = (process.env.JWT_SECRET || '').trim();
  
  if (!mongoUri) {
    errors.push('MONGO_URI is required');
  }
  
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }
  
  return errors;
};

/**
 * Production-specific validation
 */
const validateProductionVariables = () => {
  const errors = [];
  const warnings = [];
  
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const enableWebClient = process.env.ENABLE_WEB_CLIENT === 'true';
  const frontendUrl = (process.env.FRONTEND_URL || '').trim();
  const mobileDeepLinkUrl = (process.env.MOBILE_DEEP_LINK_URL || '').trim();
  
  // Required production variables
  if (!adminEmail) {
    errors.push('ADMIN_EMAIL is required in production');
  } else if (!adminEmail.includes('@')) {
    errors.push('ADMIN_EMAIL must be a valid email address');
  }
  
  if (!adminPassword) {
    errors.push('ADMIN_PASSWORD is required in production');
  } else if (adminPassword.length < 8) {
    errors.push('ADMIN_PASSWORD must be at least 8 characters long');
  }
  
  // Web client validation (conditional)
  if (enableWebClient) {
    if (!frontendUrl) {
      errors.push('FRONTEND_URL is required when ENABLE_WEB_CLIENT=true');
    } else if (!frontendUrl.startsWith('https://')) {
      errors.push('FRONTEND_URL must start with https:// in production');
    }
  } else {
    // Mobile-only deployment - FRONTEND_URL is optional but warn if invalid
    if (frontendUrl && !frontendUrl.startsWith('https://')) {
      warnings.push('FRONTEND_URL should start with https:// in production, but ignoring for mobile-only deployment');
    }
  }
  
  // Mobile deep link URL validation
  if (!mobileDeepLinkUrl) {
    warnings.push('MOBILE_DEEP_LINK_URL is recommended for password reset in mobile apps');
  } else if (!mobileDeepLinkUrl.includes('://')) {
    warnings.push('MOBILE_DEEP_LINK_URL should be a valid deep link scheme (e.g., mathematico://)');
  }
  
  return { errors, warnings };
};

/**
 * Optional service validation (warnings only)
 */
const validateOptionalServices = () => {
  const warnings = [];
  
  // Redis for rate limiting
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  if (!redisUrl) {
    warnings.push('Redis URL not configured - using in-memory rate limiting (less effective)');
  }
  
  // JWT refresh secret
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    warnings.push('JWT_REFRESH_SECRET not configured - using JWT_SECRET as fallback');
  }
  
  // Payment services
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpayKeyId || !razorpayKeySecret) {
    warnings.push('Razorpay credentials not configured - payment features disabled');
  }
  
  // File upload services
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    warnings.push('Cloudinary credentials not configured - file upload features disabled');
  }
  
  return warnings;
};

/**
 * Main validation function
 */
const validateEnvironment = () => {
  const now = Date.now();
  const currentEnv = process.env.NODE_ENV || 'development';
  
  // Check cache
  if (validationCache.validated && 
      validationCache.result && 
      (now - validationCache.timestamp < CACHE_DURATION) &&
      validationCache.environment === currentEnv) {
    return validationCache.result;
  }
  
  const errors = [];
  const warnings = [];
  
  // Core validation (always required)
  errors.push(...validateCoreVariables());
  
  // Production validation
  if (currentEnv === 'production') {
    const prodValidation = validateProductionVariables();
    errors.push(...prodValidation.errors);
    warnings.push(...prodValidation.warnings);
  }
  
  // Optional services (warnings only)
  warnings.push(...validateOptionalServices());
  
  const result = {
    valid: errors.length === 0,
    errors,
    warnings,
    environment: currentEnv,
    timestamp: new Date().toISOString()
  };
  
  // Cache successful validation only
  if (result.valid) {
    validationCache = {
      validated: true,
      result,
      timestamp: now,
      environment: currentEnv
    };
  }
  
  return result;
};

/**
 * Serverless-safe environment validation middleware
 * Never throws, always returns JSON response for errors
 */
const environmentValidator = (req, res, next) => {
  // Bypass environment validation for critical endpoints
  const bypassPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/health',
    '/',
    '/favicon.ico',
    '/favicon.png',
    '/favicon'
  ];
  
  if (bypassPaths.includes(req.path)) {
    return next();
  }
  
  try {
    const validation = validateEnvironment();
    
    if (!validation.valid) {
      console.error('[ENV_VALIDATION] Critical errors detected:', {
        errors: validation.errors,
        path: req.path,
        method: req.method,
        environment: validation.environment
      });
      
      return res.status(500).json({
        success: false,
        error: 'ENVIRONMENT_VALIDATION_ERROR',
        message: 'Server environment is not properly configured',
        errors: validation.errors,
        environment: validation.environment,
        timestamp: validation.timestamp
      });
    }
    
    // Log warnings but don't block
    if (validation.warnings.length > 0) {
      console.warn('[ENV_VALIDATION] Warnings:', {
        warnings: validation.warnings,
        path: req.path,
        environment: validation.environment
      });
    }
    
    return next();
    
  } catch (error) {
    console.error('[ENV_VALIDATION] Unexpected error:', {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      path: req.path
    });
    
    // Never throw - always return JSON response
    return res.status(500).json({
      success: false,
      error: 'ENVIRONMENT_VALIDATION_CRASH',
      message: 'Environment validation encountered an unexpected error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get production hardening checklist
 */
const getServerlessChecklist = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const enableWebClient = process.env.ENABLE_WEB_CLIENT === 'true';
  
  const checklist = [
    {
      item: 'Core variables configured',
      required: true,
      configured: !!(process.env.MONGO_URI && process.env.JWT_SECRET),
      variables: ['MONGO_URI', 'JWT_SECRET']
    },
    {
      item: 'Production admin configured',
      required: isProduction,
      configured: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
      variables: ['ADMIN_EMAIL', 'ADMIN_PASSWORD']
    },
    {
      item: 'Web client configuration',
      required: enableWebClient,
      configured: enableWebClient ? !!process.env.FRONTEND_URL : true,
      variables: enableWebClient ? ['FRONTEND_URL'] : []
    },
    {
      item: 'Mobile deep link configuration',
      required: false,
      configured: !!process.env.MOBILE_DEEP_LINK_URL,
      variables: ['MOBILE_DEEP_LINK_URL']
    },
    {
      item: 'Rate limiting service',
      required: false,
      configured: !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL),
      variables: ['REDIS_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
    },
    {
      item: 'Payment service',
      required: false,
      configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      variables: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET']
    },
    {
      item: 'File upload service',
      required: false,
      configured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      variables: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    }
  ];
  
  return {
    environment: process.env.NODE_ENV,
    isProduction,
    enableWebClient,
    checklist,
    timestamp: new Date().toISOString()
  };
};

/**
 * Health check for environment validator
 */
const environmentValidatorHealthCheck = () => {
  const validation = validateEnvironment();
  
  return {
    status: validation.valid ? 'healthy' : 'unhealthy',
    message: validation.valid ? 'Environment validation passed' : 'Environment validation failed',
    validation,
    cache: {
      cached: validationCache.validated,
      timestamp: validationCache.timestamp,
      environment: validationCache.environment
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  environmentValidator,
  validateEnvironment,
  getServerlessChecklist, // Keep for now as it's a specific term
  environmentValidatorHealthCheck
};
