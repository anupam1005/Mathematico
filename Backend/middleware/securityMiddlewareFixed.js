const rateLimit = require('express-rate-limit');
const RedisStore = require('./rateLimitStore');
const { checkRedisHealth, getRedisKey } = require('../utils/redisClient');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Pre-generated dummy bcrypt hash for timing attacks
const DUMMY_BCRYPT_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkOYx4qDi3Fg9KJNvL.nTjGgPNrwKpZ9S';

// Production-safe rate limiter factory
const createRateLimiter = (options) => {
  const { windowMs, max, message, keyGenerator } = options;
  
  // Validate Redis connection in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const redisHealthy = checkRedisHealth();
    if (!redisHealthy) {
      throw new Error('Redis not available - rate limiting requires Redis in production');
    }
  }
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    keyGenerator: (req) => {
      const key = keyGenerator(req);
      return getRedisKey(key);
    },
    store: new RedisStore({ windowMs }),
    standardHeaders: true,
    legacyHeaders: false,
    // Ensure proper resetTime type
    handler: (req, res) => {
      const resetTime = new Date(Date.now() + windowMs);
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
        resetTime: resetTime.toISOString(),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Login-specific rate limiting: 5 attempts per minute per IP
const loginRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    return `login:${ip}`;
  }
});

// Global auth endpoint throttling: 20 requests per minute per IP
const authRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many auth requests. Please slow down.',
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    return `auth:${ip}`;
  }
});

// Brute force detection: 10 failed attempts per 5 minutes per IP
const bruteForceLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 failed attempts
  message: 'Suspicious activity detected. Please try again later.',
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    return `brute:${ip}`;
  }
});

// Security logging utility (production-safe)
const logSecurityEvent = (event, details) => {
  // Sanitize details to prevent sensitive data logging
  const sanitizedDetails = { ...details };
  
  // Remove sensitive fields
  delete sanitizedDetails.password;
  delete sanitizedDetails.refreshToken;
  delete sanitizedDetails.accessToken;
  delete sanitizedDetails.authorization;
  delete sanitizedDetails.Authorization;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...sanitizedDetails,
    environment: process.env.NODE_ENV || 'production'
  };
  
  console.warn('🔒 SECURITY EVENT:', JSON.stringify(logEntry));
};

// Timing attack protection: constant-time comparison
const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// Dummy bcrypt comparison for timing attacks (production-safe)
const dummyBcryptCompare = async () => {
  const dummyInput = crypto.randomBytes(32).toString('hex');
  
  try {
    await bcrypt.compare(dummyInput, DUMMY_BCRYPT_HASH);
  } catch (error) {
    // Ignore dummy comparison errors
  }
};

// Production-safe startup validation
const validateSecurityMiddleware = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const redisHealthy = await checkRedisHealth();
    if (!redisHealthy) {
      throw new Error('Security middleware validation failed: Redis not healthy in production');
    }
    console.log('✅ Security middleware validated - Redis healthy');
  } else {
    console.log('⚠️ Running in development mode - Redis validation skipped');
  }
};

module.exports = {
  loginRateLimit,
  authRateLimit,
  bruteForceLimit,
  logSecurityEvent,
  constantTimeCompare,
  dummyBcryptCompare,
  validateSecurityMiddleware,
};
