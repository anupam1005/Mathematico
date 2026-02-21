const mongoose = require('mongoose');

// Global connection cache for Vercel serverless (persists across invocations)
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

/**
 * Production-safe MongoDB connection with strict error handling
 * - Fails fast if MONGO_URI is missing
 * - Throws explicit errors (no silent failures)
 * - Validates connection state before returning
 * - Structured error logging
 * - Vercel serverless compatible
 */
const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxRetries = isProduction ? 3 : 2;
  const retryDelay = isProduction ? 2000 : 1000; // 2s delay in production, 1s in dev
  
  // Check if we have a cached connection that's still alive
  if (cached.conn) {
    const readyState = mongoose.connection.readyState;
    if (readyState === 1) {
      // Connection is alive and connected
      return cached.conn;
    } else {
      // Connection lost, reset cache to allow reconnection
      cached.conn = null;
      cached.promise = null;
    }
  }

  // Create new connection promise if one doesn't exist
  if (!cached.promise) {
    let lastError = null;
    
    // Retry connection logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`MONGO_CONNECTION_ATTEMPT`, {
          attempt,
          maxRetries,
          timestamp: new Date().toISOString()
        });
        
        cached.promise = attemptConnection(isProduction);
        const mongooseInstance = await cached.promise;
        return mongooseInstance;
        
      } catch (error) {
        lastError = error;
        console.error(`MONGO_CONNECTION_ATTEMPT_${attempt}_FAILED`, {
          attempt,
          maxRetries,
          message: error?.message || 'Unknown error',
          code: error?.code || 'UNKNOWN',
          willRetry: attempt < maxRetries
        });
        
        // Reset promise on failed attempt
        cached.promise = null;
        
        if (attempt < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // Exponential backoff
        }
      }
    }
    
    // All retries failed
    const connectionError = new Error(
      `MongoDB connection failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
    connectionError.originalError = lastError;
    connectionError.code = 'CONNECTION_FAILED';
    throw connectionError;
  }

  // Await existing connection promise
  try {
    const mongooseInstance = await cached.promise;
    
    // Final validation: ensure connection is actually connected
    const readyState = mongooseInstance.connection.readyState;
    if (readyState !== 1) {
      const error = new Error(`MongoDB connection readyState is ${readyState}, expected 1 (connected)`);
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: 'NOT_CONNECTED',
        readyState,
        stack: error.stack
      });
      cached.conn = null;
      cached.promise = null;
      throw error;
    }
    
    cached.conn = mongooseInstance.connection;
    return mongooseInstance;
  } catch (error) {
    // Clear promise on error to allow retry
    cached.promise = null;
    
    // Structured error logging
    console.error('MONGO_CONNECTION_ERROR', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'MongoError',
      code: error?.code || 'AWAIT_FAILED',
      stack: error?.stack
    });
    
    // Re-throw with explicit error message
    const connectionError = new Error(
      `MongoDB connection failed: ${error?.message || 'Unknown error'}`
    );
    connectionError.originalError = error;
    throw connectionError;
  }
};

// Helper function to attempt connection
const attemptConnection = async (isProduction) => {
    // STRICT: Fail fast if MONGO_URI is missing
    // In production, ONLY read from Vercel environment variables
    const mongoURI = (process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
    
    if (!mongoURI) {
      const error = new Error('MONGO_URI (or MONGODB_URI) is required for database connection');
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: 'MISSING_URI',
        stack: error.stack
      });
      throw error;
    }

    // Validate URI format (basic check)
    if (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://')) {
      const error = new Error('Invalid MONGO_URI format. Must start with mongodb:// or mongodb+srv://');
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: 'INVALID_URI_FORMAT',
        stack: error.stack
      });
      throw error;
    }

    // Ensure URI includes required query parameters
    let finalURI = mongoURI;
    if (!finalURI.includes('retryWrites=true')) {
      finalURI += (finalURI.includes('?') ? '&' : '?') + 'retryWrites=true';
    }
    if (!finalURI.includes('w=majority')) {
      finalURI += '&w=majority';
    }

    // Create connection promise
    cached.promise = mongoose.connect(finalURI, {
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
      maxPoolSize: isProduction ? 5 : 10, // Reduced pool for serverless
      serverSelectionTimeoutMS: isProduction ? 30000 : 15000, // Increased timeout for production
      socketTimeoutMS: isProduction ? 60000 : 45000, // Increased socket timeout
      bufferCommands: false, // Disable mongoose buffering
      connectTimeoutMS: isProduction ? 20000 : 10000, // Increased connect timeout
      heartbeatFrequencyMS: isProduction ? 30000 : 10000, // Increased heartbeat for serverless
      retryWrites: true,
      w: 'majority',
      // Serverless-specific options
      maxIdleTimeMS: isProduction ? 10000 : 30000, // Close idle connections faster in serverless
      waitQueueTimeoutMS: isProduction ? 5000 : 10000 // Reduce wait time
    }).then((mongooseInstance) => {
      // Validate connection actually succeeded
      const readyState = mongooseInstance.connection.readyState;
      if (readyState !== 1) {
        const error = new Error(`MongoDB connection established but readyState is ${readyState} (expected 1)`);
        console.error('MONGO_CONNECTION_ERROR', {
          message: error.message,
          name: error.name,
          code: 'INVALID_READY_STATE',
          readyState,
          stack: error.stack
        });
        cached.promise = null;
        throw error;
      }

      const { host, name } = mongooseInstance.connection;
      
      // Log successful connection (production-safe)
      if (!isProduction) {
        console.log(`✅ MongoDB Connected: ${host}`);
        console.log(`📊 Database: ${name}`);
      } else {
        console.log('MONGO_CONNECTION_SUCCESS', {
          host,
          database: name,
          readyState: 1
        });
      }

      // Set up connection event listeners (never throw from event handlers in serverless)
      mongoose.connection.on('connected', () => {
        if (!isProduction) {
          console.log('🔗 Mongoose connected to MongoDB');
        }
      });

      mongoose.connection.on('error', (err) => {
        console.error('MONGO_CONNECTION_ERROR', {
          message: err?.message || 'Unknown error',
          name: err?.name || 'MongoError',
          code: err?.code || 'UNKNOWN',
          stack: err?.stack
        });
        // Reset cache on connection error to allow reconnection
        if (cached.conn === mongooseInstance.connection) {
          cached.conn = null;
          cached.promise = null;
        }
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MONGO_DISCONNECTED', {
          message: 'Mongoose disconnected from MongoDB',
          timestamp: new Date().toISOString()
        });
        // Reset cache on disconnect to allow reconnection
        if (cached.conn === mongooseInstance.connection) {
          cached.conn = null;
          cached.promise = null;
        }
      });

      // Graceful shutdown handler (local/dev only - not used in serverless)
      if (!isProduction && require.main === module) {
        process.on('SIGINT', async () => {
          try {
            await mongoose.connection.close();
            console.log('🛑 MongoDB connection closed through app termination');
            process.exit(0);
          } catch (e) {
            console.error('MONGO_CONNECTION_ERROR', {
              message: 'Error closing MongoDB connection',
              name: e?.name || 'Error',
              code: e?.code || 'CLOSE_ERROR',
              stack: e?.stack
            });
            process.exit(1);
          }
        });
      }

      cached.conn = mongooseInstance.connection;
      return mongooseInstance;
    }).catch((error) => {
      // Clear promise on error to allow retry
      cached.promise = null;
      
      // Structured error logging
      console.error('MONGO_CONNECTION_ERROR', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'MongoError',
        code: error?.code || 'CONNECTION_FAILED',
        stack: error?.stack
      });
      
      // Re-throw with explicit error message
      const connectionError = new Error(
        `MongoDB connection failed: ${error?.message || 'Unknown error'}`
      );
      connectionError.originalError = error;
      throw connectionError;
    });
  }

  // Await the connection promise
  try {
    const mongooseInstance = await cached.promise;
    
    // Final validation: ensure connection is actually connected
    const readyState = mongooseInstance.connection.readyState;
    if (readyState !== 1) {
      const error = new Error(`MongoDB connection readyState is ${readyState}, expected 1 (connected)`);
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: 'NOT_CONNECTED',
        readyState,
        stack: error.stack
      });
      cached.conn = null;
      cached.promise = null;
      throw error;
    }
    
    cached.conn = mongooseInstance.connection;
    return mongooseInstance;
  } catch (error) {
    // Clear promise on error to allow retry
    cached.promise = null;
    
    // Structured error logging
    console.error('MONGO_CONNECTION_ERROR', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'MongoError',
      code: error?.code || 'AWAIT_FAILED',
      stack: error?.stack
    });
    
    // Re-throw with explicit error message
    const connectionError = new Error(
      `MongoDB connection failed: ${error?.message || 'Unknown error'}`
    );
    connectionError.originalError = error;
    throw connectionError;
  }

module.exports = connectDB;
