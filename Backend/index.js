// Mathematico Backend - Production Serverless Architecture
// Environment variables are loaded from Vercel dashboard - no local .env files needed
'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');

const { connectDB } = require('./config/database');
const configureTrustProxy = require('./config/trustProxy');
const { validateJwtConfig } = require('./utils/jwt');
const { validateFeatureFlags } = require('./utils/featureFlags');
const { validateCorsConfig, getCorsOptions } = require('./config/cors');

// Production serverless app
const app = express();

// Configure trust proxy for production
configureTrustProxy(app);

// Root endpoint - always available
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mathematico-backend",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Favicon handlers - prevent 404s
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("/favicon.png", (req, res) => res.status(204).end());
app.get("/favicon", (req, res) => res.status(204).end());

// Security middleware registration
registerSecurityMiddleware();

// Rate limiting for auth endpoints
const loginRateLimiter = require('./middleware/loginRateLimiter');

// JWT validation
try {
  validateJwtConfig();
} catch (jwtErr) {
  console.warn('⚠️ JWT configuration invalid:', jwtErr?.message || jwtErr);
}

// Route and error handling registration
registerRoutes();
registerErrorHandling();

// Bootstrap state management
let bootstrapped = false;
let bootstrapPromise = null;
let bootstrapError = null;
let lastSuccessfulConnection = null;

function validateEnvironmentFormat() {
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('[ENV] Environment validation:', {
    nodeEnv: process.env.NODE_ENV,
    isVercel,
    isProduction,
    vercelEnv: process.env.VERCEL_ENV
  });

  // Core required variables
  const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Required environment variables missing: ${missingVars.join(', ')}. Please configure these in your Vercel dashboard.`);
  }

  // Production-specific validations
  if (isProduction) {
    // Frontend URL is required to generate password reset links reliably
    const frontendUrl = (process.env.FRONTEND_URL || '').trim();
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL must be set in production to generate password reset links.');
    }
    if (!frontendUrl.startsWith('https://')) {
      throw new Error(`FRONTEND_URL must start with https:// in production. Received: ${frontendUrl}`);
    }

    if (process.env.REDIS_URL && !process.env.REDIS_URL.startsWith('rediss://')) {
      console.warn('[ENV] WARNING: REDIS_URL should use rediss:// (TLS) in production for security');
    }
    
    if (process.env.ENABLE_RAZORPAY === 'true') {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret || webhookSecret.length < 32) {
        throw new Error('RAZORPAY_WEBHOOK_SECRET must be set and at least 32 characters when ENABLE_RAZORPAY=true');
      }
      console.log('[ENV] Razorpay webhook secret validated successfully');
    }

    // Admin credentials validation
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in production Vercel environment');
    }
    
    if (!adminEmail.includes('@') || adminEmail.length < 5) {
      throw new Error('ADMIN_EMAIL must be a valid email address');
    }
    
    if (adminPassword.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
    }
    
    console.log('[ENV] Admin credentials validated successfully');
  }

  console.log('[ENV] Environment validation completed successfully');
  console.log('[ENV] Configured services:', {
    mongodb: !!process.env.MONGO_URI,
    jwt: !!process.env.JWT_SECRET,
    redis: !!process.env.REDIS_URL,
    razorpay: process.env.ENABLE_RAZORPAY === 'true',
    cloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    admin: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)
  });
}

function registerSecurityMiddleware() {
  app.disable('x-powered-by');
  
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts: process.env.NODE_ENV === 'production' ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permissionsPolicy: {
        features: {
          camera: ['none'],
          microphone: ['none'],
          geolocation: ['none'],
          payment: ['none']
        }
      }
    })
  );

  // Webhook route with raw body handling
  const { handleRazorpayWebhook } = require('./controllers/webhookController');
  const { createWebhookRateLimiter } = require('./middleware/webhookRateLimiter');
  
  const webhookRawBodyHandler = (req, res, next) => {
    if (req.path === '/api/v1/webhook/razorpay' && req.method === 'POST') {
      let rawData = '';
      
      req.on('data', (chunk) => {
        rawData += chunk;
      });
      
      req.on('end', () => {
        req.rawBody = Buffer.from(rawData, 'utf8');
        req.body = req.rawBody;
        next();
      });
      
      req.on('error', (err) => {
        console.error('Error capturing raw body:', err);
        next(err);
      });
    } else {
      next();
    }
  };
  
  app.use(webhookRawBodyHandler);
  
  app.post('/api/v1/webhook/razorpay', 
    express.raw({ type: 'application/json' }),
    createWebhookRateLimiter(),
    handleRazorpayWebhook
  );
  
  app.get('/api/v1/webhook/razorpay/health', (req, res) => {
    res.json({
      success: true,
      message: 'Razorpay webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  });

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // CORS
  validateCorsConfig();
  const corsOptions = getCorsOptions();
  app.use(cors(corsOptions));

  // Request logging
  const { isFeatureEnabled } = require('./utils/featureFlags');
  if (isFeatureEnabled('requestLogging')) {
    const requestLogger = require('./middleware/requestLogger');
    app.use(requestLogger);
  }
}

function registerRoutes() {
  const API_PREFIX = '/api/v1';

  // Health endpoint
  app.get('/health', async (req, res) => {
    try {
      const { performHealthCheck } = require('./config/database');
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
          error: bootstrapError?.message || null,
          lastSuccessfulConnection: lastSuccessfulConnection || null
        }
      });
    } catch (error) {
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
          error: bootstrapError?.message || null,
          lastSuccessfulConnection: lastSuccessfulConnection || null
        },
        error: error.message
      });
    }
  });

  // Redis health check
  app.get('/api/v1/health/redis', async (req, res) => {
    try {
      const { redisHealthCheck: enhancedHealthCheck } = require('./middleware/enhancedRateLimiter');
      const enhancedStatus = await enhancedHealthCheck();
      
      res.status(200).json({
        service: 'redis',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        enhanced: enhancedStatus,
        overall: {
          healthy: enhancedStatus.healthy,
          status: enhancedStatus.healthy ? 'healthy' : 'degraded'
        }
      });
    } catch (error) {
      res.status(200).json({
        service: 'redis',
        status: 'degraded',
        message: error?.message || 'Redis health check failed',
        healthy: false,
        timestamp: new Date().toISOString(),
        overall: {
          healthy: false,
          status: 'degraded'
        }
      });
    }
  });

  // Bootstrap diagnostics
  app.get('/api/v1/bootstrap/diagnostics', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isServerless: process.env.VERCEL === '1' || process.env.SERVERLESS === '1',
      bootstrap: {
        completed: bootstrapped,
        error: bootstrapError?.message || null,
        lastSuccessfulConnection: lastSuccessfulConnection || null
      },
      environmentVariables: isProduction ? {
        MONGO_URI: { configured: Boolean(process.env.MONGO_URI), length: process.env.MONGO_URI?.length || 0 },
        JWT_SECRET: { configured: Boolean(process.env.JWT_SECRET), length: process.env.JWT_SECRET?.length || 0 },
        ADMIN_EMAIL: { configured: Boolean(process.env.ADMIN_EMAIL) },
        ADMIN_PASSWORD: { configured: Boolean(process.env.ADMIN_PASSWORD), length: process.env.ADMIN_PASSWORD?.length || 0 }
      } : {
        MONGO_URI: { 
          configured: Boolean(process.env.MONGO_URI), 
          length: process.env.MONGO_URI?.length || 0,
          startsWith: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : null
        },
        JWT_SECRET: { configured: Boolean(process.env.JWT_SECRET), length: process.env.JWT_SECRET?.length || 0 },
        ADMIN_EMAIL: { configured: Boolean(process.env.ADMIN_EMAIL), value: process.env.ADMIN_EMAIL || null },
        ADMIN_PASSWORD: { configured: Boolean(process.env.ADMIN_PASSWORD), length: process.env.ADMIN_PASSWORD?.length || 0 }
      },
      database: {
        readyState: mongoose.connection.readyState,
        states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
      }
    };

    res.status(200).json(diagnostics);
  });

  // Bootstrap endpoint to create admin user
  app.post('/api/v1/bootstrap', async (req, res) => {
    try {
      const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      const ADMIN_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

      if (!ADMIN_CONFIGURED) {
        return res.status(503).json({
          success: false,
          message: 'Admin credentials not configured in environment variables',
          timestamp: new Date().toISOString()
        });
      }

      // Connect to database
      await connectDB();
      
      // Import User model
      const UserModel = require('./models/User');
      
      // Check if admin already exists
      let adminUser = await UserModel.findOne({ email: ADMIN_EMAIL });
      
      if (!adminUser) {
        console.log('[BOOTSTRAP] Creating admin user...');
        adminUser = new UserModel({
          name: 'Admin User',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: 'admin',
          isAdmin: true,
          isActive: true,
          isEmailVerified: true
        });
        await adminUser.save();
        console.log('[BOOTSTRAP] Admin user created successfully');
      } else {
        adminUser.role = 'admin';
        adminUser.isAdmin = true;
        adminUser.isActive = true;
        adminUser.isEmailVerified = true;
        await adminUser.save();
        console.log('[BOOTSTRAP] Admin user verified and updated');
      }
      
      // Update bootstrap state
      bootstrapError = null;
      bootstrapped = true;
      lastSuccessfulConnection = new Date().toISOString();
      
      return res.status(200).json({
        success: true,
        message: 'Bootstrap completed successfully',
        data: {
          adminEmail: ADMIN_EMAIL,
          adminCreated: !adminUser.isNew,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('[BOOTSTRAP] Error:', error);
      bootstrapError = error;
      bootstrapped = false;
      
      return res.status(500).json({
        success: false,
        message: 'Bootstrap failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API routes with rate limiting
  const enhancedRateLimiter = require('./middleware/enhancedRateLimiter');
  
  app.use(`${API_PREFIX}`, enhancedRateLimiter);
  app.use(`${API_PREFIX}/auth/login`, loginRateLimiter);
  app.use(`${API_PREFIX}/auth/register`, loginRateLimiter);
  app.use(`${API_PREFIX}/payments`, enhancedRateLimiter);
  app.use(`${API_PREFIX}/admin`, enhancedRateLimiter);
  
  // Route modules
  app.use(`${API_PREFIX}/auth`, require('./routes/auth'));
  app.use(`${API_PREFIX}/admin`, require('./routes/admin'));
  app.use(`${API_PREFIX}/mobile`, require('./routes/mobile'));
  app.use(`${API_PREFIX}/student`, require('./routes/student'));
  app.use(`${API_PREFIX}/users`, require('./routes/users'));
  app.use(`${API_PREFIX}/payments`, require('./routes/payment'));
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

  // Swagger documentation - production-safe conditional loading
  if (process.env.ENABLE_SWAGGER === "true") {
    try {
      const { swaggerUi, specs, swaggerOptions, isAvailable } = require('./config/swagger');
      
      if (isAvailable && swaggerUi && specs) {
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
        console.log('[SWAGGER] Swagger documentation enabled at /api-docs');
      } else {
        console.log('[SWAGGER] Swagger documentation disabled - packages not available or specs not generated');
      }
    } catch (err) {
      console.warn('[SWAGGER] Swagger documentation failed to load:', err?.message || 'Unknown error');
    }
  } else {
    console.log('[SWAGGER] Swagger documentation disabled (ENABLE_SWAGGER !== "true")');
  }
}

function registerErrorHandling() {
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err?.message || err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(500).json({ 
      error: err?.message || String(err), 
      stack: err?.stack 
    });
  });
}

// Environment validation and initialization
validateEnvironmentFormat();
validateFeatureFlags();

async function bootstrapAdminUser() {
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

  if (!ADMIN_CONFIGURED) {
    console.error('FATAL: Admin credentials not configured in environment variables');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Admin credentials must be configured in production');
    }
    return;
  }

  try {
    const connection = await connectDB();
    const UserModel = require('./models/User');
    
    let adminUser = await UserModel.findOne({ email: ADMIN_EMAIL });
    
    if (!adminUser) {
      console.log('[BOOTSTRAP] Creating admin user...');
      adminUser = new UserModel({
        name: 'Admin User',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isAdmin: true,
        isActive: true,
        isEmailVerified: true
      });
      await adminUser.save();
      console.log('[BOOTSTRAP] Admin user created successfully');
    } else {
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
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_BOOTSTRAP_SKIPPED', {
        reason: 'MONGO_URI not configured',
        environment: process.env.NODE_ENV,
        isVercel: process.env.VERCEL === '1'
      });
      return;
    }

    const connection = await connectDB();
    await connection.db.admin().ping();
    await bootstrapAdminUser();
    
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
        readyState: currentConnection.readyState,
        environment: process.env.NODE_ENV,
        isServerless: process.env.VERCEL === '1' || process.env.SERVERLESS === '1',
        mongoUriConfigured: Boolean(process.env.MONGO_URI),
        mongoUriLength: process.env.MONGO_URI?.length || 0
      });
      
      if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
        console.warn('MONGO_BOOTSTRAP_FAILED', {
          message: 'Database bootstrap failed, but application will continue',
          action: 'Health endpoint will reflect degraded status'
        });
        return;
      } else {
        throw new Error(`Database connection failed during bootstrap: ${err?.message || 'Unknown error'}`);
      }
    } else {
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

// Serverless initialization
if (process.env.VERCEL === '1' || process.env.SERVERLESS === '1') {
  bootstrapPromise = startServer().catch((err) => {
    const currentConnection = mongoose.connection;
    if (currentConnection.readyState !== 1) {
      bootstrapError = err;
    }
    console.error('❌ Serverless bootstrap error:', err?.message || err);
  });
}

// Export for Vercel
module.exports = app;
