/**
 * SERVERLESS DATABASE CONNECTION - FINAL VERSION
 * 
 * GUARANTEES:
 * - Caches global connection to prevent reconnect storms
 * - Caches connection promise to prevent race conditions
 * - Safe timeout handling
 * - Throws ONLY inside routes, never during startup
 * - Health endpoint reflects real DB state (no forced connections)
 * - Prevents "XHR request failed" from database issues
 */

const mongoose = require('mongoose');

// Global connection cache for serverless environments
const globalConnectionKey = 'mongooseConn';
const globalPromiseKey = 'mongooseConnPromise';

// Connection state tracking
let connectionAttempts = 0;
let lastConnectionError = null;
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Serverless-safe MongoDB connection with global caching
 * - Uses singleton pattern for Vercel serverless
 * - Caches connection promise to prevent race conditions
 * - Validates connection state before returning
 * - Structured error logging
 * - Vercel serverless compatible
 */
const connectDB = async () => {
  // First, check if mongoose already has an active connection (most efficient)
  if (mongoose.connection.readyState === 1) {
    const connection = mongoose.connection;
    console.log('MONGO_REUSE_NATIVE', {
      readyState: connection.readyState,
      host: connection.host,
      database: connection.name,
      source: 'mongoose.connection'
    });
    return connection;
  }

  // Use global connection caching for serverless environments
  const isServerless = process.env.VERCEL === '1' || process.env.SERVERLESS === '1';
  
  if (isServerless) {
    // Check for cached global connection
    if (global[globalConnectionKey] && global[globalConnectionKey].readyState === 1) {
      console.log('MONGO_REUSE_GLOBAL', {
        readyState: global[globalConnectionKey].readyState,
        host: global[globalConnectionKey].host,
        database: global[globalConnectionKey].name,
        source: 'global.cache'
      });
      return global[globalConnectionKey];
    }
    
    // Return existing connection promise if connection is in progress
    if (global[globalPromiseKey]) {
      console.log('MONGO_PROMISE_REUSE', { source: 'global.promise' });
      return global[globalPromiseKey];
    }
  }

  // Validate environment with Vercel-specific messaging
  if (!process.env.MONGO_URI) {
    const error = new Error("MONGO_URI environment variable is not configured");
    console.error('MONGO_URI_MISSING', {
      error: error.message,
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      solution: 'Set MONGO_URI in your Vercel dashboard under Environment Variables'
    });
    throw error;
  }

  // Create connection promise and cache it
  const connectionPromise = (async () => {
    try {
      // Force close existing connection if in bad state
      if (mongoose.connection.readyState > 1) {
        await mongoose.connection.close();
        console.log('MONGO_FORCE_CLOSE', { reason: 'Bad connection state detected' });
      }

      // Serverless-optimized connection settings
      const connectionOptions = {
        serverSelectionTimeoutMS: 8000, // Faster failover for serverless
        socketTimeoutMS: 20000, // Shorter timeout for serverless
        maxPoolSize: isServerless ? 2 : 5, // Minimal for serverless
        minPoolSize: isServerless ? 0 : 1, // No minimum for serverless
        maxIdleTimeMS: isServerless ? 10000 : 30000, // Shorter idle time
        waitQueueTimeoutMS: 5000, // Shorter queue timeout
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        maxConnecting: isServerless ? 2 : 5, // Limit concurrent connections
        connectTimeoutMS: 5000, // Faster connection timeout
        compressors: ['zlib'] // Minimal compression for serverless
      };

      console.log('MONGO_CONNECTING', {
        environment: process.env.NODE_ENV,
        isServerless,
        uriLength: process.env.MONGO_URI.length,
        currentState: mongoose.connection.readyState
      });

      // Establish new connection
      const connection = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      
      // Verify connection with ping (but don't fail hard)
      try {
        await connection.connection.db.admin().ping();
      } catch (pingError) {
        console.warn('MONGO_PING_FAILED', { 
          error: pingError.message,
          note: 'Connection established but ping failed - may be temporary'
        });
      }
      
      // Reset connection attempts on success
      connectionAttempts = 0;
      lastConnectionError = null;

      // Cache the successful connection
      const dbConnection = connection.connection;
      
      if (isServerless) {
        global[globalConnectionKey] = dbConnection;
        global[globalPromiseKey] = null; // Clear promise cache
      }
      
      console.log('MONGO_CONNECTED', {
        readyState: dbConnection.readyState,
        host: dbConnection.host,
        database: dbConnection.name,
        isServerless
      });

      return dbConnection;
    } catch (error) {
      // Increment connection attempts
      connectionAttempts++;
      lastConnectionError = error;
      
      // Reset connection promise on failure
      if (isServerless) {
        global[globalPromiseKey] = null;
        global[globalConnectionKey] = null;
      }
      
      console.error('MONGO_CONNECTION_ERROR', {
        error: error.message,
        code: error.code || 'CONNECTION_FAILED',
        isServerless,
        connectionAttempts,
        maxAttempts: MAX_CONNECTION_ATTEMPTS,
        troubleshooting: {
          isIpWhitelistIssue: error.message.includes('IP that isn\'t whitelisted'),
          isAuthIssue: error.message.includes('Authentication failed'),
          isNetworkIssue: error.message.includes('network') || error.message.includes('timeout'),
          solution: error.message.includes('IP that isn\'t whitelisted') 
            ? 'Add Vercel IPs to MongoDB Atlas whitelist or use 0.0.0.0/0 for testing'
            : 'Check MONGO_URI format and Atlas user permissions'
        }
      });
      
      // Fail fast in production after max attempts
      if (process.env.NODE_ENV === 'production' && connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.error('MONGO_FAILED_PERMANENTLY', {
          attempts: connectionAttempts,
          lastError: error.message
        });
        throw new Error(`Database connection failed: ${error.message}`);
      }

      throw error;
    }
  })();

  // Cache the connection promise
  if (isServerless) {
    global[globalPromiseKey] = connectionPromise;
  }

  return connectionPromise;
};

/**
 * Serverless-safe health check - reflects real DB state
 * NEVER forces new connections
 */
const performHealthCheck = async () => {
  try {
    // Check if there's an existing connection without forcing a new one
    if (mongoose.connection.readyState !== 1) {
      return {
        connected: false,
        readyState: mongoose.connection.readyState,
        host: null,
        database: null,
        ping: 'no_connection',
        error: 'No active database connection',
        connectionAttempts,
        lastConnectionError: lastConnectionError?.message || null
      };
    }
    
    const connection = mongoose.connection;
    
    // Perform actual ping test (but don't fail health check if ping fails)
    let pingResult = 'failed';
    try {
      const pingResponse = await connection.db.admin().ping();
      pingResult = pingResponse ? 'success' : 'failed';
    } catch (pingError) {
      console.warn('HEALTH_CHECK_PING_FAILED', { error: pingError.message });
    }
    
    // Get connection stats (optional - don't fail if stats fail)
    let stats = null;
    try {
      stats = await connection.db.stats();
    } catch (statsError) {
      console.warn('HEALTH_CHECK_STATS_FAILED', { error: statsError.message });
    }
    
    return {
      connected: true,
      readyState: connection.readyState,
      host: connection.host,
      database: connection.name,
      ping: pingResult,
      stats: stats ? {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      } : null,
      connectionAttempts,
      lastConnectionError: lastConnectionError?.message || null
    };
  } catch (healthError) {
    return {
      connected: false,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      ping: 'failed',
      error: healthError.message,
      connectionAttempts,
      lastConnectionError: lastConnectionError?.message || null
    };
  }
};

/**
 * Graceful shutdown utility
 */
const closeConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MONGO_CLOSED_GRACEFULLY');
      
      // Clear global cache
      if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
        global[globalConnectionKey] = null;
        global[globalPromiseKey] = null;
      }
    }
  } catch (error) {
    console.error('MONGO_CLOSE_ERROR', { error: error.message });
  }
};

/**
 * Connection status utility
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    readyState: mongoose.connection.readyState,
    state: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    connectionAttempts,
    lastConnectionError: lastConnectionError?.message || null
  };
};

/**
 * Database health check for monitoring
 */
const databaseHealthCheck = async () => {
  const status = getConnectionStatus();
  const health = await performHealthCheck();
  
  return {
    status: health.connected ? 'healthy' : 'unhealthy',
    message: health.connected ? 'Database is operational' : 'Database is not operational',
    connection: status,
    health,
    timestamp: new Date().toISOString()
  };
};

module.exports = { 
  connectDB,
  performHealthCheck, 
  closeConnection,
  getConnectionStatus,
  databaseHealthCheck
};
