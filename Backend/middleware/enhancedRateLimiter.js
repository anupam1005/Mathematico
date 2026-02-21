/**
 * Enhanced Rate Limiting Middleware (IP + Account)
 * 
 * Provides distributed brute-force resistance with:
 * - IP-based rate limiting
 * - Account-based rate limiting
 * - Sliding window implementation
 * - Generic error messages (no enumeration)
 * - Circuit breaker for Redis failures
 */

const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');
const { logRateLimitExceeded } = require('../utils/securityLogger');

// Configuration
const LOGIN_RATE_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT) || 5; // attempts per window
const LOGIN_RATE_WINDOW = process.env.LOGIN_RATE_WINDOW || '15 m'; // time window
const ACCOUNT_RATE_LIMIT = parseInt(process.env.ACCOUNT_RATE_LIMIT) || 10; // attempts per account per window
const ACCOUNT_RATE_WINDOW = process.env.ACCOUNT_RATE_WINDOW || '1 h'; // account-specific window

// Lazy Redis client initialization (serverless-safe)
let redis = null;
let ipRateLimiter = null;
let accountRateLimiter = null;
let redisHealthy = true;
let redisInitialized = false;
let consecutiveFailures = 0;
let circuitBreakerCooldown = null;
const MAX_FAILURES = 3;
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Safe Redis initialization with lazy loading
 */
const initializeRedis = () => {
  if (redisInitialized) return redis;
  
  try {
    // Validate environment variables
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
      console.warn("RATE_LIMITER_DISABLED", { 
        reason: "Missing Redis credentials",
        hasUrl: !!redisUrl,
        hasToken: !!redisToken 
      });
      redisHealthy = false;
      redisInitialized = true;
      return null;
    }

    // Create Redis client with retry configuration
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.min(retryCount * 100, 1000)
      }
    });

    // Create rate limiters with sliding window strategy
    ipRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW),
      analytics: false,
      prefix: 'ip_rate_limit'
    });

    accountRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(ACCOUNT_RATE_LIMIT, ACCOUNT_RATE_WINDOW),
      analytics: false,
      prefix: 'account_rate_limit'
    });

    redisInitialized = true;
    
    if (process.env.NODE_ENV !== 'test') {
      console.log("ENHANCED_RATE_LIMITER_INITIALIZED", { 
        status: "success",
        ipLimit: LOGIN_RATE_LIMIT,
        ipWindow: LOGIN_RATE_WINDOW,
        accountLimit: ACCOUNT_RATE_LIMIT,
        accountWindow: ACCOUNT_RATE_WINDOW
      });
    }
    
    return redis;
  } catch (error) {
    const errorMessage = error && error.message ? error.message : String(error);
    console.error("RATE_LIMITER_ERROR", { 
      operation: "initialization", 
      message: errorMessage,
      stack: error && error.stack 
    });
    
    redisHealthy = false;
    redisInitialized = true;
    return null;
  }
};

/**
 * Circuit breaker implementation
 */
const handleRedisFailure = (error) => {
  consecutiveFailures++;
  
  const errorMessage = error && error.message ? error.message : String(error);
  console.error("RATE_LIMITER_ERROR", { 
    operation: "rate_limiting",
    message: errorMessage,
    consecutiveFailures,
    stack: error && error.stack 
  });
  
  if (consecutiveFailures >= MAX_FAILURES && !circuitBreakerCooldown) {
    redisHealthy = false;
    console.warn("RATE_LIMITER_CIRCUIT_BREAKER_OPENED", { 
      consecutiveFailures,
      cooldownDuration: COOLDOWN_DURATION 
    });
    
    circuitBreakerCooldown = setTimeout(() => {
      attemptRecovery();
    }, COOLDOWN_DURATION);
  }
};

/**
 * Attempt to recover Redis connection after cooldown
 */
const attemptRecovery = async () => {
  try {
    const client = initializeRedis();
    if (client) {
      await client.ping();
      redisHealthy = true;
      consecutiveFailures = 0;
      circuitBreakerCooldown = null;
      
      console.log("RATE_LIMITER_CIRCUIT_BREAKER_CLOSED", { status: "recovered" });
    }
  } catch (error) {
    console.warn("RATE_LIMITER_RECOVERY_FAILED", { 
      message: error && error.message ? error.message : String(error) 
    });
    
    circuitBreakerCooldown = setTimeout(() => {
      attemptRecovery();
    }, COOLDOWN_DURATION);
  }
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
 * Extract email from request body (for account-based limiting)
 */
const extractEmail = (req) => {
  return req.body?.email || '';
};

/**
 * Enhanced rate limiting middleware
 * 
 * Behavior:
 * - Applies IP-based rate limiting first
 * - Then applies account-based rate limiting if email is present
 * - Returns generic message on limit exceeded
 * - Never throws; on Redis failure it logs and gracefully allows the request
 */
const enhancedRateLimiter = async (req, res, next) => {
  // Initialize Redis on first use (lazy loading)
  const client = initializeRedis();
  
  // Skip rate limiting if Redis is not available or unhealthy
  if (!client || !ipRateLimiter || !accountRateLimiter || !redisHealthy) {
    return next();
  }

  try {
    const ip = extractIP(req);
    const email = extractEmail(req);
    
    // IP-based rate limiting
    const ipIdentifier = `ip:${ip}:${req.path}`;
    const ipResult = await ipRateLimiter.limit(ipIdentifier);

    if (!ipResult.success) {
      const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
      
      // Log rate limit exceeded
      logRateLimitExceeded(ipIdentifier, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW, req);
      
      // Set proper rate limit headers
      res.setHeader('X-RateLimit-Limit', ipResult.limit?.toString() || LOGIN_RATE_LIMIT.toString());
      res.setHeader('X-RateLimit-Remaining', ipResult.remaining?.toString() || '0');
      res.setHeader('Retry-After', Math.max(retryAfter, 1).toString());
      
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }

    // Account-based rate limiting (only if email is provided)
    if (email && email.trim()) {
      const accountIdentifier = `account:${email.toLowerCase()}:${req.path}`;
      const accountResult = await accountRateLimiter.limit(accountIdentifier);

      if (!accountResult.success) {
        const retryAfter = Math.ceil((accountResult.reset - Date.now()) / 1000);
        
        // Log rate limit exceeded
        logRateLimitExceeded(accountIdentifier, ACCOUNT_RATE_LIMIT, ACCOUNT_RATE_WINDOW, req);
        
        // Set proper rate limit headers
        res.setHeader('X-RateLimit-Limit', accountResult.limit?.toString() || ACCOUNT_RATE_LIMIT.toString());
        res.setHeader('X-RateLimit-Remaining', accountResult.remaining?.toString() || '0');
        res.setHeader('Retry-After', Math.max(retryAfter, 1).toString());
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString()
        });
      }

      // Set account rate limit headers for successful requests
      if (accountResult.limit !== undefined) {
        res.setHeader('X-Account-RateLimit-Limit', accountResult.limit.toString());
      }
      if (accountResult.remaining !== undefined) {
        res.setHeader('X-Account-RateLimit-Remaining', accountResult.remaining.toString());
      }
    }

    // Reset failure counter on success
    consecutiveFailures = 0;

    // Set IP rate limit headers for successful requests
    if (ipResult.limit !== undefined) {
      res.setHeader('X-IP-RateLimit-Limit', ipResult.limit.toString());
    }
    if (ipResult.remaining !== undefined) {
      res.setHeader('X-IP-RateLimit-Remaining', ipResult.remaining.toString());
    }
    if (ipResult.reset !== undefined) {
      res.setHeader('X-RateLimit-Reset', ipResult.reset.toString());
    }

    return next();
  } catch (error) {
    handleRedisFailure(error);
    
    // Never crash server or return 500 due to rate limiting
    return next();
  }
};

/**
 * Redis health check function for monitoring
 */
const redisHealthCheck = async () => {
  try {
    const client = initializeRedis();
    if (!client) {
      return {
        status: 'disabled',
        message: 'Enhanced rate limiter not configured or disabled',
        healthy: false
      };
    }

    // Test basic connectivity
    const pingResult = await client.ping();
    
    // Test set/get operations
    const testKey = 'enhanced_rate_limiter_health_check';
    const testValue = Date.now().toString();
    
    await client.set(testKey, testValue, { ex: 60 });
    const retrievedValue = await client.get(testKey);
    
    // Cleanup test key
    try {
      await client.del(testKey);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    const isHealthy = pingResult && retrievedValue === testValue;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'Enhanced rate limiter is responding correctly' : 'Enhanced rate limiter test operations failed',
      healthy: isHealthy,
      circuitBreakerOpen: !redisHealthy,
      consecutiveFailures,
      initialized: redisInitialized,
      config: {
        ipLimit: LOGIN_RATE_LIMIT,
        ipWindow: LOGIN_RATE_WINDOW,
        accountLimit: ACCOUNT_RATE_LIMIT,
        accountWindow: ACCOUNT_RATE_WINDOW
      }
    };
  } catch (error) {
    handleRedisFailure(error);
    
    return {
      status: 'error',
      message: error && error.message ? error.message : 'Unknown enhanced rate limiter error',
      healthy: false,
      circuitBreakerOpen: !redisHealthy,
      consecutiveFailures,
      initialized: redisInitialized
    };
  }
};

// Export the middleware and health check function
module.exports = enhancedRateLimiter;
module.exports.redisHealthCheck = redisHealthCheck;
