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
  // Use global connection caching for serverless environments
  if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
    // Check for cached global connection
    if (global[globalConnectionKey] && global[globalConnectionKey].readyState === 1) {
      console.log('MONGO_REUSE_CACHED', {
        readyState: global[globalConnectionKey].readyState,
        host: global[globalConnectionKey].host,
        database: global[globalConnectionKey].name
      });
      return global[globalConnectionKey];
    }
    
    // Return existing connection promise if connection is in progress
    if (global[globalConnectionKey + 'Promise']) {
      console.log('MONGO_CONNECTION_IN_PROGRESS', { reusing: true });
      return global[globalConnectionKey + 'Promise'];
    }
  } else {
    // Local development - use module-level caching
    if (cachedConnection && cachedConnection.readyState === 1) {
      console.log('MONGO_REUSE_LOCAL', {
        readyState: cachedConnection.readyState,
        host: cachedConnection.host,
        database: cachedConnection.name
      });
      return cachedConnection;
    }
    
    if (connectionPromise) {
      console.log('MONGO_CONNECTION_IN_PROGRESS', { reusing: true });
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

  // Check if mongoose already has an active connection before attempting new connection
  if (mongoose.connection.readyState === 1) {
    const connection = mongoose.connection;
    
    // Cache the active connection
    if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
      global[globalConnectionKey] = connection;
    } else {
      cachedConnection = connection;
    }
    
    console.log('MONGO_REUSE_MONGOOSE', {
      readyState: connection.readyState,
      host: connection.host,
      database: connection.name
    });
    return connection;
  }

  // Only log connecting when we actually need to establish a new connection
  console.log('MONGO_CONNECTING', {
    environment: process.env.NODE_ENV,
    isVercel: process.env.VERCEL === '1',
    uriLength: process.env.MONGO_URI.length,
    uriStartsWith: process.env.MONGO_URI.substring(0, 20) + '...',
    currentState: mongoose.connection.readyState
  });

  // Create connection promise and cache it
  const newConnectionPromise = (async () => {
    try {
      // Force close existing connection if in bad state
      if (mongoose.connection.readyState > 1) {
        await mongoose.connection.close();
        console.log('MONGO_FORCE_CLOSE', { reason: 'Bad connection state detected' });
      }

      // Production-hardened connection settings with retry and TLS
      const connectionOptions = {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: process.env.VERCEL === '1' ? 5 : 10,
        minPoolSize: 2,
        maxIdleTimeMS: 60000,
        waitQueueTimeoutMS: 15000,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        maxConnecting: 10
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
        maxAttempts: MAX_CONNECTION_ATTEMPTS
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
  const connection = await connectDB();
  
  // Perform actual ping test
  try {
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
    throw new Error(`Database ping failed: ${pingError.message}`);
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
