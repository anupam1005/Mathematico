const mongoose = require('mongoose');

/**
 * Production-hardened MongoDB connection with global caching
 * - Uses singleton pattern for Vercel serverless
 * - Caches connection promise to prevent race conditions
 * - Validates connection state before returning
 * - Structured error logging
 * - Vercel serverless compatible
 * - Optimized for Vercel environment variables
 * - Fail-fast on connection errors in production
 */
const globalConnectionKey = 'mongooseConn';
let cachedConnection = null;
let connectionPromise = null;
let connectionAttempts = 0;
let lastConnectionError = null;
const MAX_CONNECTION_ATTEMPTS = 3;
let warmConnectionStarted = false;

/**
 * Production-safe MongoDB connection with global caching
 * - Uses singleton pattern for Vercel serverless
 * - Caches connection promise to prevent race conditions
 * - Validates connection state before returning
 * - Structured error logging
 * - Vercel serverless compatible
 * - Optimized for Vercel environment variables
 */
const connectDB = async () => {
  // First, check if mongoose already has an active connection (most efficient)
  if (mongoose.connection.readyState === 1) {
    const connection = mongoose.connection;
    console.log('MONGO_REUSE_MONGOOSE_NATIVE', {
      readyState: connection.readyState,
      host: connection.host,
      database: connection.name,
      source: 'mongoose.connection'
    });
    return connection;
  }

  // Use global connection caching for serverless environments
  if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
    // Check for cached global connection
    if (global[globalConnectionKey] && global[globalConnectionKey].readyState === 1) {
      console.log('MONGO_REUSE_CACHED', {
        readyState: global[globalConnectionKey].readyState,
        host: global[globalConnectionKey].host,
        database: global[globalConnectionKey].name,
        source: 'global.cache'
      });
      return global[globalConnectionKey];
    }
    
    // Return existing connection promise if connection is in progress
    if (global[globalConnectionKey + 'Promise']) {
      console.log('MONGO_CONNECTION_IN_PROGRESS', { reusing: true, source: 'global.promise' });
      return global[globalConnectionKey + 'Promise'];
    }
  } else {
    // Local development - use module-level caching
    if (cachedConnection && cachedConnection.readyState === 1) {
      console.log('MONGO_REUSE_LOCAL', {
        readyState: cachedConnection.readyState,
        host: cachedConnection.host,
        database: cachedConnection.name,
        source: 'module.cache'
      });
      return cachedConnection;
    }
    
    if (connectionPromise) {
      console.log('MONGO_CONNECTION_IN_PROGRESS', { reusing: true, source: 'module.promise' });
      return connectionPromise;
    }
  }

  // Validate environment with Vercel-specific messaging
  if (!process.env.MONGO_URI) {
    const error = new Error("MONGO_URI environment variable is not configured");
    console.error('MONGO_URI_MISSING', {
      error: error.message,
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      vercelEnv: process.env.VERCEL_ENV,
      solution: 'Set MONGO_URI in your Vercel dashboard under Environment Variables'
    });
    throw error;
  }

  // Only log connecting when we actually need to establish a new connection
  console.log('MONGO_CONNECTING', {
    environment: process.env.NODE_ENV,
    isVercel: process.env.VERCEL === '1',
    uriLength: process.env.MONGO_URI.length,
    uriStartsWith: process.env.MONGO_URI.substring(0, 20) + '...',
    currentState: mongoose.connection.readyState,
    reason: 'no_active_connection_found'
  });

  // Create connection promise and cache it
  const newConnectionPromise = (async () => {
    try {
      // Force close existing connection if in bad state
      if (mongoose.connection.readyState > 1) {
        await mongoose.connection.close();
        console.log('MONGO_FORCE_CLOSE', { reason: 'Bad connection state detected' });
      }

      // Production-hardened connection settings optimized for serverless
      const connectionOptions = {
        serverSelectionTimeoutMS: 10000, // Reduced for faster failover
        socketTimeoutMS: 30000, // Reduced for serverless timeout limits
        maxPoolSize: process.env.VERCEL === '1' ? 3 : 10, // Smaller pool for serverless
        minPoolSize: process.env.VERCEL === '1' ? 1 : 2, // Minimize for serverless
        maxIdleTimeMS: process.env.VERCEL === '1' ? 30000 : 60000, // Shorter idle for serverless
        waitQueueTimeoutMS: 10000, // Reduced for better UX
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        maxConnecting: process.env.VERCEL === '1' ? 5 : 10, // Limit concurrent connections
        // Add connection timeout for serverless
        connectTimeoutMS: 8000,
        // Enable compression for bandwidth efficiency
        compressors: ['zstd', 'snappy', 'zlib']
      };

      console.log('MONGO_ESTABLISHING_NEW', {
        environment: process.env.NODE_ENV,
        isVercel: process.env.VERCEL === '1',
        currentState: mongoose.connection.readyState
      });

      // Establish new connection with enhanced error handling
      const connection = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      
      // Verify connection with ping
      await connection.connection.db.admin().ping();
      
      // Reset connection attempts on success
      connectionAttempts = 0;
      lastConnectionError = null;

      // Cache the successful connection
      const dbConnection = connection.connection;
      
      if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
        global[globalConnectionKey] = dbConnection;
      } else {
        cachedConnection = dbConnection;
      }
      
      console.log('MONGO_CONNECTION_SUCCESS', {
        message: 'MongoDB connected successfully',
        readyState: dbConnection.readyState,
        host: dbConnection.host,
        database: dbConnection.name,
        isVercel: process.env.VERCEL === '1'
      });

      return dbConnection;
    } catch (error) {
      // Increment connection attempts
      connectionAttempts++;
      lastConnectionError = error;
      
      // Reset connection promise on failure
      if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
        global[globalConnectionKey + 'Promise'] = null;
        global[globalConnectionKey] = null;
      } else {
        connectionPromise = null;
        cachedConnection = null;
      }
      
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: error.code || 'CONNECTION_FAILED',
        stack: error.stack,
        isVercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV,
        connectionAttempts,
        maxAttempts: MAX_CONNECTION_ATTEMPTS,
        // Add helpful troubleshooting info
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
        console.error('MONGO_CONNECTION_FAILED_PERMANENTLY', {
          message: 'MongoDB connection failed permanently after max attempts',
          attempts: connectionAttempts,
          lastError: error.message
        });
        throw new Error(`Database connection failed: ${error.message}`);
      }

      throw error;
    }
  })();

  // Cache the connection promise
  if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
    global[globalConnectionKey + 'Promise'] = newConnectionPromise;
  } else {
    connectionPromise = newConnectionPromise;
  }

  return newConnectionPromise;
};

/**
 * Health check utility - performs actual ping test with connection validation
 */
const performHealthCheck = async () => {
  try {
    // Check if there's an existing connection without forcing a new one
    if (mongoose.connection.readyState !== 1) {
      return {
        connected: false,
        readyState: mongoose.connection.readyState,
        host: null,
        name: null,
        ping: 'no_connection',
        error: 'No active database connection'
      };
    }
    
    const connection = mongoose.connection;
    
    // Perform actual ping test
    const pingResult = await connection.db.admin().ping();
    
    // Get connection stats for monitoring
    const stats = await connection.db.stats();
    
    return {
      connected: true,
      readyState: connection.readyState,
      host: connection.host,
      name: connection.name,
      ping: pingResult ? 'success' : 'failed',
      stats: {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize
      },
      connectionAttempts,
      lastConnectionError: lastConnectionError?.message || null
    };
  } catch (pingError) {
    return {
      connected: false,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      ping: 'failed',
      error: pingError.message,
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
      console.log('MongoDB connection closed gracefully');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
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
    name: mongoose.connection.name,
    connectionAttempts,
    lastConnectionError: lastConnectionError?.message || null
  };
};

module.exports = { 
  connectDB,
  performHealthCheck, 
  closeConnection,
  getConnectionStatus
};
