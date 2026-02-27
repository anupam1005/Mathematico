const rateLimit = require('express-rate-limit');

/**
 * Create a rate limiter specifically for webhook endpoints
 * Webhooks from Razorpay should be infrequent and predictable
 */
const createWebhookRateLimiter = () => {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 30, // Maximum 30 webhooks per minute (generous for Razorpay)
    message: {
      success: false,
      message: 'Too many webhook requests',
      error: 'RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests from rate limiting
    skipSuccessfulRequests: false,
    // Skip failed requests from rate limiting
    skipFailedRequests: false,
    // Key generator for IP-based limiting
    keyGenerator: (req) => {
      // For webhooks, we primarily limit by source IP
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      console.warn(`Webhook rate limit exceeded for IP: ${req.ip}`);
      
      // Log rate limit violation as security event
      const securityLogger = require('../utils/securityLogger');
      securityLogger.logSecurityEvent({
        eventType: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '1 minute',
        timestamp: new Date().toISOString()
      });
    }
  });
};

module.exports = {
  createWebhookRateLimiter
};
