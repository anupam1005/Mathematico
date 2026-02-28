const mongoose = require('mongoose');

/**
 * Global connection caching for Vercel serverless environment
 * Prevents multiple connection attempts across cold starts
 * Optimized for Vercel environment variables
 */
const globalConnectionKey = 'mongooseConn';
let cachedConnection = null;
let connectionPromise = null;

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
      return global[globalConnectionKey];
    }
    
    // Return existing connection promise if connection is in progress
    if (global[globalConnectionKey + 'Promise']) {
      return global[globalConnectionKey + 'Promise'];
    }
  } else {
    // Local development - use module-level caching
    if (cachedConnection && cachedConnection.readyState === 1) {
      return cachedConnection;
    }
    
    if (connectionPromise) {
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

  // Log connection attempt (without sensitive data)
  console.log('MONGO_CONNECTING', {
    environment: process.env.NODE_ENV,
    isVercel: process.env.VERCEL === '1',
    uriLength: process.env.MONGO_URI.length,
    uriStartsWith: process.env.MONGO_URI.substring(0, 20) + '...'
  });

  // Create connection promise and cache it
  const newConnectionPromise = (async () => {
    try {
      // Use existing connection if available
      if (mongoose.connection.readyState === 1) {
        const connection = mongoose.connection;
        
        // Cache in the appropriate location
        if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
          global[globalConnectionKey] = connection;
        } else {
          cachedConnection = connection;
        }
        
        console.log('MONGO_REUSE_EXISTING', {
          readyState: connection.readyState,
          host: connection.host,
          database: connection.name
        });
        return connection;
      }

      // Vercel-optimized connection settings (minimal for compatibility)
      const connectionOptions = {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: process.env.VERCEL === '1' ? 5 : 10, // Smaller pool for serverless
        retryWrites: true,
        w: 'majority'
      };

      // Establish new connection
      const connection = await mongoose.connect(process.env.MONGO_URI, connectionOptions);

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
        vercelEnv: process.env.VERCEL_ENV
      });

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
 * Health check utility - performs actual ping test
 */
const performHealthCheck = async () => {
  const connection = await connectDB();
  
  // Perform actual ping test
  try {
    await connection.db.admin().ping();
    return {
      connected: true,
      readyState: connection.readyState,
      host: connection.host,
      name: connection.name,
      ping: 'success'
    };
  } catch (pingError) {
    throw new Error(`Database ping failed: ${pingError.message}`);
  }
};

module.exports = { connectDB, performHealthCheck };
