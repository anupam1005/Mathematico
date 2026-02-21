/**
 * Centralized Security Logger
 * 
 * Logs security events without exposing sensitive data
 * - No passwords or raw tokens
 * - Limited PII (only user ID + IP when necessary)
 * - Structured logging for monitoring
 */

const crypto = require('crypto');

/**
 * Sanitize email for logging (first 3 chars + ***)
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return 'unknown';
  return email.length > 3 ? `${email.substring(0, 3)}***` : '***';
};

/**
 * Sanitize user agent for logging (first 50 chars)
 */
const sanitizeUserAgent = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') return 'unknown';
  return userAgent.substring(0, 50);
};

/**
 * Extract IP address safely with proxy support
 */
const extractIP = (req) => {
  return req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.connection?.remoteAddress || 
         'unknown';
};

/**
 * Generate unique event ID for tracking
 */
const generateEventId = () => {
  return crypto.randomBytes(8).toString('hex');
};

/**
 * Core security logging function
 */
const logSecurityEvent = (eventType, details = {}, req = null) => {
  const eventId = generateEventId();
  const timestamp = new Date().toISOString();
  
  // Base log structure
  const logEntry = {
    eventId,
    timestamp,
    eventType,
    environment: process.env.NODE_ENV || 'development',
    ...details
  };

  // Add request context if available
  if (req) {
    logEntry.request = {
      ip: extractIP(req),
      userAgent: sanitizeUserAgent(req.headers['user-agent']),
      method: req.method,
      path: req.path,
      requestId: req.id || eventId
    };
  }

  // Structured console output for monitoring systems
  console.log('SECURITY_EVENT', JSON.stringify(logEntry));

  return eventId;
};

/**
 * Specific security event loggers
 */

const logFailedLogin = (email, reason, req) => {
  return logSecurityEvent('FAILED_LOGIN', {
    email: sanitizeEmail(email),
    reason, // 'invalid_credentials', 'account_locked', 'rate_limited'
    category: 'authentication'
  }, req);
};

const logAccountLock = (email, lockDuration, req) => {
  return logSecurityEvent('ACCOUNT_LOCK', {
    email: sanitizeEmail(email),
    lockDuration, // in minutes
    category: 'authentication'
  }, req);
};

const logReplayAttack = (userId, req) => {
  return logSecurityEvent('REPLAY_ATTACK', {
    userId,
    category: 'token_security'
  }, req);
};

const logTokenRefresh = (userId, success, req) => {
  return logSecurityEvent('TOKEN_REFRESH', {
    userId,
    success,
    category: 'token_management'
  }, req);
};

const logPasswordChange = (userId, req) => {
  return logSecurityEvent('PASSWORD_CHANGE', {
    userId,
    category: 'account_security'
  }, req);
};

const logSuspiciousActivity = (description, severity, userId = null, req) => {
  return logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    userId,
    description,
    severity, // 'low', 'medium', 'high', 'critical'
    category: 'anomaly_detection'
  }, req);
};

const logRateLimitExceeded = (identifier, limit, window, req) => {
  return logSecurityEvent('RATE_LIMIT_EXCEEDED', {
    identifier,
    limit,
    window,
    category: 'rate_limiting'
  }, req);
};

const logTokenInvalidation = (userId, reason, req) => {
  return logSecurityEvent('TOKEN_INVALIDATION', {
    userId,
    reason, // 'password_change', 'replay_attack', 'admin_action'
    category: 'token_security'
  }, req);
};

module.exports = {
  logSecurityEvent,
  logFailedLogin,
  logAccountLock,
  logReplayAttack,
  logTokenRefresh,
  logPasswordChange,
  logSuspiciousActivity,
  logRateLimitExceeded,
  logTokenInvalidation,
  // Utilities
  sanitizeEmail,
  sanitizeUserAgent,
  extractIP,
  generateEventId
};
