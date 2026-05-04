const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

/**
 * Middleware to ensure MongoDB connection before handling requests
 * - Uses cached connection from database.js
 * - Returns 503 if connection fails
 * - No redundant readyState checks (handled by connectDB)
 */
const ensureDatabase = async (req, res, next) => {
  try {
    // connectDB handles caching and connection state internally
    await connectDB();
    
    // If we reach here, connection is guaranteed to be ready
    return next();
  } catch (connectionError) {
    console.error('MONGO_CONNECTION_ERROR', {
      message: connectionError?.message || 'Unknown error',
      name: connectionError?.name || 'MongoError',
      code: connectionError?.code || 'MIDDLEWARE_CONNECTION_ERROR',
      stack: connectionError?.stack
    });
    
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        readyState: mongoose.connection.readyState || 0
      }
    });
  }
};

module.exports = ensureDatabase;
