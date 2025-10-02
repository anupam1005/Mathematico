// Vercel serverless backend entry point for Mathematico - MongoDB Version
require('dotenv').config({ path: `${__dirname}/config.env` });
console.log('✅ Environment variables loaded from config.env');
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const os = require("os");
const jwt = require("jsonwebtoken");

// Import MongoDB database connection
const { connectDB, healthCheck } = require('./database-mongodb');

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
      'https://mathematico-backend-new.vercel.app'
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
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

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
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

// API information endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico API - MongoDB Version',
    version: '2.0.0',
    database: 'MongoDB Atlas',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/v1',
      docs: '/api-docs'
    }
  });
});

// Initialize database connection
let dbConnected = false;
(async () => {
  try {
    console.log('🔗 Initializing MongoDB connection...');
    await connectDB();
    dbConnected = true;
    console.log('✅ MongoDB connection established');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    dbConnected = false;
  }
})();

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Import route handlers with MongoDB models
let authRoutes, adminRoutes, mobileRoutes, studentRoutes;

try {
  // Auth routes
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.warn('⚠️ Auth routes not available:', err.message);
  authRoutes = express.Router();
  authRoutes.all('*', (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Auth service unavailable - MongoDB connection required',
    serverless: true 
  }));
}

try {
  // Admin routes with MongoDB
  adminRoutes = require('./routes/admin-mongodb');
  console.log('✅ Admin routes loaded');
} catch (err) {
  console.warn('⚠️ Admin routes not available:', err.message);
  adminRoutes = express.Router();
  adminRoutes.all('*', (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Admin service unavailable - MongoDB connection required',
    serverless: true 
  }));
}

try {
  // Mobile routes
  mobileRoutes = require('./routes/mobile-mongodb');
  console.log('✅ Mobile routes loaded');
} catch (err) {
  console.warn('⚠️ Mobile routes not available:', err.message);
  mobileRoutes = express.Router();
  mobileRoutes.all('*', (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Mobile service unavailable - MongoDB connection required',
    serverless: true 
  }));
}

try {
  // Student routes
  studentRoutes = require('./routes/student-mongodb');
  console.log('✅ Student routes loaded');
} catch (err) {
  console.warn('⚠️ Student routes not available:', err.message);
  studentRoutes = express.Router();
  studentRoutes.all('*', (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Student service unavailable - MongoDB connection required',
    serverless: true 
  }));
}

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/mobile`, mobileRoutes);
app.use(`${API_PREFIX}`, studentRoutes);

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
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export for Vercel
module.exports = app;

// Start server for local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    console.log(`🔗 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
  });
}
