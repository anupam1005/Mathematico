/**
 * rateLimiter.js — In-memory rate limiter middleware
 *
 * Guarantees:
 * - Never throws exceptions
 * - Never ends request lifecycle unexpectedly
 * - Always calls next() on non-limited requests
 * - Always returns JSON responses on 429
 */

const crypto = require('crypto');

// Rate limiter configurations
const RATE_LIMITER_CONFIGS = {
  authLimiterSoft: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // High threshold for auth
    message: 'Too many authentication attempts. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  authLimiterStrict: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 10, // Stricter for registration
    message: 'Too many registration attempts. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  adminLimiterStrict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Very strict for admin
    message: 'Too many admin attempts. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  publicLimiterSoft: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Very permissive for public routes
    message: 'Too many requests. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }
};

// In-memory store (persists for the lifetime of the process on Railway/Render)
const memoryStore = new Map();

/**
 * Safe IP resolution — supports proxies (Railway, Render, Fly.io all set X-Forwarded-For)
 */
const getClientIp = (req) => {
  try {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (forwardedFor && typeof forwardedFor === 'string') {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      const firstValidIp = ips.find(ip => ip && ip !== 'unknown' && ip !== '');
      if (firstValidIp) {
        return firstValidIp;
      }
    }

    // Try socket.remoteAddress
    const socketIp = req.socket?.remoteAddress;
    if (socketIp && typeof socketIp === 'string' && socketIp !== 'unknown' && socketIp !== '') {
      return socketIp;
    }

    // Try connection.remoteAddress (legacy)
    const connectionIp = req.connection?.remoteAddress;
    if (connectionIp && typeof connectionIp === 'string' && connectionIp !== 'unknown' && connectionIp !== '') {
      return connectionIp;
    }

    // Try Express req.ip
    const expressIp = req.ip;
    if (expressIp && typeof expressIp === 'string' && expressIp !== 'unknown' && expressIp !== '') {
      return expressIp;
    }
  } catch (error) {
    // Never throw - always fall back safely
    console.warn('[RATE_LIMITER] IP resolution failed:', error?.message || 'Unknown error');
  }

  // Safe fallback for all failure cases
  return null; // null indicates anonymous bucket
};

/**
 * Safe IP normalization for rate limiting
 */
const normalizeIp = (ip) => {
  if (!ip || typeof ip !== 'string') {
    return 'anonymous';
  }

  let normalizedIp = ip.trim();

  // Strip IPv4-mapped IPv6 prefix
  if (normalizedIp.startsWith('::ffff:')) {
    normalizedIp = normalizedIp.substring(7);
  }

  // Handle IPv6 safely with subnet hashing
  if (normalizedIp.includes(':') && !normalizedIp.includes('.')) {
    try {
      const segments = normalizedIp.split(':');
      const prefix = segments.slice(0, 4).join(':'); // /64 prefix
      const hash = crypto.createHash('sha256').update(prefix).digest('hex').slice(0, 16);
      return `ipv6_${hash}`;
    } catch (hashError) {
      console.warn('[RATE_LIMITER] IPv6 hashing failed:', hashError?.message || 'Unknown error');
      return 'ipv6_anonymous';
    }
  }

  // IPv4 validation
  if (/^\d+\.\d+\.\d+\.\d+$/.test(normalizedIp)) {
    return `ipv4_${normalizedIp}`;
  }

  return 'unknown';
};

/**
 * Safe proxy parser for malformed headers
 */
const safeProxyParser = (forwardedFor) => {
  try {
    if (!forwardedFor || typeof forwardedFor !== 'string') {
      return [];
    }

    return forwardedFor
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip && ip !== 'unknown' && ip !== '');
  } catch (error) {
    console.warn('[RATE_LIMITER] Proxy parsing failed:', error?.message || 'Unknown error');
    return [];
  }
};

/**
 * In-memory rate limiting store (serverless-safe)
 */
class MemoryRateLimitStore {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      return null;
    }

    // Check if window has expired
    if (Date.now() > item.resetTime) {
      this.store.delete(key);
      return null;
    }

    return item;
  }

  set(key, value, windowMs) {
    this.store.set(key, {
      ...value,
      resetTime: Date.now() + windowMs
    });

    // Cleanup old entries periodically
    if (this.store.size > 10000) {
      this.cleanup();
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new MemoryRateLimitStore();

/**
 * Rate limiter middleware factory
 */
const createServerlessRateLimiter = (config) => {
  return async (req, res, next) => {
    try {
      // Get client IP safely
      const rawIp = getClientIp(req);
      const normalizedIp = normalizeIp(rawIp);
      
      // Create rate limit key
      const key = `${normalizedIp}:${req.path}:${req.method}`;
      
      // Get current rate limit data
      const current = rateLimitStore.get(key);
      const now = Date.now();
      
      if (!current) {
        // First request in window
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + config.windowMs
        }, config.windowMs);
        
        // Set headers for successful requests
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', config.max - 1);
        res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());
        
        return next();
      }

      // Check if limit exceeded
      if (current.count >= config.max) {
        const retryAfter = Math.ceil((current.resetTime - now) / 1000);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.max);
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('Retry-After', Math.max(retryAfter, 1).toString());
        
        // Log rate limit exceeded (if logger available)
        try {
          console.log('[RATE_LIMIT] Exceeded', {
            ip: normalizedIp,
            path: req.path,
            method: req.method,
            count: current.count,
            max: config.max,
            retryAfter
          });
        } catch (logError) {
          // Ignore logging errors
        }
        
        // Return JSON response - NEVER throw
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: config.message,
          retryAfter: Math.max(retryAfter, 1),
          timestamp: new Date().toISOString()
        });
      }

      // Increment counter
      current.count++;
      rateLimitStore.set(key, current, config.windowMs);
      
      // Set headers for successful requests
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', config.max - current.count);
      res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
      
      return next();
      
    } catch (error) {
      // CATCH-ALL: This should NEVER happen, but if it does, we MUST call next()
      console.error('[RATE_LIMITER] CATCH-ALL ERROR (should never happen):', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        path: req.path,
        method: req.method
      });
      
      // ALWAYS call next() - never crash the middleware chain
      return next();
    }
  };
};

// Create rate limiters
const authLimiterSoft = createServerlessRateLimiter(RATE_LIMITER_CONFIGS.authLimiterSoft);
const authLimiterStrict = createServerlessRateLimiter(RATE_LIMITER_CONFIGS.authLimiterStrict);
const adminLimiterStrict = createServerlessRateLimiter(RATE_LIMITER_CONFIGS.adminLimiterStrict);
const publicLimiterSoft = createServerlessRateLimiter(RATE_LIMITER_CONFIGS.publicLimiterSoft);

/**
 * Health check for rate limiter
 */
const rateLimiterHealthCheck = () => {
  try {
    return {
      status: 'healthy',
      message: 'Rate limiter is operational',
      type: 'memory_store',
      entries: rateLimitStore.store.size,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      message: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  authLimiterSoft,
  authLimiterStrict, 
  adminLimiterStrict,
  publicLimiterSoft,
  rateLimiterHealthCheck,
  getClientIp,
  normalizeIp,
  safeProxyParser
};
