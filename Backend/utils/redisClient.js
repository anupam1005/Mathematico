const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

// Production Redis connection with validation
const connectRedis = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    if (isProduction) {
      throw new Error('REDIS_URL environment variable is required in production');
    } else {
      console.warn('⚠️ REDIS_URL not configured, Redis features disabled');
      return null;
    }
  }

  // Validate Redis URL format
  if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
    throw new Error('REDIS_URL must be in format: redis://user:pass@host:port or rediss://user:pass@host:port');
  }

  try {
    redisClient = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      enableReadyCheck: true,
      maxLoadingTimeout: 3000,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      isConnected = false;
      console.error('❌ Redis connection error:', error.message);
      if (isProduction) {
        throw new Error(`Redis connection failed in production: ${error.message}`);
      }
    });

    redisClient.on('close', () => {
      isConnected = false;
      console.warn('⚠️ Redis connection closed');
      if (isProduction) {
        throw new Error('Redis connection closed in production');
      }
    });

    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    if (isProduction) {
      throw new Error(`Redis initialization failed in production: ${error.message}`);
    }
    return null;
  }
};

// Initialize Redis connection
redisClient = connectRedis();

// Health check function
const checkRedisHealth = async () => {
  if (!redisClient) {
    return false;
  }
  
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Redis health check failed:', error.message);
    return false;
  }
};

// Get Redis client with connection validation
const getRedisClient = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!redisClient && isProduction) {
    throw new Error('Redis client not available in production');
  }
  
  if (!isConnected && isProduction) {
    throw new Error('Redis not connected in production');
  }
  
  return redisClient;
};

// Environment-safe key generator
const getRedisKey = (key) => {
  const env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
  return `${env}:${key}`;
};

module.exports = {
  redisClient: getRedisClient(),
  connectRedis,
  checkRedisHealth,
  getRedisClient,
  getRedisKey,
  isConnected: () => isConnected
};
