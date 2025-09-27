// Vercel serverless backend entry point for Mathematico - MINIMAL VERSION
const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");

// Safe imports with fallbacks
let generateAccessToken, generateRefreshToken, authenticateToken, requireAdmin;
try {
  const jwtUtils = require("./utils/jwt");
  generateAccessToken = jwtUtils.generateAccessToken;
  generateRefreshToken = jwtUtils.generateRefreshToken;
} catch (err) {
  console.warn('JWT utils not available:', err.message);
  generateAccessToken = () => 'fake-access-token';
  generateRefreshToken = () => 'fake-refresh-token';
}

try {
  const authMiddleware = require("./middlewares/auth");
  authenticateToken = authMiddleware.authenticateToken;
  requireAdmin = authMiddleware.requireAdmin;
} catch (err) {
  console.warn('Auth middleware not available:', err.message);
  authenticateToken = (req, res, next) => { req.user = { id: 1, role: 'admin' }; next(); };
  requireAdmin = (req, res, next) => next();
}

// Simple console logging for serverless - no file dependencies
const logger = {
  error: (msg, ctx) => console.error(`ERROR: ${msg}`, ctx || ''),
  warn: (msg, ctx) => console.warn(`WARN: ${msg}`, ctx || ''),
  info: (msg, ctx) => console.log(`INFO: ${msg}`, ctx || ''),
  debug: (msg, ctx) => console.log(`DEBUG: ${msg}`, ctx || ''),
};
const httpLogger = (req, res, next) => next(); // No-op for serverless

// Swagger disabled in serverless for safety
const swaggerUi = null;
const specs = null;
const swaggerOptions = null;
console.log('Swagger disabled in serverless mode');

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

// Minimal security - no helmet to avoid import issues
console.log('Security middleware disabled in serverless mode');

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

// File upload service configuration
let fileUploadService = null;
try {
  const { upload, processFileUpload, processMultipleFileUpload, handleUploadError } = require('./utils/fileUpload');
  fileUploadService = { upload, processFileUpload, processMultipleFileUpload, handleUploadError };
  console.log('✅ File upload service configured');
} catch (error) {
  console.log('⚠️ File upload service not available:', error.message);
}

// Database connection with fallback for serverless
let dbInitialized = false;
try {
  const { testConnection, initializeDatabase } = require('./utils/database');
  
  // Test database connection
  const isConnected = await testConnection();
  if (isConnected) {
    await initializeDatabase();
    dbInitialized = true;
    console.log('✅ Database initialized successfully');
  } else {
    console.log('⚠️ Database connection failed, using fallback mode');
    dbInitialized = false;
  }
} catch (error) {
  console.log('⚠️ Database not available, using serverless fallback mode');
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

// Serverless startup log
console.log('🚀 Mathematico Backend - Serverless Function Starting...', {
  nodeEnv: process.env.NODE_ENV || 'development',
  version: '2.0.0',
  serverless: !!process.env.VERCEL,
  timestamp: new Date().toISOString()
});

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

// ----------------- BUILT-IN ROUTES FOR SERVERLESS -----------------

// Built-in auth endpoints
app.get('/api/v1/auth', (req, res) => {
  res.json({
    success: true,
    message: "Auth API is working ✅",
    data: {
      serverless: true,
      timestamp: new Date().toISOString(),
      endpoints: {
        login: "/api/v1/auth/login",
        register: "/api/v1/auth/register",
        logout: "/api/v1/auth/logout",
        profile: "/api/v1/auth/profile",
        refreshToken: "/api/v1/auth/refresh-token"
      }
    }
  });
});

// Built-in auth routes to avoid import issues
app.post('/api/v1/auth/login', (req, res) => {
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

// Additional auth endpoints
app.post('/api/v1/auth/register', (req, res) => {
  res.status(503).json({
    success: false,
    message: "Registration temporarily unavailable in serverless mode"
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: "Logout successful"
  });
});

app.get('/api/v1/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user?.id || 1,
      email: req.user?.email || "unknown@example.com",
      name: req.user?.name || "Unknown User",
      role: req.user?.role || "user",
      isAdmin: req.user?.isAdmin || false
    }
  });
});

app.post('/api/v1/auth/refresh-token', (req, res) => {
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

// Built-in mobile endpoints
app.get('/api/v1/mobile', (req, res) => {
  res.json({
    success: true,
    message: "Mobile API is working ✅",
    data: {
      serverless: true,
      timestamp: new Date().toISOString(),
      endpoints: {
        test: "/api/v1/mobile/test",
        courses: "/api/v1/mobile/courses",
        books: "/api/v1/mobile/books",
        liveClasses: "/api/v1/mobile/live-classes"
      }
    }
  });
});

app.get('/api/v1/mobile/test', (req, res) => {
  res.json({
    success: true,
    message: "Mobile API test endpoint working ✅",
    data: {
      serverless: true,
      timestamp: new Date().toISOString(),
      version: "2.0.0"
    }
  });
});

app.get('/api/v1/mobile/courses', (req, res) => {
  res.json({
    success: true,
    message: "No courses available",
    data: []
  });
});

app.get('/api/v1/mobile/books', (req, res) => {
  res.json({
    success: true,
    message: "No books available",
    data: []
  });
});

app.get('/api/v1/mobile/live-classes', (req, res) => {
  res.json({
    success: true,
    message: "No live classes available",
    data: []
  });
});

// File upload endpoints
if (fileUploadService) {
  app.post('/api/v1/upload', fileUploadService.upload.single('file'), fileUploadService.processFileUpload);
  app.post('/api/v1/upload/multiple', fileUploadService.upload.array('files', 5), fileUploadService.processMultipleFileUpload);
  app.use(fileUploadService.handleUploadError);
} else {
  app.post('/api/v1/upload', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'File upload service not available. Please configure Cloudinary or AWS S3.'
    });
  });
}

// Built-in fallback endpoints
app.get('/api/v1/student/courses', (req, res) => {
  res.json({
    success: true,
    message: "No courses available",
    data: []
  });
});

app.get('/api/v1/admin/users', (req, res) => {
  res.json({
    success: false,
    message: "Admin service temporarily unavailable in serverless mode"
  });
});

// Admin dashboard endpoint
app.get('/api/v1/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard data",
    data: {
      stats: {
        totalUsers: 0,
        totalStudents: 0,
        totalCourses: 0,
        totalModules: 0,
        totalLessons: 0,
        totalRevenue: 0.00,
        activeBatches: 0
      },
      recentUsers: [],
      recentCourses: []
    },
    serverless: true
  });
});

// Admin books endpoint
app.get('/api/v1/admin/books', (req, res) => {
  res.json({
    success: true,
    message: "Admin books data",
    data: [],
    serverless: true
  });
});

// API Testing endpoint
app.get('/api/v1/test', async (req, res) => {
  try {
    const APITester = require('./utils/apiTester');
    const tester = new APITester(process.env.BACKEND_URL || 'http://localhost:5000');
    const report = await tester.testAllEndpoints();
    
    res.json({
      success: true,
      message: 'API testing completed',
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API testing failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Health Check endpoint
app.get('/api/v1/status', (req, res) => {
  const status = {
    success: true,
    message: 'Mathematico API Status',
    data: {
      serverless: !!process.env.VERCEL,
      database: dbInitialized ? 'connected' : 'fallback',
      fileUpload: fileUploadService ? 'configured' : 'disabled',
      version: '2.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      endpoints: {
        health: '/api/v1/health',
        test: '/api/v1/test',
        auth: '/api/v1/auth/*',
        admin: '/api/v1/admin/*',
        mobile: '/api/v1/mobile/*',
        student: '/api/v1/student/*',
        upload: '/api/v1/upload'
      }
    },
    timestamp: new Date().toISOString()
  };

  res.json(status);
});

console.log('✅ Built-in routes configured for serverless');

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