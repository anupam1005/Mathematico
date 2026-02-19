const RedisStore = require('../middleware/rateLimitStore');

/**
 * Shared Redis-backed store instance for express-rate-limit.
 *
 * Important:
 * - This module must be safe to `require()` during startup (no sync Redis calls).
 * - The Redis connection itself is established during `startServer()` in `index.js`.
 */
module.exports = function createRateLimitStore() {
  return new RedisStore();
};

