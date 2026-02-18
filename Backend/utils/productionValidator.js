const { getRedisClient, checkRedisHealth, getRedisKey } = require('./redisClient');

// Production Runtime Validation - Live Verification System
const validateProductionRuntime = async (req) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  const validationResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    ip: clientIP,
    redis: {},
    rateLimit: {},
    security: {},
    status: 'unknown'
  };

  try {
    // 1️⃣ REDIS URL VALIDATION
    const redisUrl = process.env.REDIS_URL;
    validationResults.redis.urlExists = !!redisUrl;
    validationResults.redis.urlFormat = redisUrl ? 
      (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://') ? 'valid' : 'invalid') : 'missing';
    
    // 2️⃣ REDIS CONNECTION STATUS
    const redisClient = getRedisClient();
    validationResults.redis.clientExists = !!redisClient;
    
    if (redisClient) {
      validationResults.redis.status = redisClient.status || 'unknown';
      validationResults.redis.connected = redisClient.status === 'ready';
      
      // Test Redis operation
      const testKey = getRedisKey('runtime:test');
      const testValue = Date.now().toString();
      
      await redisClient.setex(testKey, 60, testValue);
      const retrievedValue = await redisClient.get(testKey);
      validationResults.redis.writeTest = retrievedValue === testValue ? 'pass' : 'fail';
      
      await redisClient.del(testKey);
    } else {
      validationResults.redis.status = 'missing';
      validationResults.redis.writeTest = 'fail';
    }
    
    // 3️⃣ RATE LIMIT STORE VALIDATION
    const RedisStore = require('../middleware/rateLimitStore');
    try {
      const testStore = new RedisStore({ windowMs: 60000 });
      validationResults.rateLimit.storeType = testStore.redis ? 'redis' : 'memory';
      validationResults.rateLimit.storeConnected = !!testStore.redis;
    } catch (error) {
      validationResults.rateLimit.storeType = 'error';
      validationResults.rateLimit.storeError = error.message;
    }
    
    // 4️⃣ SECURITY MIDDLEWARE VALIDATION
    const { validateSecurityMiddleware } = require('../middleware/securityMiddlewareFixed');
    try {
      await validateSecurityMiddleware();
      validationResults.security.middlewareValid = 'pass';
    } catch (error) {
      validationResults.security.middlewareValid = 'fail';
      validationResults.security.middlewareError = error.message;
    }
    
    // 5️⃣ KEY NAMESPACING TEST
    const testNamespaces = {
      login: getRedisKey(`login:${clientIP}`),
      auth: getRedisKey(`auth:${clientIP}`),
      brute: getRedisKey(`brute:${clientIP}`)
    };
    validationResults.redis.namespaces = testNamespaces;
    validationResults.redis.namespaceFormat = Object.values(testNamespaces).every(key => 
      key.startsWith('prod:') || key.startsWith('dev:')
    ) ? 'valid' : 'invalid';
    
    // 6️⃣ FINAL STATUS
    const allChecksPass = (
      validationResults.redis.urlExists &&
      validationResults.redis.urlFormat === 'valid' &&
      validationResults.redis.clientExists &&
      validationResults.redis.connected &&
      validationResults.redis.writeTest === 'pass' &&
      validationResults.rateLimit.storeType === 'redis' &&
      validationResults.security.middlewareValid === 'pass' &&
      validationResults.redis.namespaceFormat === 'valid'
    );
    
    validationResults.status = allChecksPass ? 'pass' : 'fail';
    
  } catch (error) {
    validationResults.error = error.message;
    validationResults.status = 'error';
  }
  
  return validationResults;
};

// Runtime logging for login controller
const logRuntimeValidation = async (req) => {
  const validation = await validateProductionRuntime(req);
  
  console.log('🔍 PRODUCTION RUNTIME VALIDATION:');
  console.log(`   Environment: ${validation.environment}`);
  console.log(`   Vercel: ${validation.vercel}`);
  console.log(`   REDIS_URL exists: ${validation.redis.urlExists}`);
  console.log(`   REDIS_URL format: ${validation.redis.urlFormat}`);
  console.log(`   Redis client exists: ${validation.redis.clientExists}`);
  console.log(`   Redis status: ${validation.redis.status}`);
  console.log(`   Redis connected: ${validation.redis.connected}`);
  console.log(`   Redis write test: ${validation.redis.writeTest}`);
  console.log(`   Rate limit store type: ${validation.rateLimit.storeType}`);
  console.log(`   Security middleware: ${validation.security.middlewareValid}`);
  console.log(`   Namespace format: ${validation.redis.namespaceFormat}`);
  console.log(`   Overall status: ${validation.status}`);
  
  if (validation.status === 'fail') {
    console.error('❌ PRODUCTION VALIDATION FAILED - System not ready');
  } else {
    console.log('✅ PRODUCTION VALIDATION PASSED - System ready');
  }
  
  return validation;
};

module.exports = {
  validateProductionRuntime,
  logRuntimeValidation
};
