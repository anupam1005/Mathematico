/**
 * MongoDB Test Endpoint
 * Add this to your routes for testing connection in production
 * Usage: GET /api/v1/test/mongo
 */

const mongoose = require('mongoose');
const connectDB = require('../config/database');

module.exports = async (req, res) => {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('MONGO_TEST_START', { timestamp });
    
    // Check current connection state
    const currentReadyState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log('MONGO_TEST_CURRENT_STATE', {
      readyState: currentReadyState,
      state: stateMap[currentReadyState],
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });
    
    // If not connected, try to connect
    if (currentReadyState !== 1) {
      console.log('MONGO_TEST_ATTEMPTING_CONNECTION');
      await connectDB();
    }
    
    // Test database operation
    const admin = mongoose.connection.db.admin();
    const pingResult = await admin.ping();
    
    // Get server info
    const serverInfo = await admin.serverStatus();
    
    console.log('MONGO_TEST_SUCCESS', {
      pingResult,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });
    
    return res.status(200).json({
      success: true,
      timestamp,
      connection: {
        status: 'connected',
        readyState: mongoose.connection.readyState,
        state: stateMap[mongoose.connection.readyState],
        host: mongoose.connection.host,
        database: mongoose.connection.name
      },
      test: {
        ping: pingResult,
        serverVersion: serverInfo.version,
        uptime: serverInfo.uptime
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        MONGO_URI_DEFINED: !!process.env.MONGO_URI
      }
    });
    
  } catch (error) {
    console.error('MONGO_TEST_ERROR', {
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      readyState: mongoose.connection.readyState
    });
    
    return res.status(503).json({
      success: false,
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      connection: {
        readyState: mongoose.connection.readyState,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        MONGO_URI_DEFINED: !!process.env.MONGO_URI
      }
    });
  }
};
