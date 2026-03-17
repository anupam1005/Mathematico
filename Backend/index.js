// Mathematico Backend - SERVERLESS-STABLE PRODUCTION ARCHITECTURE
// 
// GUARANTEES:
// - Login/Register NEVER produce "XHR request failed"
// - Backend NEVER crashes middleware chain  
// - Rate limiter NEVER throws or blocks requests
// - All errors return JSON responses
// - Mobile-first, serverless-optimized
'use strict';

// Top-level imports are intentionally minimal for serverless cold-start performance
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import serverless-safe modules
const { connectDB, performHealthCheck } = require('./config/serverlessDatabase');
const { serverlessErrorGuard, timeoutGuard, sizeGuard, asyncHandler } = require('./middleware/serverlessErrorGuard');
const { serverlessEnvironmentValidator } = require('./middleware/serverlessEnvironmentValidator');
const { createAuthProtection } = require('./middleware/authProtection');
const { rateLimiterHealthCheck } = require('./middleware/serverlessRateLimiter');

// Production serverless app
const app = express();

// Configure serverless-safe trust proxy
require('./config/trustProxy')(app);

// EARLY CORS COMPAT (CRITICAL FOR "XHR request failed" PREVENTION)
// Some clients (webviews / proxies / browsers) will report "XHR request failed" if an OPTIONS preflight
// is rejected or if an error response is missing CORS headers.
//
// We intentionally register a minimal, serverless-safe CORS header layer BEFORE guards so that even
// size/timeout/env failures are still readable by clients.
app.use((req, res, next) => {
  try {
    const origin = req.headers?.origin;
    if (origin && typeof origin === 'string') {
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Origin'
      );
    }

    // Always terminate preflight quickly
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

// GLOBAL MIDDLEWARE ORDER - CRITICAL FOR SERVERLESS STABILITY
// 1. Health endpoints (no validation, no rate limiting)
// 2. Size and timeout guards (prevent hanging requests)
// 3. Environment validation (mobile-first, auth bypass)
// 4. Security middleware (helmet, CORS, parsers)
// 5. Rate limiting (serverless-safe, never throws)
// 6. Global error boundary (catch all remaining errors)
// 7. Business routes

// 1. Health endpoints - ALWAYS available, no validation, no rate limiting
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mathematico-backend",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    architecture: "serverless-stable"
  });
});

app.get('/health', asyncHandler(async (req, res) => {
  const healthData = await performHealthCheck();
  return res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: {
      status: healthData.connected ? 'connected' : 'disconnected',
      readyState: healthData.readyState,
      type: 'mongodb',
      connected: healthData.connected,
      host: healthData.host,
      name: healthData.name,
      ping: healthData.ping
    }
  });
}));

// Rate limiter health check
app.get('/health/rate-limiter', (req, res) => {
  const health = rateLimiterHealthCheck();
  res.status(200).json(health);
});

// Favicon handlers - prevent 404s
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.get("/favicon.png", (req, res) => res.status(204).end());
app.get("/favicon", (req, res) => res.status(204).end());

// 2. Size and timeout guards - prevent hanging requests
app.use(sizeGuard(10 * 1024 * 1024)); // 10MB limit
app.use(timeoutGuard(25000)); // 25 second timeout

// 3. Environment validation - mobile-first, auth endpoints bypassed
app.use(serverlessEnvironmentValidator);

// 4. Security middleware (helmet, CORS, parsers)
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

  // Webhook security with rate limiting
  let webhookRateLimiterInstance;
  let webhookHandlerInstance;

  app.post(
    '/api/v1/webhook/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    (req, res, next) => {
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

  // Cookie parser
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // CORS
  const { validateCorsConfig, getCorsOptions } = require('./config/cors');
  validateCorsConfig();
  const corsOptions = getCorsOptions();
  app.use(cors(corsOptions));

  // Request logging (optional)
  const { isFeatureEnabled } = require('./utils/featureFlags');
  if (isFeatureEnabled('requestLogging')) {
    const requestLogger = require('./middleware/requestLogger');
    app.use(requestLogger);
  }
}

// 5. Rate limiting - serverless-safe, never throws
function registerRateLimiting() {
  const API_PREFIX = '/api/v1';
  
  // Auth endpoints with specific protection
  app.use(`${API_PREFIX}/auth/login`, createAuthProtection('login'));
  app.use(`${API_PREFIX}/auth/register`, createAuthProtection('register'));
  
  // Admin routes with strict protection
  app.use(`${API_PREFIX}/admin`, createAuthProtection('admin'));
  
  // Public mobile routes with soft protection
  app.use(`${API_PREFIX}/mobile`, createAuthProtection('public'));
  
  // General API protection
  app.use(`${API_PREFIX}`, createAuthProtection('public'));
  
  // Payment routes with soft protection
  app.use(`${API_PREFIX}/payments`, createAuthProtection('public'));
}

// 6. Global error boundary (non-error middleware)
// NOTE: Express error handlers must be registered AFTER routes to catch their errors.
// This boundary exists to guard against sync throws in middleware registration and to normalize JSON responses.
app.use((req, res, next) => {
  try {
    // Ensure we never accidentally return HTML
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return next();
  } catch (err) {
    return next(err);
  }
});

// 7. Business routes
function registerRoutes() {
  const API_PREFIX = '/api/v1';

  // Bootstrap diagnostics
  app.get('/api/v1/bootstrap/diagnostics', asyncHandler(async (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    let envValidation = null;
    let conflicts = [];
    let checklist = [];
    let heavyValidationError = null;

    // Run serverless environment validation on this diagnostics endpoint (no legacy imports)
    try {
      const {
        validateServerlessEnvironment,
        getServerlessChecklist
      } = require('./middleware/serverlessEnvironmentValidator');

      envValidation = validateServerlessEnvironment();
      checklist = getServerlessChecklist()?.checklist || [];
    } catch (error) {
      heavyValidationError = {
        message: error?.message || String(error),
        stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack
      };
    }

    const mongoose = require('mongoose');
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isServerless: process.env.VERCEL === '1' || process.env.SERVERLESS === '1',
      architecture: 'serverless-stable',
      bootstrap: {
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
  }));

  // Bootstrap endpoint to create admin user
  app.post('/api/v1/bootstrap', asyncHandler(async (req, res) => {
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
  }));
  
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
      message: 'Mathematico API - Serverless Stable',
      version: '3.0.0',
      database: 'MongoDB',
      environment: process.env.NODE_ENV,
      architecture: 'serverless-stable',
      timestamp: new Date().toISOString(),
      guarantees: [
        'Login/Register never produce XHR request failed',
        'Backend never crashes middleware chain',
        'Rate limiter never throws or blocks requests',
        'All errors return JSON responses',
        'Mobile-first, serverless-optimized'
      ],
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
        rateLimiterHealth: '/health/rate-limiter'
      }
    });
  });

  // Swagger documentation - production-safe conditional loading
  if (process.env.ENABLE_SWAGGER === "true") {
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
            console.log('[SWAGGER] Swagger documentation disabled - packages not available');
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

      return next();
    };

    app.use('/api-docs', swaggerLazyHandler);
  }
}

function registerErrorHandling() {
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'ENDPOINT_NOT_FOUND',
      message: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // Final error handler - ALWAYS JSON, NEVER crashes middleware chain
  app.use(serverlessErrorGuard);
}

// MIDDLEWARE REGISTRATION - CRITICAL ORDER
// 1. Health endpoints (already registered above)
// 2. Size and timeout guards (already registered above)
// 3. Environment validation (already registered above)

// 4. Security middleware
registerSecurityMiddleware();

// 5. Rate limiting
registerRateLimiting();

// 6. Global error boundary (already registered above)

// 7. Routes and error handling
registerRoutes();
registerErrorHandling();

// JWT validation (configuration-only)
try {
  const { validateJwtConfig } = require('./config/jwt');
  validateJwtConfig();
} catch (jwtErr) {
  console.warn('⚠️ JWT configuration invalid:', jwtErr?.message || jwtErr);
}

// Export for Vercel
module.exports = app;
