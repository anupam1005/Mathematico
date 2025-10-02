const mongoose = require('mongoose');

// Database connection utility for serverless functions
let dbConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  if (dbConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn('⚠️ MONGODB_URI not found, running in fallback mode');
      return null;
    }
    
    // Serverless-optimized connection options
    const options = {
      maxPoolSize: 1, // Reduced for serverless
      serverSelectionTimeoutMS: 5000, // Faster timeout for serverless
      socketTimeoutMS: 30000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000
    };

    connectionPromise = mongoose.connect(mongoUri, options);
    
    const connection = await connectionPromise;
    dbConnected = true;
    console.log('✅ MongoDB connection established');
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      dbConnected = false;
      connectionPromise = null;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      dbConnected = false;
      connectionPromise = null;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      dbConnected = true;
    });

    return connection;
    
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed, running in fallback mode:', error.message);
    dbConnected = false;
    connectionPromise = null;
    return null;
  }
};

const ensureDatabaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  
  try {
    await connectToDatabase();
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('Failed to ensure database connection:', error);
    return false;
  }
};

const getConnectionStatus = () => {
  return {
    isConnected: dbConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name
  };
};

module.exports = {
  connectToDatabase,
  ensureDatabaseConnection,
  getConnectionStatus,
  mongoose
};
