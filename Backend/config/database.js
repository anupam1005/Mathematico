const mongoose = require('mongoose');

// Cache connection across serverless invocations
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

// MongoDB connection configuration
const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoURI = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';
    if (!mongoURI) {
      throw new Error('MONGO_URI is required for database connection');
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
        console.log(`✅ MongoDB Connected: ${host}`);
        console.log(`📊 Database: ${name}`);

        // Connection event listeners
        mongoose.connection.on('connected', () => {
          console.log('🔗 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', () => {
          console.error('❌ Mongoose connection error');
        });

        mongoose.connection.on('disconnected', () => {
          console.log('🔌 Mongoose disconnected from MongoDB');
        });

        // Graceful shutdown (local/dev)
        process.on('SIGINT', async () => {
          try {
            await mongoose.connection.close();
            console.log('🛑 MongoDB connection closed through app termination');
            process.exit(0);
          } catch (e) {
            process.exit(1);
          }
        });

        return mongooseInstance;
      });
    } catch (error) {
      console.error('❌ Failed to initiate MongoDB connection');
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed');
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
