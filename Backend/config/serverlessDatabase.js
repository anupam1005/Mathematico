const mongoose = require('mongoose');

const CONNECTION_TIMEOUT_MS = 45000;

const mongoOptions = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  retryReads: true
};

mongoose.set('bufferCommands', false);

if (!global.__mongooseCache) {
  global.__mongooseCache = {
    conn: null,
    promise: null,
    lastError: null,
    lastConnectedAt: null
  };
}

const withTimeout = (promise, timeoutMs, label) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};

const connectDB = async () => {
  if (global.__mongooseCache.conn && mongoose.connection.readyState === 1) {
    return global.__mongooseCache.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required');
  }

  if (!global.__mongooseCache.promise) {
    global.__mongooseCache.promise = (async () => {
      try {
        const mongooseInstance = await withTimeout(
          mongoose.connect(process.env.MONGO_URI, mongoOptions),
          CONNECTION_TIMEOUT_MS,
          'MongoDB connection'
        );

        global.__mongooseCache.conn = mongooseInstance.connection;
        global.__mongooseCache.lastConnectedAt = new Date().toISOString();
        global.__mongooseCache.lastError = null;
        return global.__mongooseCache.conn;
      } catch (error) {
        global.__mongooseCache.conn = null;
        global.__mongooseCache.lastError = error;
        throw error;
      } finally {
        global.__mongooseCache.promise = null;
      }
    })();
  }

  return withTimeout(global.__mongooseCache.promise, CONNECTION_TIMEOUT_MS, 'MongoDB handshake');
};

/**
 * Serverless-safe health check - reflects real DB state
 * NEVER forces new connections
 */
const performHealthCheck = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        connected: false,
        readyState: mongoose.connection.readyState,
        host: null,
        database: null,
        ping: 'no_connection',
        error: 'No active database connection',
        lastConnectionError: global.__mongooseCache.lastError?.message || null
      };
    }

    const connection = mongoose.connection;
    let pingResult = 'failed';
    try {
      const pingResponse = await connection.db.admin().ping();
      pingResult = pingResponse ? 'success' : 'failed';
    } catch (_) {
      pingResult = 'failed';
    }

    return {
      connected: true,
      readyState: connection.readyState,
      host: connection.host,
      database: connection.name,
      ping: pingResult,
      lastConnectedAt: global.__mongooseCache.lastConnectedAt,
      lastConnectionError: global.__mongooseCache.lastError?.message || null
    };
  } catch (healthError) {
    return {
      connected: false,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      ping: 'failed',
      error: healthError.message,
      lastConnectionError: global.__mongooseCache.lastError?.message || null
    };
  }
};

/**
 * Graceful shutdown utility
 */
const closeConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      global.__mongooseCache.conn = null;
      global.__mongooseCache.promise = null;
    }
  } catch (error) {
    console.error('MONGO_CLOSE_ERROR', { error: error.message });
  }
};

/**
 * Connection status utility
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    readyState: mongoose.connection.readyState,
    state: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    lastConnectedAt: global.__mongooseCache.lastConnectedAt,
    lastConnectionError: global.__mongooseCache.lastError?.message || null
  };
};

/**
 * Database health check for monitoring
 */
const databaseHealthCheck = async () => {
  const status = getConnectionStatus();
  const health = await performHealthCheck();
  
  return {
    status: health.connected ? 'healthy' : 'unhealthy',
    message: health.connected ? 'Database is operational' : 'Database is not operational',
    connection: status,
    health,
    timestamp: new Date().toISOString()
  };
};

module.exports = { 
  connectDB,
  performHealthCheck, 
  closeConnection,
  getConnectionStatus,
  databaseHealthCheck
};
