// Vercel serverless backend entry point for Mathematico
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const multer = require("multer");
const path = require("path");
const os = require("os");
const rateLimit = require("express-rate-limit");

const { generateAccessToken, generateRefreshToken } = require("./utils/jwt");
const { authenticateToken, requireAdmin } = require("./middlewares/auth");
const { testConnection, createUsersTable, createBooksTable, createCoursesTable, createLiveClassesTable, createPaymentsTable } = require("./database");

// Conditional logger import - disable file logging in serverless
let logger, httpLogger, error, warn, info, debug;
try {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Simple console logging for serverless
    const simpleLogger = {
      error: (msg, ctx) => console.error(`ERROR: ${msg}`, ctx || ''),
      warn: (msg, ctx) => console.warn(`WARN: ${msg}`, ctx || ''),
      info: (msg, ctx) => console.log(`INFO: ${msg}`, ctx || ''),
      debug: (msg, ctx) => console.log(`DEBUG: ${msg}`, ctx || ''),
    };
    logger = simpleLogger;
    httpLogger = (req, res, next) => next(); // No-op for serverless
    error = simpleLogger.error;
    warn = simpleLogger.warn;
    info = simpleLogger.info;
    debug = simpleLogger.debug;
  } else {
    const loggerModule = require("./utils/logger");
    logger = loggerModule.logger;
    httpLogger = loggerModule.httpLogger;
    error = loggerModule.error;
    warn = loggerModule.warn;
    info = loggerModule.info;
    debug = loggerModule.debug;
  }
} catch (err) {
  // Fallback to console if logger fails
  console.error('Logger initialization failed, using console fallback:', err.message);
  const fallbackLogger = {
    error: (msg, ctx) => console.error(`ERROR: ${msg}`, ctx || ''),
    warn: (msg, ctx) => console.warn(`WARN: ${msg}`, ctx || ''),
    info: (msg, ctx) => console.log(`INFO: ${msg}`, ctx || ''),
    debug: (msg, ctx) => console.log(`DEBUG: ${msg}`, ctx || ''),
  };
  logger = fallbackLogger;
  httpLogger = (req, res, next) => next();
  error = fallbackLogger.error;
  warn = fallbackLogger.warn;
  info = fallbackLogger.info;
  debug = fallbackLogger.debug;
}

// Conditional swagger import - may not be available in serverless
let swaggerUi, specs, swaggerOptions;
try {
  const swaggerModule = require("./config/swagger");
  swaggerUi = swaggerModule.swaggerUi;
  specs = swaggerModule.specs;
  swaggerOptions = swaggerModule.swaggerOptions;
} catch (err) {
  console.warn('Swagger not available:', err.message);
  swaggerUi = null;
  specs = null;
  swaggerOptions = null;
}

const app = express();

// Global error boundary for serverless
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// Security middleware (serverless-optimized)
if (process.env.VERCEL) {
  // Simplified helmet for serverless
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP in serverless to avoid issues
    crossOriginEmbedderPolicy: false,
    hsts: false // HTTPS handled by Vercel
  }));
} else {
  // Full helmet for traditional hosting
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
}

// CORS configuration - secure but mobile-friendly
const corsOptions = {
  origin: function (origin, callback) {
    // Always allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Define allowed origins for security
    const allowedOrigins = [
      // Development origins
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://localhost:8081',
      'http://192.168.1.100:8081',
      // Production origins
      'https://mathematico-frontend.vercel.app',
      'https://mathematico-backend-new.vercel.app',
      process.env.FRONTEND_URL,
      process.env.BACKEND_URL
    ].filter(Boolean);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === origin) return true;
      // Allow subdomains of vercel.app for mobile builds
      if (origin && origin.includes('vercel.app') && allowedOrigin.includes('vercel.app')) return true;
      return false;
    });
    
    if (isAllowed) {
      console.log('CORS: Allowed origin:', origin);
      callback(null, true);
    } else {
      // In serverless, be more lenient for mobile apps but log for security
      if (process.env.VERCEL) {
        console.log('CORS: Unknown origin allowed in serverless (mobile compatibility):', origin);
        callback(null, true);
      } else {
        console.log('CORS: Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Total-Count']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads - disabled in serverless
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} else {
  // In serverless, return error for upload requests
  app.use('/uploads', (req, res) => {
    res.status(501).json({
      success: false,
      message: 'File serving not available in serverless mode. Use cloud storage (S3, Cloudinary, etc.)',
      serverless: true
    });
  });
}

// Serve favicon.ico (serverless-friendly)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_GENERAL || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_AUTH || 5, // limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);

// HTTP request logging (conditional)
if (httpLogger && !process.env.VERCEL) {
  app.use(httpLogger);
}

// File upload configuration - serverless compatible
let upload;
if (process.env.VERCEL) {
  // In serverless, disable file uploads (no persistent storage)
  console.log('🚀 Serverless mode: File uploads disabled (use cloud storage instead)');
  upload = {
    single: () => (req, res, next) => {
      req.fileUploadError = 'File uploads not available in serverless mode. Please use cloud storage (S3, Cloudinary, etc.)';
      next();
    },
    fields: () => (req, res, next) => {
      req.fileUploadError = 'File uploads not available in serverless mode. Please use cloud storage (S3, Cloudinary, etc.)';
      next();
    }
  };
} else {
  // Traditional server - use multer
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = './uploads/temp';
      
      if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
        uploadPath = './uploads/covers';
      } else if (file.fieldname === 'pdfFile' || file.fieldname === 'pdf') {
        uploadPath = './uploads/pdfs';
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
      if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed for cover images'), false);
        }
      } else if (file.fieldname === 'pdfFile' || file.fieldname === 'pdf') {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      } else {
        cb(null, true);
      }
    }
  });
}

// Database initialization flag
let dbInitialized = false;

// Database initialization function
async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    console.log('🔄 Initializing database...');
    
    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn('⚠️  Database connection failed, using fallback data');
      return;
    }
    
    // Create tables
    await Promise.all([
      createUsersTable(),
      createBooksTable(),
      createCoursesTable(),
      createLiveClassesTable(),
      createPaymentsTable()
    ]);
    
    dbInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    // Don't throw error in serverless - continue with fallback data
  }
}

// Serverless database handling - SKIP database initialization completely
if (process.env.VERCEL) {
  console.log('🚀 Serverless mode: Database initialization DISABLED to prevent timeouts');
  dbInitialized = true; // Always skip DB init in serverless
  
  // Add middleware to log DB-dependent requests
  app.use((req, res, next) => {
    if (req.path.includes('/api/') && !req.path.includes('/test') && !req.path.includes('/health')) {
      console.log('📝 DB-dependent request:', req.method, req.path, '- using fallback data');
    }
    next();
  });
} else {
  // In non-serverless, allow DB initialization
  dbInitialized = false;
}

// Utility function to generate absolute file URLs
const getAbsoluteFileUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // Get base URL from environment or request
  const baseUrl = process.env.BACKEND_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:5000';
  
  // Ensure relative path starts with /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${baseUrl}${cleanPath}`;
};

// Initialize database (non-blocking in serverless)
if (process.env.VERCEL) {
  // In serverless, initialize on first request to avoid cold start timeouts
  console.log('🚀 Serverless environment detected - database will initialize on first request');
} else {
  initializeDatabase().catch(err => console.error('Database init failed:', err.message));
  console.log('🚀 Mathematico Backend Server starting...', {
    nodeEnv: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    port: process.env.PORT || 5000
  });
}

// Swagger API Documentation (conditional)
if (swaggerUi && specs) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
} else {
  app.get('/api-docs', (req, res) => {
    res.json({ 
      success: false, 
      message: 'API documentation not available in this environment' 
    });
  });
}

// ----------------- ROOT & HEALTH ENDPOINTS -----------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is running ✅",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    serverless: !!process.env.VERCEL,
    documentation: {
      swagger: "/api-docs",
      json: "/api-docs.json"
    },
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth/*",
      admin: "/api/v1/admin/*",
      mobile: "/api/v1/mobile/*",
      student: "/api/v1/student/*"
    }
  });
});

app.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico API v1",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth/*",
      admin: "/api/v1/admin/*",
      mobile: "/api/v1/mobile/*",
      student: "/api/v1/student/*"
    }
  });
});

app.get("/api/v1/health", async (req, res) => {
  const healthCheck = {
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    serverless: !!process.env.VERCEL,
    services: {
      database: { status: 'skipped', responseTime: null }
    }
  };

  // Add system info only in non-serverless environments
  if (!process.env.VERCEL) {
    try {
      healthCheck.uptime = process.uptime();
      healthCheck.services.memory = {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB'
      };
      healthCheck.services.cpu = {
        usage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? os.loadavg() : null
      };

      // Test database connection only in non-serverless
      try {
        const dbStart = Date.now();
        const isConnected = await testConnection();
        const dbResponseTime = Date.now() - dbStart;
        
        healthCheck.services.database = {
          status: isConnected ? 'healthy' : 'unhealthy',
          responseTime: `${dbResponseTime}ms`
        };
      } catch (error) {
        healthCheck.services.database = {
          status: 'error',
          responseTime: null,
          error: error.message
        };
        healthCheck.success = false;
      }
    } catch (err) {
      console.warn('Could not get system info:', err.message);
    }
  } else {
    // In serverless, provide meaningful health info without DB check
    healthCheck.services.database.status = 'disabled-serverless';
    healthCheck.services.database.message = 'Database checks disabled in serverless to prevent cold start timeouts';
    healthCheck.serverless = {
      coldStart: !global.warmStart,
      functionTimeout: '30s',
      region: process.env.VERCEL_REGION || 'unknown'
    };
    global.warmStart = true; // Mark as warm for subsequent requests
    console.log('Health check in serverless mode - optimized for cold starts');
  }

  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Mobile app test endpoint
app.get("/api/v1/mobile/test", (req, res) => {
  res.json({
    success: true,
    message: "Mobile API is working ✅",
    data: {
      serverless: true,
      timestamp: new Date().toISOString(),
      endpoints: {
        courses: "/api/v1/mobile/courses",
        books: "/api/v1/mobile/books",
        liveClasses: "/api/v1/mobile/live-classes"
      }
    }
  });
});

// Auth routes are now handled by routes/auth.js - no duplicate routes needed here

// ----------------- ROUTE IMPORTS & MOUNTING -----------------

// Import route modules - wrapped in try-catch for serverless debugging
let authRoutes, adminRoutes, mobileRoutes, studentRoutes;
try {
  authRoutes = require('./routes/auth');
  adminRoutes = require('./routes/admin');
  mobileRoutes = require('./routes/mobile');
  studentRoutes = require('./routes/student');
  console.log('✅ All route modules loaded successfully');
} catch (error) {
  console.error('❌ Error loading route modules:', error.message);
  console.error('Stack:', error.stack);
}

// Mount routes - only if they loaded successfully
if (authRoutes) app.use('/api/v1/auth', authRoutes);
if (adminRoutes) app.use('/api/v1/admin', adminRoutes);
if (mobileRoutes) app.use('/api/v1/mobile', mobileRoutes);
if (studentRoutes) app.use('/api/v1/student', studentRoutes);

// Backward compatibility - redirect old endpoints
app.use('/api/v1/books', (req, res, next) => {
  req.url = req.url.replace('/api/v1/books', '/api/v1/student/books');
  studentRoutes(req, res, next);
});

app.use('/api/v1/courses', (req, res, next) => {
  req.url = req.url.replace('/api/v1/courses', '/api/v1/student/courses');
  studentRoutes(req, res, next);
});

app.use('/api/v1/live-classes', (req, res, next) => {
  req.url = req.url.replace('/api/v1/live-classes', '/api/v1/student/live-classes');
  studentRoutes(req, res, next);
});

// ----------------- ERROR HANDLING -----------------

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      root: '/',
      health: '/api/v1/health',
      auth: '/api/v1/auth/*',
      admin: '/api/v1/admin/*',
      mobile: '/api/v1/mobile/*',
      student: '/api/v1/student/*',
      docs: '/api-docs'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message);
  console.error('Stack:', err.stack);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// Serverless startup log
if (process.env.VERCEL) {
  console.log('🚀 Mathematico Backend - Serverless Function Ready', {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: 'serverless'
  });
}

module.exports = app;