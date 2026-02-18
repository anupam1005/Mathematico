// Mathematico Backend - Production Hardened
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require('mongoose');
const net = require("net");

// Database connection
const connectDB = require('./config/database');

// Utility function to check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}; 

// Initialize Express app
const app = express();

// PHASE 1: Register root and favicon routes FIRST (before any validation)
app.get("/", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "mathematico-backend",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

// PHASE 2: Load environment variables and validate format (but don't crash yet)
(function validateEnvironmentFormat() {
  try {
    const missing = [];
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'MONGO_URI',
      'REDIS_URL'
    ];

    // Check for required variables
    requiredVars.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });

    // Validate Redis URL format for production
    if (process.env.NODE_ENV === 'production') {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl && !redisUrl.startsWith('rediss://')) {
        console.error('❌ REDIS_URL must use rediss:// (TLS) in production');
        process.exit(1);
      }
    }

    if (missing.length) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }

    console.log('✅ Environment format validation passed');
  } catch (e) {
    console.error('❌ Environment validation failed:', e.message);
    process.exit(1);
  }
})();

// PHASE 3: Initialize Redis connection with strict validation
let redisInitialized = false;
const initializeRedis = async () => {
  if (redisInitialized) return;
  
  try {
    const { checkRedisHealth } = require('./utils/redisClient');
    await checkRedisHealth();
    redisInitialized = true;
    console.log('✅ Redis connected successfully');
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Development mode: continuing without Redis');
    }
    throw err;
  }
};

// PHASE 4: Initialize database connection with strict validation
let dbInitialized = false;
const initializeDatabase = async () => {
  if (dbInitialized) return;
  
  try {
    await connectDB();
    dbInitialized = true;
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Development mode: continuing without database');
    }
    throw err;
  }
};

// PHASE 5: Configure trust proxy (before security middleware)
const configureTrustProxy = require('./config/trustProxy');
configureTrustProxy(app);

// PHASE 6: Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// PHASE 7: Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// PHASE 8: Cookie parser middleware
app.use(cookieParser());

// PHASE 9: CORS configuration
const originEnvValues = [
  process.env.APP_ORIGIN,
  process.env.ADMIN_ORIGIN,
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.WEB_URL,
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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow Expo development URLs
    if (origin.startsWith('exp://') || origin.includes('expo')) {
      return callback(null, true);
    }

    // Allow mobile app origins (Capacitor, Ionic, etc.)
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
      return callback(null, true);
    }

    // Allow Play Store and other mobile app requests (no origin header)
    if (!origin || origin.includes('android') || origin.includes('playstore')) {
      return callback(null, true);
    }

    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

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

// Production monitoring and logging
if (process.env.NODE_ENV === 'production') {
  const requestLogger = require('./middleware/requestLogger');
  app.use(requestLogger);
}

// PHASE 10: Initialize services for API routes
const initializeServices = async () => {
  await initializeDatabase();
  await initializeRedis();
};

// Initialize services before rate limiting (only for API routes)
app.use('/api/*', async (req, res, next) => {
  try {
    if (!dbInitialized || !redisInitialized) {
      await initializeServices();
    }
    next();
  } catch (error) {
    console.error('Service initialization failed:', error.message);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// PHASE 11: Rate limiting with Redis store
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    store: require('./middleware/rateLimitStore')
  });
};

// Global rate limit
app.use(createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  1000, // limit each IP to 1000 requests per windowMs
  'Too many requests from this IP, please try again later.'
));

// PHASE 12: Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await initializeServices();
    
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        type: "mongodb"
      },
      redis: {
        status: "connected"
      }
    });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// PHASE 13: API Routes
const DEFAULT_API_PREFIX = '/api/v1';
const API_PREFIX = DEFAULT_API_PREFIX;

// Mount routes with error handling
const mountRoute = (routePath, routeLabel) => {
  try {
    const routes = require(routePath);
    app.use(`${API_PREFIX}/${routeLabel}`, routes);
    console.log(`✅ ${routeLabel} routes mounted at ${API_PREFIX}/${routeLabel}`);
  } catch (error) {
    console.error(`❌ Failed to mount ${routeLabel} routes:`, error.message);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Critical route ${routeLabel} failed to load`);
    }
  }
};

// Mount API routes
mountRoute('./routes/auth', 'auth');
mountRoute('./routes/admin', 'admin');
mountRoute('./routes/mobile', 'mobile');
mountRoute('./routes/student', 'student');
mountRoute('./routes/users', 'users');
mountRoute('./routes/payment', 'payments');

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
      health: '/health'
    }
  });
});

// Swagger documentation
try {
  const { swaggerUi, specs, swaggerOptions } = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  console.log('✅ Swagger documentation available at /api-docs');
} catch (err) {
  console.warn('⚠️ Swagger documentation not available:', err.message);
}

// PHASE 14: 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// PHASE 15: Global error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Final catch-all error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ error: "Internal server error" });
  }

  return res.status(500).json({ error: err.message, stack: err.stack });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);

  try {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    }

    // Close Redis connection
    try {
      const { getRedisClient } = require('./utils/redisClient');
      const redis = getRedisClient();
      if (redis) {
        await redis.quit();
        console.log('✅ Redis connection closed');
      }
    } catch (err) {
      console.warn('⚠️ Error closing Redis connection:', err.message);
    }

    // Close server if running locally
    if (require.main === module && app.server) {
      app.server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason instanceof Error ? reason.message : String(reason));
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  } else {
    process.exit(1);
  }
});

// Export for Vercel
module.exports = app;

// Start server for local development ONLY
if (require.main === module) {
  const isServerless = process.env.VERCEL === '1' || process.env.SERVERLESS === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isServerless || (isProduction && !process.env.ALLOW_LOCAL_SERVER)) {
    console.log('☁️ Running in serverless/production mode');
    console.log('🔗 API endpoints will be handled by serverless functions');
  } else {
    const startServer = async () => {
      try {
        console.log('🔧 Starting server in development mode...');
        
        // Initialize services
        await initializeServices();

        // Find an available port
        const findAvailablePort = async () => {
          const defaultPort = process.env.PORT || 5002;
          const alternativePorts = [5003, 5004, 5005, 3001, 3002, 8000, 8001, 5001];

          if (await isPortAvailable(defaultPort)) {
            return defaultPort;
          }

          console.log(`⚠️ Port ${defaultPort} is in use. Searching for available port...`);

          for (const port of alternativePorts) {
            if (await isPortAvailable(port)) {
              console.log(`✅ Found available port: ${port}`);
              return port;
            }
          }

          throw new Error('No available ports found. Please stop other services or specify a different port.');
        };

        const PORT = await findAvailablePort();

        // Start the server on all network interfaces
        const server = app.listen(PORT, '0.0.0.0', () => {
          console.log('\n🚀 ===== MATHEMATICO BACKEND STARTED =====');
          console.log(`🌐 Server running on port ${PORT}`);
          console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
          console.log('⚠️  LOCAL DEVELOPMENT SERVER ONLY - NOT FOR PRODUCTION');
          console.log('==========================================\n');
        });

        server.on('error', (err) => {
          console.error('❌ Server error:', err);
          process.exit(1);
        });

        app.server = server;
      } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
      }
    };

    startServer();
  }
}
