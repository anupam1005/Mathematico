const mongoose = require('mongoose');

/**
 * Global connection caching for Vercel serverless environment
 * Prevents multiple connection attempts across cold starts
 */
let cachedConnection = null;
let connectionPromise = null;

/**
 * Production-safe MongoDB connection with global caching
 * - Uses singleton pattern for Vercel serverless
 * - Caches connection promise to prevent race conditions
 * - Validates connection state before returning
 * - Structured error logging
 * - Vercel serverless compatible
 */
const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }

  // Return existing connection promise if connection is in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  // Validate environment
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is undefined");
  }

  // Create connection promise and cache it
  connectionPromise = (async () => {
    try {
      // Use existing connection if available
      if (mongoose.connection.readyState === 1) {
        cachedConnection = mongoose.connection;
        return cachedConnection;
      }

      // Establish new connection
      const connection = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        w: 'majority'
      });

      // Cache the successful connection
      cachedConnection = connection.connection;
      
      console.log('MONGO_CONNECTION_SUCCESS', {
        message: 'MongoDB connected successfully',
        readyState: cachedConnection.readyState,
        host: cachedConnection.host,
        database: cachedConnection.name
      });

      return cachedConnection;
    } catch (error) {
      // Reset connection promise on failure
      connectionPromise = null;
      cachedConnection = null;
      
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: error.code || 'CONNECTION_FAILED',
        stack: error.stack
      });

      throw error;
    }
  })();

  return connectionPromise;
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
