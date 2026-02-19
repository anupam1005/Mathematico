const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;
let isConnecting = false;

// Production Redis connection with strict validation (no side effects until called)
const connectRedis = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }

  // Strict Redis URL format validation - require rediss:// in production
  if (isProduction && !redisUrl.startsWith('rediss://')) {
    throw new Error('REDIS_URL must use rediss:// (TLS) in production');
  }
  
  if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
    throw new Error('REDIS_URL must be in format: redis://user:pass@host:port or rediss://user:pass@host:port');
  }

  try {
    const redisOptions = {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      // We intentionally control connection timing so startup failures happen inside `startServer()`.
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      maxLoadingTimeout: 3000,
    };
    
    // Add TLS for rediss:// URLs
    if (redisUrl.startsWith('rediss://')) {
      redisOptions.tls = {};
    }

    if (!redisClient) {
      redisClient = new Redis(redisUrl, redisOptions);

      // Never throw synchronously from event handlers; surface fatal errors via explicit health checks.
      redisClient.on('connect', () => {
        if (!isProduction) console.log('✅ Redis TCP connected');
      });

      redisClient.on('ready', () => {
        isConnected = true;
        isConnecting = false;
        if (!isProduction) console.log('✅ Redis ready');
      });

      redisClient.on('error', (error) => {
        isConnected = false;
        isConnecting = false;
        console.error('❌ Redis error:', error && error.message ? error.message : error);
      });

      redisClient.on('close', () => {
        isConnected = false;
        isConnecting = false;
        console.warn('⚠️ Redis connection closed');
      });
    }

    if (!isConnected && !isConnecting) {
      isConnecting = true;
      await redisClient.connect();
    }

    return redisClient;
  } catch (error) {
    const errorMsg = `Redis initialization failed: ${error.message}`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
};

// Redis connection will be initialized lazily when needed
// redisClient = connectRedis();

// Health check function with connection testing and ping
const checkRedisHealth = async () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  
  try {
    // Test connection with PING
    const pingResult = await redisClient.ping();
    if (pingResult !== 'PONG') {
      throw new Error('Redis PING test failed');
    }
    
    // Test write operation with SET/DEL
    const testKey = getRedisKey('health:test');
    const testValue = Date.now().toString();
    
    await redisClient.setex(testKey, 10, testValue);
    const retrievedValue = await redisClient.get(testKey);
    await redisClient.del(testKey);
    
    if (retrievedValue !== testValue) {
      throw new Error('Redis read/write test failed');
    }
    
    return true;
  } catch (error) {
    const errorMsg = `Redis health check failed: ${error.message}`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
};

// Get Redis client with lazy initialization and connection validation
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  
  if (!isConnected) {
    throw new Error('Redis not connected');
  }
  
  return redisClient;
};

// Environment-safe key generator
const getRedisKey = (key) => {
  const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  return `${env}:${key}`;
};

// Export functions without immediate initialization
module.exports = {
  connectRedis,
  checkRedisHealth,
  getRedisClient,
  getRedisKey,
  isConnected: () => isConnected
};
