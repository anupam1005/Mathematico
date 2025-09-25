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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8081',
      'http://192.168.1.100:8081',
      'https://mathematico-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow for now, but log
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve favicon.ico (serverless-friendly)
app.get('/favicon.ico', (req, res) => {
  try {
    res.setHeader('Content-Type', 'image/x-icon');
    res.status(200).sendFile(path.join(__dirname, 'public', 'favicon.ico'));
  } catch (err) {
    // Fallback for serverless - return 204 No Content
    res.status(204).end();
  }
});

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

// Configure multer for file uploads (serverless-optimized)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = './uploads/temp';
    
    if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      uploadPath = './uploads/covers';
    } else if (file.fieldname === 'pdfFile' || file.fieldname === 'pdf') {
      uploadPath = './uploads/pdfs';
    }
    
    // In serverless, ensure directory exists
    if (process.env.VERCEL) {
      try {
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
      } catch (err) {
        console.warn('Could not create upload directory:', err.message);
      }
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
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

// Serverless database initialization middleware
if (process.env.VERCEL) {
  app.use(async (req, res, next) => {
    if (!dbInitialized) {
      try {
        await Promise.race([
          initializeDatabase(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DB init timeout')), 5000))
        ]);
      } catch (err) {
        console.error('Serverless DB init error:', err.message);
        // Continue anyway - fallback data will be used
      }
    }
    next();
  });
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
  // Ensure database is initialized in serverless
  if (process.env.VERCEL && !dbInitialized) {
    await initializeDatabase();
  }

  const healthCheck = {
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    serverless: !!process.env.VERCEL,
    services: {
      database: { status: 'unknown', responseTime: null }
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
    } catch (err) {
      console.warn('Could not get system info:', err.message);
    }
  }

  // Test database connection
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

  // Simple logging
  if (healthCheck.success) {
    console.log('Health check passed', { 
      dbStatus: healthCheck.services.database.status 
    });
  } else {
    console.warn('Health check failed', { 
      dbStatus: healthCheck.services.database.status,
      error: healthCheck.services.database.error 
    });
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

// ----------------- AUTH ROUTES (Basic Implementation) -----------------

app.post("/api/v1/auth/login", authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    let userPayload;
    if (email === "dc2006089@gmail.com" && password === "Myname*321") {
      userPayload = {
        id: 1,
        email,
        name: "Admin User",
        role: "admin",
        isAdmin: true,
      };
    } else if (email === "test@example.com" && password === "password123") {
      userPayload = {
        id: 2,
        email,
        name: "Test User",
        role: "user",
        isAdmin: false,
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          ...userPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.post("/api/v1/auth/register", authLimiter, (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const userPayload = {
      id: Date.now(),
      name,
      email,
      role: "user",
      isAdmin: false,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id });

    res.json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          ...userPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        tokens: { accessToken, refreshToken, expiresIn: 3600 },
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Refresh token endpoint - Fixed endpoint path
app.post("/api/v1/auth/refresh-token", (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    // For demo purposes, generate new tokens
    const userPayload = {
      id: 1,
      email: "dc2006089@gmail.com",
      name: "Admin User",
      role: "admin",
      isAdmin: true,
    };

    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: userPayload.id });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600
        }
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token"
    });
  }
});

// Logout endpoint
app.post("/api/v1/auth/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logout successful"
  });
});

// Profile endpoint
app.get("/api/v1/auth/profile", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      isAdmin: req.user.isAdmin
    }
  });
});

// ----------------- ROUTE IMPORTS & MOUNTING -----------------

// Import route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const mobileRoutes = require('./routes/mobile');
const studentRoutes = require('./routes/student');

// Mount routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/mobile', mobileRoutes);
app.use('/api/v1/student', studentRoutes);

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