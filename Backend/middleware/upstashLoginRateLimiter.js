const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

// Safe Upstash Redis client initialization (serverless-safe)
// Requires:
// - UPSTASH_REDIS_REST_URL
// - UPSTASH_REDIS_REST_TOKEN
let redis = null;
let loginRatelimit = null;
let redisHealthy = true;
let consecutiveFailures = 0;
const MAX_FAILURES = 3;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.min(retryCount * 100, 1000)
      }
    });

    // Fixed window: 5 attempts per 15 minutes
    // 6th attempt within the window must return 429
    loginRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, '15 m'),
      analytics: true,
      prefix: 'login_rate_limit'
    });

    // Test Redis connection
    redis.ping().then(() => {
      redisHealthy = true;
      consecutiveFailures = 0;
      console.log('✅ Upstash Redis connected for rate limiting');
    }).catch((err) => {
      console.warn('⚠️ Upstash Redis connection test failed:', err && err.message ? err.message : err);
      redisHealthy = false;
    });
  } else {
    console.warn('⚠️ Upstash Redis credentials not configured - rate limiting disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize Upstash Redis:', error && error.message ? error.message : error);
  redisHealthy = false;
  // Continue without rate limiting - better than breaking the service
}

/**
 * Express middleware for login rate limiting.
 *
 * Behavior:
 * - Allows up to 5 attempts per identifier per 15 minutes.
 * - 6th attempt within the window returns 429 with a JSON error.
 * - Never throws; on Upstash failure it logs and gracefully allows the request.
 *
 * Identifier:
 * - Primary: combination of IP + route path.
 * - Falls back to "unknown" if IP is not available.
 */
const loginRateLimiter = async (req, res, next) => {
  // If rate limiter is not initialized or unhealthy, skip rate limiting
  if (!loginRatelimit || !redisHealthy) {
    return next();
  }

  try {
    // In Vercel + `trust proxy`, `req.ip` reflects the real client IP.
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const identifier = `login:${ip}:${req.path}`;

    const result = await loginRatelimit.limit(identifier);

    // Reset failure counter on success
    consecutiveFailures = 0;

    if (!result || typeof result.success === 'undefined') {
      // Defensive: if Upstash returns an unexpected shape, do not block login.
      return next();
    }

    if (!result.success) {
      // Too many attempts - respond with 429 but do not break the server.
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts, please try again later.',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset
      });
    }

    // Optionally expose rate limit headers for clients/monitoring
    if (result.limit !== undefined) {
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
    }
    if (result.remaining !== undefined) {
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    }
    if (result.reset !== undefined) {
      res.setHeader('X-RateLimit-Reset', result.reset.toString());
    }

    return next();
  } catch (error) {
    // Track consecutive failures
    consecutiveFailures++;
    
    // Circuit breaker: disable rate limiting after multiple failures
    if (consecutiveFailures >= MAX_FAILURES) {
      redisHealthy = false;
      console.warn(`⚠️ Rate limiting disabled after ${consecutiveFailures} consecutive failures`);
      
      // Attempt recovery after 5 minutes
      setTimeout(() => {
        if (redis) {
          redis.ping().then(() => {
            redisHealthy = true;
            consecutiveFailures = 0;
            console.log('✅ Upstash Redis rate limiting re-enabled');
          }).catch(() => {
            // Keep disabled
          });
        }
      }, 5 * 60 * 1000);
    }
    
    // Never crash server or return 500 due to rate limiting.
    console.error('Upstash login rate limiter error:', error && error.message ? error.message : error);
    return next();
  }
};

module.exports = loginRateLimiter;

