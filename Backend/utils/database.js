const mongoose = require('mongoose');

// Database connection utility for serverless functions
let dbConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    dbConnected = true;
    console.log('✅ Database already connected');
    return mongoose.connection;
  }

  // Return existing connection promise if in progress
  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection...');
    return connectionPromise;
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://anupamdas0515_db_user:8bO4aEEQ2TYAfCSu@mathematico-app.vszbcc9.mongodb.net/test?retryWrites=true&w=majority&appName=Mathematico-app';
    
    // Optimized connection options for serverless environment
    const options = {
      maxPoolSize: 1, // Minimal for serverless
      serverSelectionTimeoutMS: 5000, // Increased for better reliability
      socketTimeoutMS: 15000, // Increased for better reliability
      bufferCommands: false,
      retryWrites: true,
      w: 'majority',
      connectTimeoutMS: 5000, // Increased for better reliability
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 30000,
      minPoolSize: 0,
      // Additional serverless optimizations
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Connection pooling for serverless
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 5000
    };

    console.log('🔗 Attempting MongoDB connection with optimized options');

    connectionPromise = mongoose.connect(mongoUri, options);
    
    const connection = await connectionPromise;
    dbConnected = true;
    console.log('✅ MongoDB Atlas connection established successfully');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('📝 Database:', mongoose.connection.name);
    
    // Test the connection with a simple operation
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database ping successful');
    } catch (pingError) {
      console.warn('⚠️ Database ping failed:', pingError.message);
    }
    
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
    console.error('❌ Connection error details:', {
      name: error.name,
      code: error.code,
      message: error.message
    });
    dbConnected = false;
    connectionPromise = null;
    throw error; // Don't return null, throw error to be handled by caller
  }
};

const ensureDatabaseConnection = async (maxRetries = 5) => {
  // If already connected, return true
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Database already connected');
    return true;
  }
  
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`🔗 Ensuring database connection... (attempt ${retryCount + 1}/${maxRetries})`);
      
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
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      
      if (mongoose.connection.readyState === 1) {
        console.log('✅ Database connection ensured after wait');
        return true;
      } else {
        console.warn(`⚠️ Database connection not established, readyState: ${mongoose.connection.readyState}`);
        retryCount++;
        
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying database connection in ${retryCount} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      console.error(`❌ Database connection attempt ${retryCount + 1} failed:`, error.message);
      console.error(`❌ Error details:`, {
        name: error.name,
        code: error.code,
        message: error.message
      });
      retryCount++;
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying database connection in ${retryCount} seconds...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }
  
  console.error('❌ Failed to ensure database connection after all retries');
  return false;
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
