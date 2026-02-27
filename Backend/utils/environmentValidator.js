/**
 * Environment Validator and Production Hardening
 * 
 * This module provides comprehensive environment variable validation
 * and production hardening checks for the Mathematico backend.
 */

const crypto = require('crypto');

/**
 * Validate all required environment variables
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  
  // Core required variables
  const requiredVars = [
    'NODE_ENV',
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  // Production-specific required variables
  const productionRequiredVars = [
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'REDIS_URL'
  ];
  
  // Optional but recommended variables
  const recommendedVars = [
    'ALLOWED_ORIGINS',
    'ENABLE_SECURE_PDF',
    'ENABLE_RAZORPAY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'COOKIE_DOMAIN',
    'ENABLE_ENHANCED_RATE_LIMITING'
  ];
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Check production-specific variables
  if (process.env.NODE_ENV === 'production') {
    productionRequiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required production environment variable: ${varName}`);
      }
    });
  }
  
  // Check recommended variables
  recommendedVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Missing recommended environment variable: ${varName}`);
    }
  });
  
  // Validate specific variable formats and values
  validateVariableFormats(errors, warnings);
  
  // Security validations
  validateSecuritySettings(errors, warnings);
  
  // CORS validation
  validateCorsSettings(errors, warnings);
  
  // Feature flag validation
  validateFeatureFlags(errors, warnings);
  
  return { errors, warnings };
}

/**
 * Validate variable formats and values
 */
function validateVariableFormats(errors, warnings) {
  // NODE_ENV validation
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push(`NODE_ENV must be 'development', 'production', or 'test', got: ${nodeEnv}`);
  }
  
  // JWT secret validation
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long for security');
    }
    if (jwtSecret === 'your-secret-key' || jwtSecret === 'secret') {
      errors.push('JWT_SECRET cannot use default/insecure values');
    }
  }
  
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (jwtRefreshSecret) {
    if (jwtRefreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long for security');
    }
    if (jwtRefreshSecret === jwtSecret) {
      errors.push('JWT_REFRESH_SECRET must be different from JWT_SECRET');
    }
  }
  
  // MongoDB URI validation
  const mongodbUri = process.env.MONGODB_URI;
  if (mongodbUri && !mongodbUri.startsWith('mongodb+srv://') && !mongodbUri.startsWith('mongodb://')) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  
  // Redis URL validation
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    if (process.env.NODE_ENV === 'production' && !redisUrl.startsWith('rediss://')) {
      errors.push('REDIS_URL must use rediss:// (TLS) in production');
    }
    if (redisUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
      warnings.push('Using localhost Redis in production is not recommended');
    }
  }
  
  // Port validation
  const port = process.env.PORT;
  if (port && (isNaN(port) || port < 1 || port > 65535)) {
    errors.push('PORT must be a number between 1 and 65535');
  }
}

/**
 * Validate security settings
 */
function validateSecuritySettings(errors, warnings) {
  // Admin credentials validation
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      errors.push('ADMIN_EMAIL must be a valid email address');
    }
  }
  
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    if (adminPassword.length < 8) {
      errors.push('ADMIN_PASSWORD must be at least 8 characters long');
    }
    if (adminPassword === 'password' || adminPassword === '12345678') {
      errors.push('ADMIN_PASSWORD cannot use common/insecure values');
    }
  }
  
  // Cookie domain validation
  const cookieDomain = process.env.COOKIE_DOMAIN;
  if (cookieDomain && cookieDomain.includes('localhost')) {
    warnings.push('Cookie domain set to localhost - ensure this is intentional');
  }
}

/**
 * Validate CORS settings
 */
function validateCorsSettings(errors, warnings) {
  // Check for deprecated CORS variables
  const deprecatedVars = [
    'APP_ORIGIN',
    'ADMIN_ORIGIN', 
    'CORS_ORIGIN',
    'FRONTEND_URL',
    'WEB_URL'
  ];
  
  const hasDeprecatedVars = deprecatedVars.some(varName => process.env[varName]);
  const hasAllowedOrigins = process.env.ALLOWED_ORIGINS;
  
  if (hasDeprecatedVars && !hasAllowedOrigins) {
    warnings.push('Using deprecated CORS variables. Please migrate to ALLOWED_ORIGINS');
  }
  
  if (hasAllowedOrigins) {
    const origins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    
    if (process.env.NODE_ENV === 'production') {
      if (origins.includes('*') || origins.includes('*/*')) {
        errors.push('Wildcard CORS origins are not allowed in production');
      }
      
      origins.forEach(origin => {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          warnings.push(`Localhost origin in production CORS: ${origin}`);
        }
      });
    }
  }
}

/**
 * Validate feature flags
 */
function validateFeatureFlags(errors, warnings) {
  const booleanFlags = [
    'ENABLE_SECURE_PDF',
    'ENABLE_RAZORPAY',
    'ENABLE_FILE_LOGGING',
    'ENABLE_ENHANCED_RATE_LIMITING'
  ];
  
  booleanFlags.forEach(flagName => {
    const value = process.env[flagName];
    if (value !== undefined && value !== 'true' && value !== 'false') {
      errors.push(`${flagName} must be 'true' or 'false', got: ${value}`);
    }
  });
  
  // Check Razorpay configuration consistency
  const razorpayEnabled = process.env.ENABLE_RAZORPAY === 'true';
  const hasRazorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const hasRazorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasRazorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (razorpayEnabled && (!hasRazorpayKeyId || !hasRazorpaySecret)) {
    errors.push('ENABLE_RAZORPAY=true requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }
  
  if (razorpayEnabled && !hasRazorpayWebhookSecret) {
    errors.push('ENABLE_RAZORPAY=true requires RAZORPAY_WEBHOOK_SECRET for webhook security');
  }
  
  if (!razorpayEnabled && (hasRazorpayKeyId || hasRazorpaySecret || hasRazorpayWebhookSecret)) {
    warnings.push('Razorpay credentials configured but ENABLE_RAZORPAY is not true');
  }
  
  // Validate webhook secret strength
  if (hasRazorpayWebhookSecret && hasRazorpayWebhookSecret.length < 32) {
    errors.push('RAZORPAY_WEBHOOK_SECRET must be at least 32 characters long for security');
  }
  
  // Check Cloudinary configuration consistency
  const securePdfEnabled = process.env.ENABLE_SECURE_PDF === 'true';
  const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                             process.env.CLOUDINARY_API_KEY && 
                             process.env.CLOUDINARY_API_SECRET;
  
  if (securePdfEnabled && !hasCloudinaryConfig) {
    warnings.push('ENABLE_SECURE_PDF=true requires Cloudinary configuration for PDF security');
  }
}

/**
 * Generate secure random string for secrets
 */
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check for environment variable conflicts
 */
function checkEnvironmentConflicts() {
  const conflicts = [];
  
  // Check for conflicting origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  const deprecatedOrigins = [
    process.env.APP_ORIGIN,
    process.env.ADMIN_ORIGIN,
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.WEB_URL
  ].filter(Boolean);
  
  if (allowedOrigins && deprecatedOrigins.length > 0) {
    conflicts.push({
      type: 'CORS_ORIGIN_CONFLICT',
      message: 'Both ALLOWED_ORIGINS and deprecated CORS variables are set',
      recommendation: 'Remove deprecated variables and use only ALLOWED_ORIGINS'
    });
  }
  
  // Check for conflicting URL configurations
  const backendUrl = process.env.BACKEND_URL;
  const vercelUrl = process.env.VERCEL_URL;
  
  if (backendUrl && vercelUrl && backendUrl !== vercelUrl) {
    conflicts.push({
      type: 'URL_CONFLICT',
      message: 'BACKEND_URL and VERCEL_URL are different',
      recommendation: 'Use one consistently or remove the redundant one'
    });
  }
  
  return conflicts;
}

/**
 * Production hardening checklist
 */
function getProductionHardeningChecklist() {
  const checklist = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const razorpayEnabled = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  
  // Security checklist items
  checklist.push({
    category: 'Security',
    item: 'JWT secrets are at least 32 characters',
    status: (process.env.JWT_SECRET?.length >= 32 && 
             process.env.JWT_REFRESH_SECRET?.length >= 32) ? 'PASS' : 'FAIL',
    critical: true
  });
  
  checklist.push({
    category: 'Security',
    item: 'No default/insecure secret values',
    status: (!process.env.JWT_SECRET?.includes('default') && 
             !process.env.JWT_SECRET?.includes('secret')) ? 'PASS' : 'FAIL',
    critical: true
  });
  
  checklist.push({
    category: 'Security',
    item: 'Redis uses TLS in production',
    status: (!isProduction || process.env.REDIS_URL?.startsWith('rediss://')) ? 'PASS' : 'FAIL',
    critical: true
  });
  
  checklist.push({
    category: 'Security',
    item: 'CORS does not use wildcards in production',
    status: (!isProduction || !process.env.ALLOWED_ORIGINS?.includes('*')) ? 'PASS' : 'FAIL',
    critical: true
  });
  
  // Feature checklist items
  checklist.push({
    category: 'Security',
    item: 'Razorpay webhook secret is configured',
    status: (!razorpayEnabled || process.env.RAZORPAY_WEBHOOK_SECRET) ? 'PASS' : 'FAIL',
    critical: razorpayEnabled
  });
  
  checklist.push({
    category: 'Features',
    item: 'Enhanced rate limiting is enabled',
    status: (process.env.ENABLE_ENHANCED_RATE_LIMITING !== 'false') ? 'PASS' : 'WARN',
    critical: false
  });
  
  checklist.push({
    category: 'Features',
    item: 'Feature flags are properly configured',
    status: (process.env.ENABLE_SECURE_PDF && process.env.ENABLE_RAZORPAY) ? 'PASS' : 'WARN',
    critical: false
  });
  
  // Configuration checklist items
  checklist.push({
    category: 'Configuration',
    item: 'Admin credentials are configured',
    status: (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) ? 'PASS' : 'FAIL',
    critical: true
  });
  
  checklist.push({
    category: 'Configuration',
    item: 'Database connection is secure',
    status: (process.env.MONGODB_URI?.includes('mongodb+srv://')) ? 'PASS' : 'WARN',
    critical: false
  });
  
  return checklist;
}

/**
 * Run complete environment validation
 */
function runCompleteValidation() {
  const validation = validateEnvironment();
  const conflicts = checkEnvironmentConflicts();
  const checklist = getProductionHardeningChecklist();
  
  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const hasConflicts = conflicts.length > 0;
  const hasFailures = checklist.some(item => item.status === 'FAIL');
  
  if (hasErrors || hasConflicts || hasFailures) {
    console.error('🚨 ENVIRONMENT VALIDATION FAILED');
    console.error('=====================================');
    
    if (validation.errors.length > 0) {
      console.error('\n❌ ERRORS:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
    }
    
    if (conflicts.length > 0) {
      console.error('\n⚠️  CONFLICTS:');
      conflicts.forEach(conflict => {
        console.error(`   - ${conflict.message}`);
        console.error(`     Recommendation: ${conflict.recommendation}`);
      });
    }
    
    if (hasFailures) {
      console.error('\n❌ PRODUCTION HARDENING FAILURES:');
      checklist
        .filter(item => item.status === 'FAIL')
        .forEach(item => console.error(`   - [${item.category}] ${item.item}`));
    }
    
    throw new Error('Environment validation failed. See above for details.');
  }
  
  if (hasWarnings) {
    console.warn('⚠️  ENVIRONMENT WARNINGS:');
    validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  const criticalWarnings = checklist.filter(item => item.status === 'WARN' && item.critical);
  if (criticalWarnings.length > 0) {
    console.warn('\n⚠️  CRITICAL WARNINGS:');
    criticalWarnings.forEach(item => console.warn(`   - [${item.category}] ${item.item}`));
  }
  
  console.log('✅ Environment validation passed');
  
  return {
    valid: true,
    errors: validation.errors,
    warnings: validation.warnings,
    conflicts,
    checklist
  };
}

module.exports = {
  validateEnvironment,
  validateVariableFormats,
  validateSecuritySettings,
  validateCorsSettings,
  validateFeatureFlags,
  checkEnvironmentConflicts,
  getProductionHardeningChecklist,
  generateSecureSecret,
  runCompleteValidation
};
