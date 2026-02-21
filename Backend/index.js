// Mathematico Backend - Startup Architecture Corrected (Vercel Serverless Compatible)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
const net = require('net');

const connectMongo = require('./config/database');
const configureTrustProxy = require('./config/trustProxy');
const { validateJwtConfig } = require('./utils/jwt');

// Utility function to check if a port is available (local/dev only)
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });

    server.on('error', () => resolve(false));
  });
};

// 1) Create express app
const app = express();

// 2) Configure trust proxy
configureTrustProxy(app);

// 3) Register ROOT route immediately (must never depend on Redis/Mongo)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mathematico-backend",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 4) Register favicon routes immediately (must never depend on Redis/Mongo)
// Handle common favicon requests to prevent 404s
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("/favicon.png", (req, res) => res.status(204).end());
app.get("/favicon", (req, res) => res.status(204).end());

// 5) Register security middleware, routes, and error handling IMMEDIATELY after app creation
// This ensures routes are ALWAYS available, regardless of DB connection status
registerSecurityMiddleware();

// JWT validation - graceful degradation (non-critical)
try {
  validateJwtConfig();
} catch (jwtErr) {
  console.warn('⚠️ JWT configuration invalid:', jwtErr && jwtErr.message ? jwtErr.message : jwtErr);
  // Continue without JWT - routes will handle missing tokens gracefully
}

registerRoutes();
registerErrorHandling();

let bootstrapped = false;
let bootstrapPromise = null;
let bootstrapError = null;

function validateEnvironmentFormat() {
  // Strict formatting checks that are safe to run synchronously and won't break `/`.
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl.startsWith('rediss://')) {
      throw new Error('REDIS_URL must use rediss:// (TLS) in production');
    }
  }
}

function registerSecurityMiddleware() {
  // Disable x-powered-by header
  app.disable('x-powered-by');
  
  // Helmet first
  app.use(
    helmet({
      contentSecurityPolicy: false, // API
      crossOriginEmbedderPolicy: false
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookies
  app.use(cookieParser());

  // CORS
  const originEnvValues = [
    process.env.APP_ORIGIN || '',
    process.env.ADMIN_ORIGIN || '',
    process.env.CORS_ORIGIN || '',
    process.env.FRONTEND_URL || '',
    process.env.WEB_URL || '',
    'exp://*',
    'capacitor://*',
    'ionic://*'
  ].filter(Boolean);

  const allowedOrigins = Array.from(
    new Set(
      originEnvValues.flatMap((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      )
    )
  );

  const corsOptions = {
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow Expo development URLs
      if (origin.startsWith('exp://') || origin.includes('expo')) return callback(null, true);

      // Allow mobile app origins
      if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) return callback(null, true);

      // Allow configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ]
  };

  app.use(cors(corsOptions));

  // Request logging (production only)
  if (process.env.NODE_ENV === 'production') {
    const requestLogger = require('./middleware/requestLogger');
    app.use(requestLogger);
  }
}

function registerRoutes() {
  const API_PREFIX = '/api/v1';

  // Health endpoint - returns 503 if DB is disconnected
  app.get('/health', async (req, res) => {
    try {
      const mongoStatus = mongoose.connection.readyState;
      const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      const isConnected = mongoStatus === 1;
      const status = isConnected ? 'ok' : 'error';
      const statusCode = isConnected ? 200 : 503;
      
      // Return 503 if database is not connected
      return res.status(statusCode).json({
        status,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        database: { 
          status: statusMap[mongoStatus] || 'unknown',
          readyState: mongoStatus, // Include actual readyState value (0-3)
          type: 'mongodb',
          connected: isConnected,
          host: mongoose.connection.host || null,
          name: mongoose.connection.name || null
        },
        bootstrap: {
          completed: bootstrapped,
          error: bootstrapError ? bootstrapError.message : null
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: error && error.message ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          readyState: mongoose.connection.readyState || 0
        }
      });
    }
  });

  // Redis health check route
  app.get('/api/v1/health/redis', async (req, res) => {
    try {
      const { redisHealthCheck } = require('./middleware/upstashLoginRateLimiter');
      const { redisHealthCheck: enhancedHealthCheck } = require('./middleware/enhancedRateLimiter');
      
      const [legacyStatus, enhancedStatus] = await Promise.all([
        redisHealthCheck(),
        enhancedHealthCheck()
      ]);
      
      const statusCode = (legacyStatus.healthy && enhancedStatus.healthy) ? 200 : 503;
      
      res.status(statusCode).json({
        service: 'redis',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        legacy: legacyStatus,
        enhanced: enhancedStatus,
        overall: {
          healthy: legacyStatus.healthy && enhancedStatus.healthy,
          status: (legacyStatus.healthy && enhancedStatus.healthy) ? 'healthy' : 'degraded'
        }
      });
    } catch (error) {
      res.status(503).json({
        service: 'redis',
        status: 'error',
        message: error && error.message ? error.message : 'Redis health check failed',
        healthy: false,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API routes
  app.use(`${API_PREFIX}/auth`, require('./routes/auth'));
  app.use(`${API_PREFIX}/admin`, require('./routes/admin'));
  app.use(`${API_PREFIX}/mobile`, require('./routes/mobile'));
  app.use(`${API_PREFIX}/student`, require('./routes/student'));
  app.use(`${API_PREFIX}/users`, require('./routes/users'));
  app.use(`${API_PREFIX}/payments`, require('./routes/payment'));

  // Root API endpoint
  app.get(`${API_PREFIX}`, (req, res) => {
    res.json({
      success: true,
      message: 'Mathematico API - Production Hardened',
      version: '2.0.0',
      database: 'MongoDB',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: `${API_PREFIX}/auth`,
        admin: `${API_PREFIX}/admin`,
        mobile: `${API_PREFIX}/mobile`,
        student: `${API_PREFIX}/student`,
        users: `${API_PREFIX}/users`,
        health: '/health',
        redisHealth: '/api/v1/health/redis'
      }
    });
  });

  // Swagger documentation (optional)
  try {
    const { swaggerUi, specs, swaggerOptions } = require('./config/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  } catch (err) {
    // no-op
  }
}

function registerErrorHandling() {
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler LAST
  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);

  // Final catch-all (defensive)
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.message ? err.message : err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(500).json({ error: err && err.message ? err.message : String(err), stack: err && err.stack });
  });
}

// 5) THEN perform async infrastructure initialization
async function startServer() {
  if (bootstrapped) return;

  // All fatal errors must happen inside startServer()
  validateEnvironmentFormat();

  // Strict env validation (no partial startup). Keep root route independent.
  const missing = [];
  ['MONGO_URI'].forEach((key) => {
    if (!process.env[key]) missing.push(key);
  });
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // STRICT: MongoDB connection is REQUIRED - fail fast if connection fails
  // Do NOT allow server to run in disconnected state
  try {
    await connectMongo();
    
    // Validate connection state after connection attempt
    const readyState = mongoose.connection.readyState;
    if (readyState !== 1) {
      const error = new Error(`MongoDB connection failed: readyState is ${readyState}, expected 1 (connected)`);
      console.error('MONGO_CONNECTION_ERROR', {
        message: error.message,
        name: error.name,
        code: 'BOOTSTRAP_CONNECTION_FAILED',
        readyState,
        stack: error.stack
      });
      throw error;
    }
    
    console.log('MONGO_BOOTSTRAP_SUCCESS', {
      message: 'MongoDB connection established during bootstrap',
      readyState: 1,
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });
  } catch (err) {
    // Log structured error
    console.error('MONGO_CONNECTION_ERROR', {
      message: err?.message || 'Unknown error',
      name: err?.name || 'MongoError',
      code: err?.code || 'BOOTSTRAP_FAILED',
      stack: err?.stack
    });
    
    // FAIL FAST: Do not allow bootstrap to complete if DB connection fails
    bootstrapError = err;
    throw err; // This will prevent bootstrapped from being set to true
  }

  // Only after successful Mongo connection, mark bootstrap as completed
  // Routes are already registered outside, so we only track bootstrap status
  bootstrapped = true;
}

// Kick off initialization on cold start (non-blocking for `/`)
bootstrapPromise = startServer().catch((err) => {
  bootstrapError = err;
  console.error('❌ Startup error:', err && err.message ? err.message : err);
});

// Export for Vercel
module.exports = app;

  // Local development server only
  if (require.main === module) {
    const isServerless = process.env.VERCEL === '1' || process.env.SERVERLESS === '1';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isServerless || (isProduction && !process.env.ALLOW_LOCAL_SERVER)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('☁️ Running in serverless/production mode');
      }
    } else {
    (async () => {
      try {
        await bootstrapPromise;

        const findAvailablePort = async () => {
          const defaultPort = process.env.PORT || 5002;
          const alternativePorts = [5003, 5004, 5005, 3001, 3002, 8000, 8001, 5001];

          if (await isPortAvailable(defaultPort)) return defaultPort;

          for (const port of alternativePorts) {
            if (await isPortAvailable(port)) return port;
          }

          throw new Error('No available ports found. Please stop other services or specify a different port.');
        };

        const PORT = await findAvailablePort();
        const server = app.listen(PORT, '0.0.0.0', () => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🚀 Mathematico backend listening on ${PORT}`);
          }
        });
        app.server = server;
      } catch (error) {
        console.error('❌ Failed to start local server:', error);
        process.exit(1);
      }
    })();
  }
}
