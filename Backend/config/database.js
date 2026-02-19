const mongoose = require('mongoose');

// Cache connection across serverless invocations
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

// MongoDB connection configuration with strict error handling
const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (cached.conn) {
    // Verify connection is still alive
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    } else {
      // Connection lost, reset cache
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const mongoURI = (process.env.MONGO_URI || process.env.MONGODB_URI || '').trim();
    if (!mongoURI) {
      throw new Error('MONGO_URI (or MONGODB_URI) is required for database connection');
    }

    try {
      const options = {
        ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000, // Increased for M0 free tier
        socketTimeoutMS: 45000,
        bufferCommands: false,
        connectTimeoutMS: 10000, // Added for better timeout handling
        heartbeatFrequencyMS: 10000, // Added for M0 compatibility
        retryWrites: true, // Added for reliability
        w: 'majority' // Added for data safety
      };

      cached.promise = mongoose.connect(mongoURI, options).then((mongooseInstance) => {
        const { host, name } = mongooseInstance.connection;
        
        if (!isProduction) {
          console.log(`✅ MongoDB Connected: ${host}`);
          console.log(`📊 Database: ${name}`);
        }

        // Connection event listeners (never throw from event handlers in serverless)
        mongoose.connection.on('connected', () => {
          if (!isProduction) {
            console.log('🔗 Mongoose connected to MongoDB');
          }
        });

        mongoose.connection.on('error', (err) => {
          const errorMsg = `Mongoose connection error: ${err?.message || 'Unknown error'}`;
          console.error('❌', errorMsg);
          // Reset cache on connection error to allow reconnection
          if (cached.conn === mongooseInstance.connection) {
            cached.conn = null;
            cached.promise = null;
          }
        });

        mongoose.connection.on('disconnected', () => {
          const errorMsg = 'Mongoose disconnected from MongoDB';
          console.warn('⚠️', errorMsg);
          // Reset cache on disconnect to allow reconnection
          if (cached.conn === mongooseInstance.connection) {
            cached.conn = null;
            cached.promise = null;
          }
        });

        // Graceful shutdown (local/dev)
        if (!isProduction) {
          process.on('SIGINT', async () => {
            try {
              await mongoose.connection.close();
              console.log('🛑 MongoDB connection closed through app termination');
              process.exit(0);
            } catch (e) {
              process.exit(1);
            }
          });
        }

        cached.conn = mongooseInstance.connection;
        return mongooseInstance;
      });
    } catch (error) {
      const errorMessage = `Failed to initiate MongoDB connection: ${error?.message || 'Unknown error'}`;
      console.error('❌', errorMessage);
      
      throw new Error(errorMessage);
    }
  }

  try {
    const mongooseInstance = await cached.promise;
    cached.conn = mongooseInstance.connection;
    return mongooseInstance;
  } catch (error) {
    cached.promise = null;
    const errorMessage = `MongoDB connection failed: ${error?.message || 'Unknown error'}`;
    console.error('❌', errorMessage);
    
    throw new Error(errorMessage);
  }
};

module.exports = connectDB;
