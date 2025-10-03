// Vercel serverless backend entry point for Mathematico - Optimized for Serverless
require('dotenv').config({ path: `${__dirname}/config.env` });
console.log('✅ Environment variables loaded from config.env');

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const os = require("os");
const jwt = require("jsonwebtoken");

// Import MongoDB database connection utility
const { connectToDatabase, getConnectionStatus } = require('./utils/database');
const mongoose = require('mongoose');

// Startup environment validation with enhanced security checks
(function validateEnvironment() {
  try {
    const missing = [];
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'MONGODB_URI',
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

// Safe imports with fallbacks (do NOT crash serverless)
let generateAccessToken, generateRefreshToken, authenticateToken, requireAdmin;
// Unified JWT secrets to avoid sign/verify mismatches
const JWT_SECRET_SAFE = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET_SAFE = process.env.JWT_REFRESH_SECRET || 'your-super-refresh-secret-change-in-production';
try {
  const jwtUtils = require("./utils/jwt");
  generateAccessToken = jwtUtils.generateAccessToken;
  generateRefreshToken = jwtUtils.generateRefreshToken;
} catch (err) {
  console.warn('JWT utils not available, using inline jwt fallback:', err.message);
  generateAccessToken = (payload) => jwt.sign(payload, JWT_SECRET_SAFE, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h' });
  generateRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET_SAFE, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
}

try {
  const authMiddleware = require("./middlewares/auth");
  authenticateToken = authMiddleware.authenticateToken;
  requireAdmin = authMiddleware.requireAdmin;
} catch (err) {
  console.warn('Auth middleware not available, securing routes with deny-by-default stubs:', err.message);
  authenticateToken = (req, res, next) => {
    return res.status(401).json({ success: false, message: 'Auth middleware unavailable', timestamp: new Date().toISOString() });
  };
  requireAdmin = (req, res, next) => {
    return res.status(403).json({ success: false, message: 'Admin access denied', timestamp: new Date().toISOString() });
  };
}

// Initialize Express app
const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Security middleware
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://localhost:8081',
      'https://mathematico-frontend.vercel.app',
      'https://mathematico-backend-new.vercel.app',
      'https://mathematico-app.vercel.app',
      'exp://192.168.1.100:8081', // Expo development
      'exp://localhost:8081' // Expo development
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
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

// Rate limiting - relaxed for testing
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased limit for testing
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
    let dbHealth = { status: 'disconnected', type: 'mongodb' };
    
    // Try to connect to database if not connected
    try {
      const connection = await connectToDatabase();
      if (connection && connection.readyState === 1) {
        await connection.db.admin().ping();
        dbHealth = { 
          status: 'healthy', 
          type: 'mongodb',
          host: connection.host,
          port: connection.port,
          name: connection.name
        };
      } else {
        dbHealth = { 
          status: 'disconnected', 
          type: 'mongodb',
          message: 'MongoDB not connected - running in fallback mode'
        };
      }
    } catch (error) {
      dbHealth = { status: 'error', type: 'mongodb', error: error.message };
    }
    
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
      database: dbHealth,
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
    const dbStatus = getConnectionStatus();
    res.json({
      success: true,
      message: 'Mathematico Backend API is running',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbStatus.isConnected,
        readyState: dbStatus.readyState,
        host: dbStatus.host || 'unknown'
      },
      endpoints: {
        auth: '/api/v1/auth',
        admin: '/api/v1/admin',
        mobile: '/api/v1/mobile',
        student: '/api/v1/student',
        users: '/api/v1/users',
        health: '/health'
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

// Initialize MongoDB connection for serverless mode
const initializeDatabase = async () => {
  try {
    console.log('🔗 Initializing MongoDB connection for serverless...');
    await connectToDatabase();
    console.log('✅ MongoDB connection ready for serverless');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('❌ Full error:', err);
    // Don't exit, let the server start and handle connections per request
  }
};

// Initialize database connection
initializeDatabase();

// Global database connection handler for all requests
app.use(async (req, res, next) => {
  // Skip for health and root endpoints
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  
  // Database connection handled by individual controllers
  // No global database connection check needed
  
  next();
});

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Import route handlers with proper error handling for serverless
let authRoutes, adminRoutes, mobileRoutes, studentRoutes, usersRoutes;

// Auth routes
authRoutes = require('./routes/auth');
console.log('✅ Auth routes loaded');

// Admin routes
adminRoutes = require('./routes/admin');
console.log('✅ Admin routes loaded');

// Mobile routes
mobileRoutes = require('./routes/mobile');
console.log('✅ Mobile routes loaded');

// Student routes
studentRoutes = require('./routes/student');
console.log('✅ Student routes loaded');

// Users routes
usersRoutes = require('./routes/users');
console.log('✅ Users routes loaded');


// Removed fallback data - using real database operations

// REMOVED ALL FALLBACK ROUTES - Let the actual route handlers work with database

// Mount routes (database connection handled in individual controllers)
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
    database: 'MongoDB Atlas',
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
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
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

// Export for Vercel
module.exports = app;

// Start server for local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    const connectionStatus = getConnectionStatus();
    console.log(`🔗 Database: ${connectionStatus.isConnected ? 'Connected' : 'Disconnected'}`);
  });
}
