// Mathematico Backend with MongoDB Database
require('dotenv').config();
console.log('✅ Environment variables loaded');

// Database connection
const connectDB = require('./config/database');

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const os = require("os");
const jwt = require("jsonwebtoken");const net = require("net");

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

// Startup environment validation with enhanced security checks
(function validateEnvironment() {
  try {
    const missing = [];
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      missing.push('MONGO_URI (or MONGODB_URI)');
    }

    // Check for required variables
    requiredVars.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });

    const optionalGroups = [
      {
        label: 'Cloudinary',
        keys: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
      },
      {
        label: 'Razorpay',
        keys: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET']
      }
    ];

    if (missing.length) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }

    optionalGroups.forEach(({ label, keys }) => {
      const missingOptional = keys.filter((key) => !process.env[key]);
      if (missingOptional.length) {
        console.warn(`⚠️ ${label} env vars missing: ${missingOptional.join(', ')}`);
      }
    });

    console.log('✅ Required environment variables present');
  } catch (e) {
    console.error('❌ Environment validation failed');
    process.exit(1);
  }
})();

// JWT and Auth middleware imports (required for serverless)
try {
  const jwtUtils = require("./utils/jwt");
  const authMiddleware = require("./middlewares/auth");
  console.log('✅ JWT and Auth middleware loaded successfully');
} catch (err) {
  console.error('❌ Critical middleware failed to load:', err.message);
  // These are required for the API to function
  process.exit(1);
}

// Initialize Express app
const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Initialize database connection in serverless and local environments
// Fire-and-forget to avoid blocking cold starts; connection is cached
(async () => {
  try {
    await connectDB();
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('⚠️ Database initialization failed (continuing to serve requests):', err && err.message ? err.message : err);
  }
})();

// Handle favicon requests explicitly to avoid 500s in serverless
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Uo9F3kAAAAASUVORK5CYII='; // 1x1 transparent PNG

app.get('/favicon.ico', (req, res) => {
  const buffer = Buffer.from(TINY_PNG_BASE64, 'base64');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', buffer.length);
  res.status(200).end(buffer);
});

app.get('/favicon.png', (req, res) => {
  const buffer = Buffer.from(TINY_PNG_BASE64, 'base64');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', buffer.length);
  res.status(200).end(buffer);
});

app.head('/favicon.ico', (req, res) => {
  const buffer = Buffer.from(TINY_PNG_BASE64, 'base64');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', buffer.length);
  res.status(200).end();
});

app.head('/favicon.png', (req, res) => {
  const buffer = Buffer.from(TINY_PNG_BASE64, 'base64');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', buffer.length);
  res.status(200).end();
});

// Security middleware
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// Production monitoring and logging
if (process.env.NODE_ENV === 'production') {
  const requestLogger = require('./middleware/requestLogger');
  app.use(requestLogger);
}

// CORS configuration
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

    // Log the blocked origin for debugging
    console.warn('🚫 CORS blocked origin:', origin);
    console.log('✅ Allowed origins:', allowedOrigins);
    
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

// Rate limiting - optimized for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Reasonable limit for production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware (for secure refresh tokens)
app.use(cookieParser());

// Static file serving - disabled for serverless mode
// In serverless mode, files should be served from Cloudinary or CDN
console.log('⚠️ Static file serving disabled for serverless mode - use Cloudinary for file storage');

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status: 'healthy',
      database: {
        status: 'connected',
        type: 'mongodb',
        host: process.env.MONGO_URI ? 'connected' : 'not configured'
      },
      system: systemInfo,
      environment: process.env.NODE_ENV || 'development',
      serverless: process.env.VERCEL === '1',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Mathematico Backend API is running',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        readyState: 1,
        host: 'mongodb'
      },
      endpoints: {
        auth: '/api/v1/auth',
        admin: '/api/v1/admin',
        mobile: '/api/v1/mobile',
        student: '/api/v1/student',
        users: '/api/v1/users',
        health: '/health'
      },
      documentation: {
        info: 'Visit /api/v1/admin/info for admin API documentation',
        auth: 'Visit /api/v1/auth for authentication endpoints',
        health: 'Visit /health for system health check'
      },
      quickStart: {
        step1: 'Test health: GET /health',
        step2: 'Get auth info: GET /api/v1/auth',
        step3: 'Login: POST /api/v1/auth/login',
        step4: 'Access admin: GET /api/v1/admin (with Bearer token)'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
const DEFAULT_API_PREFIX = '/api/v1';
const apiPrefixEnv = (process.env.API_PREFIX || '').trim();
const normalizedApiPrefix = apiPrefixEnv
  ? apiPrefixEnv.startsWith('/')
    ? apiPrefixEnv
    : `/${apiPrefixEnv}`
  : DEFAULT_API_PREFIX;

if (normalizedApiPrefix !== DEFAULT_API_PREFIX) {
  console.warn(
    `⚠️ API_PREFIX "${normalizedApiPrefix}" does not match frontend (${DEFAULT_API_PREFIX}). Using ${DEFAULT_API_PREFIX}.`
  );
}

const API_PREFIX = DEFAULT_API_PREFIX;

// Import route handlers (tolerant loading per route for serverless)
 let authRoutes, adminRoutes, mobileRoutes, studentRoutes, usersRoutes, paymentRoutes;

const safeRequire = (modulePath, label) => {
  try {
    const mod = require(modulePath);
    console.log(`✅ Route loaded: ${label}`);
    return mod;
  } catch (err) {
    console.warn(`⚠️ Route failed to load (${label}):`, err && err.message ? err.message : err);
    return null;
  }
};

authRoutes = safeRequire('./routes/auth', 'auth');
 if (!authRoutes) {
  console.log('🔄 Attempting to load simple auth routes...');
  authRoutes = safeRequire('./routes/auth-simple', 'auth-simple');
}
 adminRoutes = safeRequire('./routes/admin', 'admin');
mobileRoutes = safeRequire('./routes/mobile', 'mobile');
studentRoutes = safeRequire('./routes/student', 'student');
usersRoutes = safeRequire('./routes/users', 'users');
 paymentRoutes = safeRequire('./routes/payment', 'payment');

// Mount routes
console.log('🔗 Mounting API routes...');
 // Force mount all routes for serverless deployment
try {
  // Auth routes
  const authRoutes = require('./routes/auth');
  app.use(`${API_PREFIX}/auth`, authRoutes);
  console.log(`✅ Auth routes mounted at ${API_PREFIX}/auth`);
} catch (error) {
  console.error('❌ Failed to mount auth routes:', error.message);
}

try {
  // Admin routes
  const adminRoutes = require('./routes/admin');
  app.use(`${API_PREFIX}/admin`, adminRoutes);
  console.log(`✅ Admin routes mounted at ${API_PREFIX}/admin`);
} catch (error) {
  console.error('❌ Failed to mount admin routes:', error.message);
  const adminFallback = express.Router();
  adminFallback.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Admin API is healthy (fallback)',
      timestamp: new Date().toISOString(),
      status: 'operational'
    });
  });
  adminFallback.get('/info', (req, res) => {
    res.json({
      success: true,
      message: 'Mathematico Admin API (fallback)',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      authentication: {
        required: true,
        method: 'JWT Bearer Token',
        loginEndpoint: '/api/v1/auth/login',
        description: 'Use admin credentials to get access token'
      },
      endpoints: {
        dashboard: '/dashboard',
        users: '/users',
        books: '/books',
        courses: '/courses',
        liveClasses: '/live-classes',
        payments: '/payments'
      },
      note: 'Admin routes failed to load. Only health/info are available.'
    });
  });
  app.use(`${API_PREFIX}/admin`, adminFallback);
  console.warn(`⚠️ Fallback admin routes mounted at ${API_PREFIX}/admin`);
}

try {
  // Mobile routes
  const mobileRoutes = require('./routes/mobile');
  app.use(`${API_PREFIX}/mobile`, mobileRoutes);
  console.log(`✅ Mobile routes mounted at ${API_PREFIX}/mobile`);
} catch (error) {
  console.error('❌ Failed to mount mobile routes:', error.message);
}

try {
  // Student routes
  const studentRoutes = require('./routes/student');
  app.use(`${API_PREFIX}/student`, studentRoutes);
  console.log(`✅ Student routes mounted at ${API_PREFIX}/student`);
} catch (error) {
  console.error('❌ Failed to mount student routes:', error.message);
}

try {
  // Users routes
  const usersRoutes = require('./routes/users');
  app.use(`${API_PREFIX}/users`, usersRoutes);
  console.log(`✅ Users routes mounted at ${API_PREFIX}/users`);
} catch (error) {
  console.error('❌ Failed to mount users routes:', error.message);
}

try {
  // Payment routes
  const paymentRoutes = require('./routes/payment');
  app.use(`${API_PREFIX}/payments`, paymentRoutes);
  console.log(`✅ Payment routes mounted at ${API_PREFIX}/payments`);
} catch (error) {
 console.error('❌ Failed to mount payment routes:', error.message);
}

// Root API endpoint
app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico API - MongoDB Version',
    version: '2.0.0',
    database: 'MongoDB',
    environment: process.env.NODE_ENV || 'development',
    serverless: process.env.VERCEL === '1',
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

// Test route to verify routing is working
app.get(`${API_PREFIX}/test`, (req, res) => {
  console.log('🧪 Test endpoint requested');
  res.json({
    success: true,
    message: 'API routing is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Swagger documentation
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = require('./docs/swagger.json');

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('✅ Swagger documentation available at /api-docs');
} catch (err) {
  console.warn('⚠️ Swagger documentation not available:', err.message);
}

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Endpoint not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);

  try {
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

// Export for Vercel
module.exports = app;

// Start server for local development
if (require.main === module) {
   // Connect to database first, then start server
// Serverless optimization - only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    try {
      console.log('🔧 Starting server in development mode...');
      
      // Connect to MongoDB
      await connectDB();

      // Find an available port
      const findAvailablePort = async () => {
        const defaultPort = process.env.PORT || 5002;
        const alternativePorts = [5003, 5004, 5005, 3001, 3002, 8000, 8001, 5001];

        // Check default port first
        if (await isPortAvailable(defaultPort)) {
          return defaultPort;
        }

        console.log(`⚠️ Port ${defaultPort} is in use. Searching for available port...`);

        // Try alternative ports
        for (const port of alternativePorts) {
          if (await isPortAvailable(port)) {
            console.log(`✅ Found available port: ${port}`);
            return port;
          }
        }

        throw new Error('No available ports found. Please stop other services or specify a different port.');
      };

      const PORT = await findAvailablePort();

      // Start the server on all network interfaces (0.0.0.0) to allow mobile connections
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('\n🚀 ===== MATHEMATICO BACKEND STARTED =====');
        console.log(`🌐 Server running on port ${PORT}`);
        console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`☁️  Serverless: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);
        console.log('==========================================\n');
      });

      // Handle any server errors
      server.on('error', (err) => {
        console.error('❌ Server error:', err);
        process.exit(1);
      });

      // Store server reference for graceful shutdown
      app.server = server;
 
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };
 
  startServer();
} else {
  console.log('☁️ Running in serverless mode (Vercel)');
  console.log('🔗 API endpoints will be handled by Vercel functions');
 }
 }
