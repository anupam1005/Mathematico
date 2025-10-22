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
    try {
      // Default connection string (for development)
      const defaultMongoURI = 'mongodb+srv://smartfarm:mathematico@mathematico.sod8pgp.mongodb.net/mathematico?retryWrites=true&w=majority';
      
      // Use provided MONGODB_URI or fallback to default
      let mongoURI = process.env.MONGODB_URI || defaultMongoURI;
      mongoURI = mongoURI.trim();

      // Ensure the connection string includes the database name and options
      if (!mongoURI.includes('retryWrites')) {
        mongoURI = mongoURI.endsWith('/') 
          ? `${mongoURI}mathematico?retryWrites=true&w=majority`
          : `${mongoURI}/mathematico?retryWrites=true&w=majority`;
      }

      const options = {
        dbName: process.env.MONGODB_DB || 'mathematico',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        // Removed deprecated options: useNewUrlParser and useUnifiedTopology
        // These are no longer needed in Mongoose 6+ and cause warnings
      };

      cached.promise = mongoose.connect(mongoURI, options).then((mongooseInstance) => {
        const { host, name } = mongooseInstance.connection;
        console.log(`✅ MongoDB Connected: ${host}`);
        console.log(`📊 Database: ${name}`);
        console.log(`🔗 Connection String: ${mongoURI}`);
        console.log(`📋 Available Collections:`, mongooseInstance.connection.db.listCollections().toArray().then(collections => {
          console.log('Collections:', collections.map(c => c.name));
        }));

        // Connection event listeners
        mongoose.connection.on('connected', () => {
          console.log('🔗 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
          console.error('❌ Mongoose connection error:', err);
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
      console.error('❌ Failed to initiate MongoDB connection:', error);
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', error && error.message ? error.message : error);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
