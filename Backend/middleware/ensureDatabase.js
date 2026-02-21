const mongoose = require('mongoose');
const connectDB = require('../config/database');

/**
 * Middleware to ensure MongoDB connection before handling requests
 * - Attempts to connect if not already connected
 * - Returns 503 if connection fails
 * - Validates readyState before proceeding
 */
const ensureDatabase = async (req, res, next) => {
  try {
    // Check current connection state
    const readyState = mongoose.connection.readyState;
    
    // If already connected, proceed
    if (readyState === 1) {
      return next();
    }
    
    // Attempt to connect if not connected
    try {
      await connectDB();
      
      // Validate connection after attempt
      const newReadyState = mongoose.connection.readyState;
      if (newReadyState !== 1) {
        console.error('MONGO_CONNECTION_ERROR', {
          message: 'Database connection failed in middleware',
          readyState: newReadyState,
          code: 'MIDDLEWARE_CONNECTION_FAILED'
        });
        
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable',
          error: 'Service Unavailable',
          timestamp: new Date().toISOString(),
          database: {
            connected: false,
            readyState: newReadyState
          }
        });
      }
      
      // Connection successful, proceed
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
  } catch (error) {
    console.error('MONGO_CONNECTION_ERROR', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      code: 'MIDDLEWARE_ERROR',
      stack: error?.stack
    });
    
    return res.status(503).json({
      success: false,
      message: 'Database connection check failed',
      error: 'Service Unavailable',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = ensureDatabase;
