const { getRedisClient, getRedisKey } = require('../utils/redisClient');

// Custom Redis store compliant with express-rate-limit Store interface
class RedisStore {
  constructor(options = {}) {
    this.resetExpiryOnChange = options.resetExpiryOnChange !== false;
    this.redis = null;
  }

  getRedisClient() {
    if (!this.redis) {
      this.redis = getRedisClient();
    }
    return this.redis;
  }

  async increment(key) {
    try {
      const redis = this.getRedisClient();
      const redisKey = getRedisKey(key);
      
      // Atomic INCR + EXPIRE operation
      const result = await redis
        .multi()
        .incr(redisKey)
        .expire(redisKey, Math.ceil(this.windowMs / 1000))
        .exec();
      
      const totalHits = result[0][1];
      const ttl = await redis.ttl(redisKey);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        totalHits,
        resetTime
      };
    } catch (error) {
      console.error('Redis store increment error:', error.message);
      throw error;
    }
  }

  async decrement(key) {
    try {
      const redis = this.getRedisClient();
      const redisKey = getRedisKey(key);
      await redis.decr(redisKey);
    } catch (error) {
      console.error('Redis store decrement error:', error.message);
      // Ignore decrement errors as per rate-limit specification
    }
  }

  async resetKey(key) {
    try {
      const redis = this.getRedisClient();
      const redisKey = getRedisKey(key);
      await redis.del(redisKey);
    } catch (error) {
      console.error('Redis store reset error:', error.message);
      // Ignore reset errors as per rate-limit specification
    }
  }

  // Set window duration (required by express-rate-limit)
  setWindowMs(windowMs) {
    this.windowMs = windowMs;
  }
}

module.exports = RedisStore;
