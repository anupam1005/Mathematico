// Mathematico Backend - Production Serverless Architecture
// Environment variables are loaded from Vercel dashboard - no local .env files needed
'use strict';

// Top-level imports are intentionally minimal for serverless cold-start performance.
// Heavy modules are required lazily inside route/middleware scopes.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { connectDB, warmMongoConnection } = require('./config/database');

// Production serverless app
const app = express();

// Configure trust proxy for production (lazy require to keep top-level light)
require('./config/trustProxy')(app);

// Root endpoint - always available, even if environment is misconfigured
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

// Lightweight environment validation state (cache only success)
let envValidationCompleted = false;
let envValidationOk = false;

// Lightweight environment validation for all business routes
// - Caches ONLY successful validation
// - On failure, responds with error but retries on the next request
function environmentValidationMiddleware(req, res, next) {
  if (envValidationCompleted) {
    // Only cache the "all good" case; failures always re-validate
    if (envValidationOk) {
      return next();
    }
  }

  try {
    // Fast, lightweight validation only (serverless-safe)
    const isProduction = process.env.NODE_ENV === 'production';

    const mongoUri = (process.env.MONGO_URI || '').trim();
    const jwtSecret = (process.env.JWT_SECRET || '').trim();

    if (!mongoUri) {
      throw new Error('MONGO_URI must be configured');
    }
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be configured');
    }

    if (isProduction) {
      const frontendUrl = (process.env.FRONTEND_URL || '').trim();

      if (!frontendUrl) {
        throw new Error('FRONTEND_URL must be set in production');
      }
      if (!frontendUrl.startsWith('https://')) {
        throw new Error('FRONTEND_URL must start with https:// in production');
      }
    }

    // Cache ONLY the successful outcome
    envValidationCompleted = true;
    envValidationOk = true;

    return next();
  } catch (err) {
    // Do NOT cache failure – allow retry on subsequent requests
    envValidationCompleted = false;
    envValidationOk = false;

    return res.status(500).json({
      success: false,
      error: 'ENVIRONMENT_VALIDATION_ERROR',
      message: err?.message || 'Environment validation failed.',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
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

  // Lazily require heavy webhook controller and rate limiter on first use
  // Use express.raw with strict size limit to avoid memory bloat.
  let webhookRateLimiterInstance;
  let webhookHandlerInstance;

  app.post(
    '/api/v1/webhook/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    (req, res, next) => {
      // Preserve backwards compatibility with handlers expecting req.rawBody
      if (!req.rawBody) {
        req.rawBody = req.body;
      }
      next();
    },
    (req, res, next) => {
      if (!webhookRateLimiterInstance) {
        const { createWebhookRateLimiter } = require('./middleware/webhookRateLimiter');
        webhookRateLimiterInstance = createWebhookRateLimiter();
      }
      return webhookRateLimiterInstance(req, res, next);
    },
    (req, res, next) => {
      if (!webhookHandlerInstance) {
        const { handleRazorpayWebhook } = require('./controllers/webhookController');
        webhookHandlerInstance = handleRazorpayWebhook;
      }
      return webhookHandlerInstance(req, res, next);
    }
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

  // Lazy-load cookie parser to keep top-level imports minimal
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // CORS
  const { validateCorsConfig, getCorsOptions } = require('./config/cors');
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
    let envValidation = null;
    let conflicts = [];
    let checklist = [];
    let heavyValidationError = null;

    // Run full, heavy-weight environment validation only on this diagnostics endpoint
    try {
      const {
        validateEnvironment,
        checkEnvironmentConflicts,
        getProductionHardeningChecklist
      } = require('./utils/environmentValidator');

      envValidation = validateEnvironment();
      conflicts = checkEnvironmentConflicts();
      checklist = getProductionHardeningChecklist();
    } catch (error) {
      heavyValidationError = {
        message: error?.message || String(error),
        stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack
      };
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isServerless: process.env.VERCEL === '1' || process.env.SERVERLESS === '1',
      bootstrap: {
        // Stateless by design in serverless; no long-lived bootstrap state
        completed: null,
        error: null,
        lastSuccessfulConnection: null
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
      },
      environmentValidation: {
        heavyValidationRan: Boolean(envValidation || heavyValidationError),
        errors: envValidation?.errors || [],
        warnings: envValidation?.warnings || [],
        conflicts,
        checklist,
        error: heavyValidationError
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
      return res.status(500).json({
        success: false,
        message: 'Bootstrap failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API routes with rate limiting
  // Lazily require enhanced rate limiter and login rate limiter to reduce cold start size
  let enhancedRateLimiterInstance;
  let loginRateLimiterInstance;

  app.use(`${API_PREFIX}`, (req, res, next) => {
    if (!enhancedRateLimiterInstance) {
      enhancedRateLimiterInstance = require('./middleware/enhancedRateLimiter');
    }
    return enhancedRateLimiterInstance(req, res, next);
  });

  app.use(`${API_PREFIX}/auth/login`, (req, res, next) => {
    if (!loginRateLimiterInstance) {
      loginRateLimiterInstance = require('./middleware/loginRateLimiter');
    }
    return loginRateLimiterInstance(req, res, next);
  });

  app.use(`${API_PREFIX}/auth/register`, (req, res, next) => {
    if (!loginRateLimiterInstance) {
      loginRateLimiterInstance = require('./middleware/loginRateLimiter');
    }
    return loginRateLimiterInstance(req, res, next);
  });

  app.use(`${API_PREFIX}/payments`, (req, res, next) => {
    if (!enhancedRateLimiterInstance) {
      enhancedRateLimiterInstance = require('./middleware/enhancedRateLimiter');
    }
    return enhancedRateLimiterInstance(req, res, next);
  });

  app.use(`${API_PREFIX}/admin`, (req, res, next) => {
    if (!enhancedRateLimiterInstance) {
      enhancedRateLimiterInstance = require('./middleware/enhancedRateLimiter');
    }
    return enhancedRateLimiterInstance(req, res, next);
  });
  
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
    // Lazily load Swagger configuration and handlers on first /api-docs request
    let swaggerInitialized = false;
    let swaggerHandlers = null;

    const swaggerLazyHandler = (req, res, next) => {
      if (!swaggerInitialized) {
        try {
          const { swaggerUi, specs, swaggerOptions, isAvailable } = require('./config/swagger');

          if (isAvailable && swaggerUi && specs) {
            swaggerHandlers = [
              swaggerUi.serve,
              swaggerUi.setup(specs, swaggerOptions)
            ];
            console.log('[SWAGGER] Swagger documentation enabled at /api-docs');
          } else {
            console.log('[SWAGGER] Swagger documentation disabled - packages not available or specs not generated');
          }
        } catch (err) {
          console.warn('[SWAGGER] Swagger documentation failed to load:', err?.message || 'Unknown error');
        } finally {
          swaggerInitialized = true;
        }
      }

      if (swaggerHandlers) {
        return swaggerHandlers[0](req, res, () => swaggerHandlers[1](req, res, next));
      }

      // If Swagger is unavailable, fall through to 404 handler as before
      return next();
    };

    app.use('/api-docs', swaggerLazyHandler);
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

// Global middleware ordering:
// 1. Lightweight health and root endpoints
// 2. Environment validation
// 3. Security middleware (helmet, CORS, parsers, webhook security)
// 4. Application routes and error handling

// Health endpoint MUST be registered before environment validation
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
      }
    });
  } catch (error) {
    return res.status(200).json({
      status: 'degraded',
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
      error: error.message
    });
  }
});

// Register environment validation before security and routes (but after health/root)
app.use(environmentValidationMiddleware);

// Warm MongoDB connection in the background so first auth/login requests
// do not incur the full cold connection penalty on serverless cold starts.
// This is non-blocking and safe for both Vercel and local development.
if (process.env.ENABLE_MONGO_WARMING !== 'false') {
  try {
    warmMongoConnection();
  } catch (e) {
    console.warn('MONGO_WARM_CONNECTION_INIT_FAILED', {
      message: e?.message || String(e)
    });
  }
}

// Security middleware registration (runs after env validation)
// Rate limiter modules are required lazily inside route registration
registerSecurityMiddleware();

// JWT validation (configuration-only, does not affect request flow)
try {
  validateJwtConfig();
} catch (jwtErr) {
  console.warn('⚠️ JWT configuration invalid:', jwtErr?.message || jwtErr);
}

// Route and error handling registration
registerRoutes();
registerErrorHandling();

// Export for Vercel
module.exports = app;
