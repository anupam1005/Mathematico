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
    return cached.conn;
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
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        // Removed deprecated options: useNewUrlParser and useUnifiedTopology
      };

      cached.promise = mongoose.connect(mongoURI, options).then((mongooseInstance) => {
        const { host, name } = mongooseInstance.connection;
        
        if (!isProduction) {
          console.log(`✅ MongoDB Connected: ${host}`);
          console.log(`📊 Database: ${name}`);
        }

        // Connection event listeners
        mongoose.connection.on('connected', () => {
          if (!isProduction) {
            console.log('🔗 Mongoose connected to MongoDB');
          }
        });

        mongoose.connection.on('error', (err) => {
          const errorMsg = `Mongoose connection error: ${err?.message || 'Unknown error'}`;
          console.error('❌', errorMsg);
          if (isProduction) {
            throw new Error(errorMsg);
          }
        });

        mongoose.connection.on('disconnected', () => {
          const errorMsg = 'Mongoose disconnected from MongoDB';
          console.warn('⚠️', errorMsg);
          if (isProduction) {
            throw new Error(errorMsg);
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

        return mongooseInstance;
      });
    } catch (error) {
      const errorMessage = `Failed to initiate MongoDB connection: ${error?.message || 'Unknown error'}`;
      console.error('❌', errorMessage);
      
      // In production, exit immediately on connection failure
      if (isProduction) {
        console.error('❌ Production database connection failed - exiting');
        process.exit(1);
      }
      
      throw new Error(errorMessage);
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    const errorMessage = `MongoDB connection failed: ${error?.message || 'Unknown error'}`;
    console.error('❌', errorMessage);
    
    // In production, exit immediately on connection failure
    if (isProduction) {
      console.error('❌ Production database connection failed - exiting');
      process.exit(1);
    }
    
    throw new Error(errorMessage);
  }

  return cached.conn;
};

module.exports = connectDB;
