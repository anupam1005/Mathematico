/**
 * database.js — Persistent MongoDB connection for Railway / Render / Fly.io
 *
 * Differences from the old serverless version:
 * - Higher pool size (10 → 20) because connections are truly persistent
 * - Reconnect events instead of per-request reconnect logic
 * - bufferCommands = true so queries queue while reconnecting (safe on persistent server)
 * - No cold-start workarounds needed
 */

const mongoose = require('mongoose');

const mongoOptions = {
  maxPoolSize: 20,         // Larger pool — connections are reused across all requests
  minPoolSize: 5,          // Keep 5 warm connections at all times
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  heartbeatFrequencyMS: 10000, // Detect dropped connections faster
  retryWrites: true,
  retryReads: true,
  family: 4               // Force IPv4
};

let _connectionPromise = null;
let _lastError = null;
let _lastConnectedAt = null;

// ─── Connection events ────────────────────────────────────────────────────────

mongoose.connection.on('connected', () => {
  _lastConnectedAt = new Date().toISOString();
  _lastError = null;
  console.log(`[DB] MongoDB connected — ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected — will auto-reconnect');
});

mongoose.connection.on('reconnected', () => {
  _lastConnectedAt = new Date().toISOString();
  console.log('[DB] MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  _lastError = err;
  console.error('[DB] MongoDB error:', err.message);
});

// ─── Connect ──────────────────────────────────────────────────────────────────

const connectDB = async () => {
  // Already connected — return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required');
  }

  // If a connection is in progress, wait for it
  if (_connectionPromise) {
    return _connectionPromise;
  }

  _connectionPromise = mongoose
    .connect(process.env.MONGO_URI, mongoOptions)
    .then((m) => {
      _connectionPromise = null;
      return m.connection;
    })
    .catch((err) => {
      _lastError = err;
      _connectionPromise = null;
      throw err;
    });

  return _connectionPromise;
};

// ─── Health check ─────────────────────────────────────────────────────────────

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
        lastConnectionError: _lastError?.message || null
      };
    }

    let pingResult = 'failed';
    try {
      const pong = await mongoose.connection.db.admin().ping();
      pingResult = pong ? 'success' : 'failed';
    } catch (_) {
      pingResult = 'failed';
    }

    return {
      connected: true,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      ping: pingResult,
      lastConnectedAt: _lastConnectedAt,
      lastConnectionError: _lastError?.message || null
    };
  } catch (healthError) {
    return {
      connected: false,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      ping: 'failed',
      error: healthError.message,
      lastConnectionError: _lastError?.message || null
    };
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────

const closeConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[DB] MongoDB connection closed gracefully');
    }
  } catch (error) {
    console.error('[DB] Error closing MongoDB connection:', error.message);
  }
};

// Hook into process termination so Railway can do a clean shutdown
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

// ─── Status utility ───────────────────────────────────────────────────────────

const getConnectionStatus = () => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return {
    readyState: mongoose.connection.readyState,
    state: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host,
    database: mongoose.connection.name,
    lastConnectedAt: _lastConnectedAt,
    lastConnectionError: _lastError?.message || null
  };
};

const databaseHealthCheck = async () => {
  const health = await performHealthCheck();
  return {
    status: health.connected ? 'healthy' : 'unhealthy',
    message: health.connected ? 'Database is operational' : 'Database is not operational',
    connection: getConnectionStatus(),
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
