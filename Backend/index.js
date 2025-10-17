// Mathematico Backend with MongoDB Database
require('dotenv').config({ path: `${__dirname}/config.env` });
console.log('✅ Environment variables loaded from config.env');

// Database connection
const connectDB = require('./config/database');

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const os = require("os");
const jwt = require("jsonwebtoken");

// Startup environment validation with enhanced security checks
(function validateEnvironment() {
  try {
    const missing = [];
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    
    // Check for required variables
    requiredVars.forEach((key) => { 
      if (!process.env[key]) {
        missing.push(key);
      } else if (process.env[key].length < 32) {
        console.warn(`⚠️ ${key} is too short (minimum 32 characters recommended)`);
      }
    });

    // Security warnings
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      console.warn('⚠️ JWT_SECRET should be at least 64 characters for production');
    }
    
    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 8) {
      console.warn('⚠️ ADMIN_PASSWORD should be at least 8 characters');
    }

    if (missing.length) {
      console.warn('⚠️ Missing required environment variables:', missing);
      console.warn('⚠️ Some features may not work properly');
    } else {
      console.log('✅ Core environment variables present');
    }

    // Email configuration validation
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const isGmail = /@gmail\.com$/i.test(process.env.EMAIL_USER);
      if (!isGmail) {
        console.warn('⚠️ EMAIL_USER is not a Gmail account. Ensure provider and credentials match.');
      }
    }
    
    // CORS security check
    if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN === '*') {
      console.warn('⚠️ CORS_ORIGIN is set to "*" - this allows all origins (security risk)');
    }
    
  } catch (e) {
    console.warn('⚠️ Environment validation skipped:', e.message);
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

app.head('/favicon.ico', (req, res) => {
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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://localhost:8081',
      'https://mathematico-frontend.vercel.app',
      'https://mathematico-backend-new.vercel.app',
      'https://mathematico-app.vercel.app',
      'exp://192.168.1.100:8081', // Expo development
      'exp://localhost:8081', // Expo development
      'exp://10.0.2.2:8081', // Android emulator
      'exp://127.0.0.1:8081', // Local development
      'capacitor://localhost', // Capacitor apps
      'ionic://localhost', // Ionic apps
      'http://localhost', // Local development
      'https://localhost', // Local HTTPS
      'file://', // File protocol for mobile apps
      'app://', // App protocol for mobile apps
      'mathematico://', // Custom app scheme
      'com.anonymous.mathematico://' // Android app scheme
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.warn('❌ CORS: Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
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
        host: process.env.MONGODB_URI ? 'connected' : 'not configured'
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
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Import route handlers (tolerant loading per route for serverless)
let authRoutes, adminRoutes, mobileRoutes, studentRoutes, usersRoutes;

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
adminRoutes = safeRequire('./routes/admin', 'admin');
mobileRoutes = safeRequire('./routes/mobile', 'mobile');
studentRoutes = safeRequire('./routes/student', 'student');
usersRoutes = safeRequire('./routes/users', 'users');

// Mount routes
console.log('🔗 Mounting API routes...');

// Mount all routes for serverless deployment
app.use(`${API_PREFIX}/auth`, authRoutes);
console.log(`✅ Auth routes mounted at ${API_PREFIX}/auth`);

// Admin routes
app.use(`${API_PREFIX}/admin`, adminRoutes);
console.log(`✅ Admin routes mounted at ${API_PREFIX}/admin`);

// Mobile routes
app.use(`${API_PREFIX}/mobile`, mobileRoutes);
console.log(`✅ Mobile routes mounted at ${API_PREFIX}/mobile`);

// Users routes
app.use(`${API_PREFIX}/users`, usersRoutes);
console.log(`✅ Users routes mounted at ${API_PREFIX}/users`);

// Student routes
app.use(`${API_PREFIX}/student`, studentRoutes);
console.log(`✅ Student routes mounted at ${API_PREFIX}/student`);

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
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

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
  const PORT = process.env.PORT || 5000;
  
  // Connect to database first, then start server
  const startServer = async () => {
    try {
      // Connect to MongoDB
      await connectDB();
      
      // Start the server
      app.server = app.listen(PORT, () => {
        console.log('\n🚀 ===== MATHEMATICO BACKEND STARTED =====');
        console.log(`🌐 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
        console.log(`🔗 API root: http://localhost:${PORT}/api/v1`);
        console.log(`🗄️  Database: MongoDB Connected`);
        console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`☁️  Serverless: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);
        console.log('==========================================\n');
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };
  
  startServer();
}