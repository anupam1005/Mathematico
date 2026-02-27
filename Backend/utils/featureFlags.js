/**
 * Centralized Feature Flag Service
 * 
 * This module provides a centralized way to manage feature flags
 * across the entire backend application. All feature flag checks
 * should use this service instead of direct process.env access.
 */

const featureFlags = {
  // Secure PDF functionality
  securePdf: process.env.ENABLE_SECURE_PDF === 'true',
  
  // Razorpay payment integration
  razorpay: process.env.ENABLE_RAZORPAY === 'true',
  
  // Development/Debug features
  debugMode: process.env.NODE_ENV !== 'production',
  
  // File logging (for non-serverless environments)
  fileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  
  // Enhanced security features
  enhancedRateLimiting: process.env.ENABLE_ENHANCED_RATE_LIMITING !== 'false',
  
  // Request logging in production
  requestLogging: process.env.NODE_ENV === 'production'
};

/**
 * Get all feature flags (for debugging/admin purposes)
 * @returns {Object} All feature flags
 */
function getAllFlags() {
  return { ...featureFlags };
}

/**
 * Check if a specific feature is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean} Whether the feature is enabled
 */
function isFeatureEnabled(flagName) {
  const flag = featureFlags[flagName];
  if (typeof flag !== 'boolean') {
    console.warn(`⚠️ Feature flag '${flagName}' is not defined or not a boolean`);
    return false;
  }
  return flag;
}

/**
 * Get secure PDF feature status
 * @returns {boolean} Whether secure PDF is enabled
 */
function isSecurePdfEnabled() {
  return featureFlags.securePdf;
}

/**
 * Get Razorpay feature status
 * @returns {boolean} Whether Razorpay is enabled
 */
function isRazorpayEnabled() {
  return featureFlags.razorpay;
}

/**
 * Middleware to check if a feature is enabled
 * @param {string} flagName - Name of the feature flag
 * @param {string} errorMessage - Custom error message (optional)
 * @returns {Function} Express middleware function
 */
function requireFeature(flagName, errorMessage = null) {
  return (req, res, next) => {
    if (!isFeatureEnabled(flagName)) {
      const message = errorMessage || `Feature '${flagName}' is not enabled`;
      return res.status(503).json({
        success: false,
        message,
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * Validate feature flag environment variables on startup
 */
function validateFeatureFlags() {
  const errors = [];
  
  // Check for invalid boolean values
  const booleanFlags = [
    'ENABLE_SECURE_PDF',
    'ENABLE_RAZORPAY', 
    'ENABLE_FILE_LOGGING',
    'ENABLE_ENHANCED_RATE_LIMITING'
  ];
  
  booleanFlags.forEach(envVar => {
    const value = process.env[envVar];
    if (value !== undefined && value !== 'true' && value !== 'false') {
      errors.push(`${envVar} must be 'true' or 'false', got: ${value}`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Feature flag validation failed:\n${errors.join('\n')}`);
  }
  
  // Log feature flag status (non-production only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚩 Feature Flags Status:');
    Object.entries(featureFlags).forEach(([flag, enabled]) => {
      console.log(`   ${flag}: ${enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    });
  }
}

module.exports = {
  getAllFlags,
  isFeatureEnabled,
  isSecurePdfEnabled,
  isRazorpayEnabled,
  requireFeature,
  validateFeatureFlags,
  // Export the flags object for direct access (use sparingly)
  flags: featureFlags
};
