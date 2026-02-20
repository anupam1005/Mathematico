const { Ratelimit } = require('@upstash/ratelimit');
const { Redis } = require('@upstash/redis');

// Lazy Redis client initialization (serverless-safe)
// Requires:
// - UPSTASH_REDIS_REST_URL
// - UPSTASH_REDIS_REST_TOKEN
let redis = null;
let loginRatelimit = null;
let redisHealthy = true;
let redisInitialized = false;
let consecutiveFailures = 0;
let circuitBreakerCooldown = null;
const MAX_FAILURES = 3;
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Safe Redis initialization with lazy loading
 * Never throws during module import
 */
const initializeRedis = () => {
  if (redisInitialized) return redis;
  
  try {
    // Validate environment variables
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!redisUrl || !redisToken) {
      console.warn("REDIS_DISABLED", { 
        reason: "Missing credentials",
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

    // Create rate limiter with fixed window strategy
    // 5 attempts per 15 minutes, 6th attempt returns 429
    loginRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(5, '15 m'),
      analytics: false, // Disable analytics for production
      prefix: 'login_rate_limit'
    });

    redisInitialized = true;
    
    if (process.env.NODE_ENV !== 'test') {
      console.log("REDIS_INITIALIZED", { status: "success" });
    }
    
    return redis;
  } catch (error) {
    const errorMessage = error && error.message ? error.message : String(error);
    console.error("REDIS_ERROR", { 
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
 * Disables Redis operations after consecutive failures
 */
const handleRedisFailure = (error) => {
  consecutiveFailures++;
  
  const errorMessage = error && error.message ? error.message : String(error);
  console.error("REDIS_ERROR", { 
    operation: "rate_limiting",
    message: errorMessage,
    consecutiveFailures,
    stack: error && error.stack 
  });
  
  if (consecutiveFailures >= MAX_FAILURES && !circuitBreakerCooldown) {
    redisHealthy = false;
    console.warn("REDIS_CIRCUIT_BREAKER_OPENED", { 
      consecutiveFailures,
      cooldownDuration: COOLDOWN_DURATION 
    });
    
    // Set cooldown timer for recovery
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
      
      console.log("REDIS_CIRCUIT_BREAKER_CLOSED", { status: "recovered" });
    }
  } catch (error) {
    // Keep circuit breaker open
    console.warn("REDIS_RECOVERY_FAILED", { 
      message: error && error.message ? error.message : String(error) 
    });
    
    // Schedule another recovery attempt
    circuitBreakerCooldown = setTimeout(() => {
      attemptRecovery();
    }, COOLDOWN_DURATION);
  }
};

/**
 * Safe Redis ping for health checks
 */
const pingRedis = async () => {
  try {
    const client = initializeRedis();
    if (!client) return false;
    
    await client.ping();
    return true;
  } catch (error) {
    handleRedisFailure(error);
    return false;
  }
};

/**
 * Express middleware for login rate limiting.
 *
 * Behavior:
 * - Allows up to 5 attempts per identifier per 15 minutes.
 * - 6th attempt within the window returns 429 with proper headers.
 * - Never throws; on Redis failure it logs and gracefully allows the request.
 * - Uses circuit breaker pattern to prevent cascading failures.
 *
 * Identifier:
 * - Primary: combination of IP + route path.
 * - Falls back to "unknown" if IP is not available.
 */
const loginRateLimiter = async (req, res, next) => {
  // Initialize Redis on first use (lazy loading)
  const client = initializeRedis();
  
  // Skip rate limiting if Redis is not available or unhealthy
  if (!client || !loginRatelimit || !redisHealthy) {
    return next();
  }

  try {
    // Extract client IP safely (trust proxy compatible)
    const ip = req.ip || 
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.connection?.remoteAddress || 
               'unknown';
    
    const identifier = `login:${ip}:${req.path}`;

    // Apply rate limiting
    const result = await loginRatelimit.limit(identifier);

    // Reset failure counter on success
    consecutiveFailures = 0;

    // Validate response structure
    if (!result || typeof result.success === 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn("REDIS_INVALID_RESPONSE", { result });
      }
      return next();
    }

    // Handle rate limit exceeded
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      
      // Set proper rate limit headers
      res.setHeader('X-RateLimit-Limit', result.limit?.toString() || '5');
      res.setHeader('X-RateLimit-Remaining', result.remaining?.toString() || '0');
      res.setHeader('Retry-After', Math.max(retryAfter, 1).toString());
      
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts, please try again later.',
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter
      });
    }

    // Set rate limit headers for successful requests
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
        message: 'Redis not configured or disabled',
        healthy: false
      };
    }

    // Test basic connectivity
    const pingResult = await client.ping();
    
    // Test set/get operations
    const testKey = 'health_check_test';
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
      message: isHealthy ? 'Redis is responding correctly' : 'Redis test operations failed',
      healthy: isHealthy,
      circuitBreakerOpen: !redisHealthy,
      consecutiveFailures,
      initialized: redisInitialized
    };
  } catch (error) {
    handleRedisFailure(error);
    
    return {
      status: 'error',
      message: error && error.message ? error.message : 'Unknown Redis error',
      healthy: false,
      circuitBreakerOpen: !redisHealthy,
      consecutiveFailures,
      initialized: redisInitialized
    };
  }
};

// Export the middleware and health check function
module.exports = loginRateLimiter;
module.exports.redisHealthCheck = redisHealthCheck;
module.exports.pingRedis = pingRedis;

