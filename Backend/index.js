// Vercel serverless backend entry point for Mathematico
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const os = require("os");
const rateLimit = require("express-rate-limit");

// Import database utilities
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
  // Full helmet for traditional server
  app.use(helmet());
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

// HTTP request logging (conditional)
if (httpLogger && !process.env.VERCEL) {
  app.use(httpLogger);
}

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
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ----------------- ROUTE IMPORTS -----------------

// Import route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const mobileRoutes = require('./routes/mobile');
const studentRoutes = require('./routes/student');

// Mount routes
app.use('/api/v1/auth', authRoutes);
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

// ----------------- SERVER STARTUP -----------------

const PORT = process.env.PORT || 5000;

// Only start server if not in serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Mathematico Backend Server running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
  });
}

// Export for serverless deployment
module.exports = app;
