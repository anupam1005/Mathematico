const mongoose = require('mongoose');

// Database connection utility for serverless functions
let dbConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    dbConnected = true;
    return mongoose.connection;
  }

  // Return existing connection promise if in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://anupamdas0515_db_user:8bO4aEEQ2TYAfCSu@mathematico-app.vszbcc9.mongodb.net/test?retryWrites=true&w=majority&appName=Mathematico-app';
    
    // Serverless-optimized connection options for Vercel
    const options = {
      maxPoolSize: 1, // Reduced for serverless
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 60000, // Increased socket timeout
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 30000, // Increased connection timeout
      heartbeatFrequencyMS: 10000
      // Removed deprecated options: bufferMaxEntries, useNewUrlParser, useUnifiedTopology
    };

    console.log('🔗 Attempting MongoDB connection with options:', {
      maxPoolSize: options.maxPoolSize,
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
      connectTimeoutMS: options.connectTimeoutMS
    });

    connectionPromise = mongoose.connect(mongoUri, options);
    
    const connection = await connectionPromise;
    dbConnected = true;
    console.log('✅ MongoDB Atlas connection established successfully');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('📝 Database:', mongoose.connection.name);
    
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
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('❌ Full error:', error);
    dbConnected = false;
    connectionPromise = null;
    throw error; // Don't return null, throw error to be handled by caller
  }
};

const ensureDatabaseConnection = async () => {
  // If already connected, return true
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Database already connected');
    return true;
  }
  
  try {
    console.log('🔗 Ensuring database connection...');
    
    // Force a new connection if not connected
    if (mongoose.connection.readyState === 0) {
      console.log('🔄 Starting new MongoDB connection...');
      const connection = await connectToDatabase();
      
      if (connection && mongoose.connection.readyState === 1) {
        console.log('✅ Database connection ensured');
        return true;
      }
    }
    
    // Wait a bit for connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Database connection ensured after wait');
      return true;
    } else {
      console.warn('⚠️ Database connection not established, readyState:', mongoose.connection.readyState);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to ensure database connection:', error.message);
    console.error('❌ Full error:', error);
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
