// Mathematico Backend - Startup Architecture Corrected (Vercel Serverless Compatible)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
const net = require('net');

const { connectDB } = require('./config/database');
const configureTrustProxy = require('./config/trustProxy');
const { validateJwtConfig } = require('./utils/jwt');
const { validateFeatureFlags } = require('./utils/featureFlags');
const { validateCorsConfig, getCorsOptions } = require('./config/cors');
const { runCompleteValidation } = require('./utils/environmentValidator');

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
let lastSuccessfulConnection = null;

function validateEnvironmentFormat() {
  // Strict formatting checks that are safe to run synchronously and won't break `/`.
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl.startsWith('rediss://')) {
      throw new Error('REDIS_URL must use rediss:// (TLS) in production');
    }
  }

  // Validate admin credentials in production
  if (process.env.NODE_ENV === 'production') {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.error('FATAL: Missing admin credentials in production');
      console.error('Required environment variables:');
      console.error('- ADMIN_EMAIL:', adminEmail ? 'SET' : 'MISSING');
      console.error('- ADMIN_PASSWORD:', adminPassword ? 'SET' : 'MISSING');
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in production');
    }
    
    if (!adminEmail.includes('@') || adminEmail.length < 5) {
      console.error('FATAL: Invalid ADMIN_EMAIL format:', adminEmail);
      throw new Error('ADMIN_EMAIL must be a valid email address');
    }
    
    if (adminPassword.length < 8) {
      console.error('FATAL: ADMIN_PASSWORD too short (min 8 characters)');
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
    }
    
    console.log('[ENV] Admin credentials validated successfully');
    console.log('[ENV] ADMIN_EMAIL:', adminEmail.toLowerCase().trim());
    console.log('[ENV] ADMIN_PASSWORD length:', adminPassword.length, 'characters');
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

  // CORS - Use centralized configuration
  validateCorsConfig();
  const corsOptions = getCorsOptions();
  app.use(cors(corsOptions));

  // Request logging (production only)
  if (process.env.NODE_ENV === 'production') {
    const requestLogger = require('./middleware/requestLogger');
    app.use(requestLogger);
  }
}

function registerRoutes() {
  const API_PREFIX = '/api/v1';

  // Health endpoint - performs actual connection and ping test
  app.get('/health', async (req, res) => {
    try {
      const { performHealthCheck } = require('./config/database');
      
      // Perform actual health check with connection and ping
      const healthData = await performHealthCheck();
      
      return res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        database: { 
          status: 'connected',
          readyState: healthData.readyState,
          type: 'mongodb',
          connected: healthData.connected,
          host: healthData.host,
          name: healthData.name,
          ping: healthData.ping
        },
        bootstrap: {
          completed: bootstrapped,
          error: bootstrapError ? bootstrapError.message : null,
          lastSuccessfulConnection: lastSuccessfulConnection || null
        }
      });
    } catch (error) {
      // Health check failed - return 503 with detailed error
      return res.status(503).json({
        status: 'error',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          readyState: mongoose.connection.readyState || 0,
          type: 'mongodb',
          connected: false,
          host: null,
          name: null,
          error: error.message
        },
        bootstrap: {
          completed: bootstrapped,
          error: bootstrapError ? bootstrapError.message : null,
          lastSuccessfulConnection: lastSuccessfulConnection || null
        },
        error: error.message
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
  app.use(`${API_PREFIX}/webhook`, require('./routes/webhook'));
  app.use(`${API_PREFIX}/secure-pdf`, require('./routes/securePdf'));

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
        payments: `${API_PREFIX}/payments`,
        webhook: `${API_PREFIX}/webhook`,
        securePdf: `${API_PREFIX}/secure-pdf`,
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
// Validate environment variables first
validateEnvironmentFormat();
runCompleteValidation();
validateFeatureFlags();

async function bootstrapAdminUser() {
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

  if (!ADMIN_CONFIGURED) {
    console.error('FATAL: Admin credentials not configured in environment variables');
    console.error('Required: ADMIN_EMAIL and ADMIN_PASSWORD');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Admin credentials must be configured in production');
    }
    return;
  }

  try {
    const connection = await connectDB();
    const UserModel = require('./models/User');
    
    // Check if admin user exists
    let adminUser = await UserModel.findOne({ email: ADMIN_EMAIL });
    
    if (!adminUser) {
      console.log('[BOOTSTRAP] Creating admin user...');
      adminUser = new UserModel({
        name: 'Admin User',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // Will be hashed by pre-save middleware
        role: 'admin',
        isAdmin: true,
        isActive: true,
        isEmailVerified: true
      });
      await adminUser.save();
      console.log('[BOOTSTRAP] Admin user created successfully');
    } else {
      // Ensure existing admin user has correct properties
      adminUser.role = 'admin';
      adminUser.isAdmin = true;
      adminUser.isActive = true;
      adminUser.isEmailVerified = true;
      await adminUser.save();
      console.log('[BOOTSTRAP] Admin user verified and updated');
    }
    
    console.log('[BOOTSTRAP] Admin bootstrap completed for:', ADMIN_EMAIL);
  } catch (error) {
    console.error('[BOOTSTRAP] Failed to bootstrap admin user:', error?.message || error);
    throw error;
  }
}

async function startServer() {
  // Always check current DB state first - don't rely on stale bootstrap state
  try {
    const connection = await connectDB();
    
    // Verify connection is actually working with ping
    await connection.db.admin().ping();
    
    // Bootstrap admin user after successful DB connection
    await bootstrapAdminUser();
    
    // Clear any stale bootstrap errors on successful connection
    if (bootstrapError || !bootstrapped) {
      bootstrapError = null;
      bootstrapped = true;
      lastSuccessfulConnection = new Date().toISOString();
      
      console.log('MONGO_BOOTSTRAP_SUCCESS', {
        message: 'MongoDB connection established during bootstrap',
        readyState: connection.readyState,
        host: connection.host,
        database: connection.name,
        timestamp: lastSuccessfulConnection
      });
    }
    
    return;
  } catch (err) {
    // Only set bootstrap error if we don't have a working connection
    const currentConnection = mongoose.connection;
    const isActuallyConnected = currentConnection.readyState === 1;
    
    if (!isActuallyConnected) {
      bootstrapError = err;
      bootstrapped = false;
      
      console.error('MONGO_CONNECTION_ERROR', {
        message: err?.message || 'Unknown error',
        name: err?.name || 'MongoError',
        code: err?.code || 'BOOTSTRAP_FAILED',
        stack: err?.stack,
        readyState: currentConnection.readyState
      });
      
      throw new Error(`Database connection failed during bootstrap: ${err?.message || 'Unknown error'}`);
    } else {
      // Connection is actually working despite bootstrap error - clear the stale error
      bootstrapError = null;
      bootstrapped = true;
      lastSuccessfulConnection = new Date().toISOString();
      
      console.log('MONGO_BOOTSTRAP_SELF_HEAL', {
        message: 'Bootstrap error cleared - connection is working',
        readyState: currentConnection.readyState,
        host: currentConnection.host,
        database: currentConnection.name,
        timestamp: lastSuccessfulConnection
      });
    }
  }
}

// Kick off initialization on cold start (non-blocking for `/`)
bootstrapPromise = startServer().catch((err) => {
  // Only set bootstrap error if database is actually disconnected
  const currentConnection = mongoose.connection;
  if (currentConnection.readyState !== 1) {
    bootstrapError = err;
  }
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
          console.log(`🚀 Mathematico backend listening on ${PORT}`);
        });
        app.server = server;
      } catch (error) {
        console.error('❌ Failed to start local server:', error);
        process.exit(1);
      }
    })();
  }
}
