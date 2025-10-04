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
      'exp://localhost:8081', // Expo development
      'exp://10.0.2.2:8081', // Android emulator
      'exp://127.0.0.1:8081' // Local development
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
    console.warn('⚠️ Server will start in fallback mode - database operations may fail');
    // Don't exit, let the server start and handle connections per request
  }
};

// Initialize database connection (non-blocking)
initializeDatabase().catch(err => {
  console.error('❌ Database initialization error:', err.message);
});

// Database connection is handled by individual controllers
// No global middleware needed for serverless mode

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Import route handlers (required for serverless)
let authRoutes, adminRoutes, mobileRoutes, studentRoutes, usersRoutes;

try {
  authRoutes = require('./routes/auth');
  adminRoutes = require('./routes/admin');
  mobileRoutes = require('./routes/mobile');
  studentRoutes = require('./routes/student');
  usersRoutes = require('./routes/users');
  console.log('✅ All route handlers loaded successfully');
} catch (err) {
  console.error('❌ Critical route handlers failed to load:', err.message);
  process.exit(1);
}


// Fallback data for serverless mode when database is unavailable
const FALLBACK_BOOKS = [
  {
    _id: '1',
    title: 'Advanced Mathematics',
    description: 'Comprehensive guide to advanced mathematical concepts',
    author: 'Dr. John Smith',
    category: 'Mathematics',
    level: 'Advanced',
    pages: 250,
    isbn: '978-1234567890',
    status: 'published',
    is_featured: true,
    download_count: 150,
    cover_image_url: 'https://res.cloudinary.com/duxjf7v40/image/upload/v1/mathematico/books/covers/advanced-math-cover.jpg',
    pdf_url: 'https://res.cloudinary.com/duxjf7v40/raw/upload/v1/mathematico/books/pdfs/advanced-math.pdf',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Calculus Fundamentals',
    description: 'Learn calculus from the ground up',
    author: 'Prof. Jane Doe',
    category: 'Mathematics',
    level: 'Foundation',
    pages: 180,
    isbn: '978-0987654321',
    status: 'published',
    is_featured: false,
    download_count: 89,
    cover_image_url: 'https://res.cloudinary.com/duxjf7v40/image/upload/v1/mathematico/books/covers/calculus-fundamentals.jpg',
    pdf_url: 'https://res.cloudinary.com/duxjf7v40/raw/upload/v1/mathematico/books/pdfs/calculus-fundamentals.pdf',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    _id: '3',
    title: 'Linear Algebra Made Easy',
    description: 'A beginner-friendly approach to linear algebra concepts',
    author: 'Dr. Sarah Wilson',
    category: 'Mathematics',
    level: 'Intermediate',
    pages: 220,
    isbn: '978-1122334455',
    status: 'published',
    is_featured: true,
    download_count: 75,
    cover_image_url: 'https://res.cloudinary.com/duxjf7v40/image/upload/v1/mathematico/books/covers/linear-algebra.jpg',
    pdf_url: 'https://res.cloudinary.com/duxjf7v40/raw/upload/v1/mathematico/books/pdfs/linear-algebra.pdf',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    _id: '4',
    title: 'Statistics and Probability',
    description: 'Understanding data analysis and probability theory',
    author: 'Prof. Michael Chen',
    category: 'Statistics',
    level: 'Intermediate',
    pages: 300,
    isbn: '978-5566778899',
    status: 'published',
    is_featured: false,
    download_count: 120,
    cover_image_url: 'https://res.cloudinary.com/duxjf7v40/image/upload/v1/mathematico/books/covers/statistics-probability.jpg',
    pdf_url: 'https://res.cloudinary.com/duxjf7v40/raw/upload/v1/mathematico/books/pdfs/statistics-probability.pdf',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const FALLBACK_COURSES = [
  {
    _id: '1',
    title: 'Advanced Mathematics',
    description: 'Comprehensive guide to advanced mathematical concepts',
    instructor: 'Dr. John Smith',
    category: 'Mathematics',
    level: 'Advanced',
    price: 99.99,
    status: 'published',
    is_featured: true,
    enrollment_count: 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Calculus Fundamentals',
    description: 'Learn calculus from the ground up',
    instructor: 'Prof. Jane Doe',
    category: 'Mathematics',
    level: 'Foundation',
    price: 79.99,
    status: 'published',
    is_featured: false,
    enrollment_count: 89,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const FALLBACK_LIVE_CLASSES = [
  {
    _id: '1',
    title: 'Advanced Calculus Live Session',
    description: 'Interactive live session on advanced calculus topics',
    instructor: 'Dr. Emily Rodriguez',
    category: 'Mathematics',
    level: 'Advanced',
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    maxStudents: 50,
    meetingLink: 'https://meet.google.com/advanced-calculus',
    status: 'upcoming',
    is_featured: true,
    enrollment_count: 23,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Differential Equations Workshop',
    description: 'Hands-on workshop on solving differential equations',
    instructor: 'Prof. David Kim',
    category: 'Mathematics',
    level: 'Intermediate',
    scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    maxStudents: 30,
    meetingLink: 'https://meet.google.com/diff-eq-workshop',
    status: 'upcoming',
    is_featured: false,
    enrollment_count: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Direct fallback routes for serverless mode to ensure mobile API works
app.get(`${API_PREFIX}/mobile/books`, (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'published' } = req.query;
    
    // Filter books by status for students
    const filteredBooks = FALLBACK_BOOKS.filter(book => 
      status === 'all' || book.status === status
    );
    
    res.json({
      success: true,
      data: filteredBooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredBooks.length,
        totalPages: Math.ceil(filteredBooks.length / parseInt(limit))
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/mobile/courses`, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    res.json({
      success: true,
      data: FALLBACK_COURSES,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: FALLBACK_COURSES.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/mobile/live-classes`, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    res.json({
      success: true,
      data: FALLBACK_LIVE_CLASSES,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: FALLBACK_LIVE_CLASSES.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/mobile/books/:id`, (req, res) => {
  try {
    const { id } = req.params;
    const book = FALLBACK_BOOKS.find(b => b._id === id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: book,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/mobile/featured`, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        books: FALLBACK_BOOKS.filter(book => book.is_featured),
        courses: FALLBACK_COURSES.filter(course => course.is_featured),
        liveClasses: FALLBACK_LIVE_CLASSES.filter(liveClass => liveClass.is_featured)
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content',
      timestamp: new Date().toISOString()
    });
  }
});

// Mobile API root endpoint
app.get(`${API_PREFIX}/mobile`, (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      books: `${API_PREFIX}/mobile/books`,
      courses: `${API_PREFIX}/mobile/courses`,
      liveClasses: `${API_PREFIX}/mobile/live-classes`,
      featured: `${API_PREFIX}/mobile/featured`
    }
  });
});

// Admin API info endpoint (no auth required)
app.get(`${API_PREFIX}/admin/info`, (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico Admin API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    authentication: {
      required: true,
      method: 'JWT Bearer Token',
      loginEndpoint: `${API_PREFIX}/auth/login`,
      description: 'Use admin credentials to get access token'
    },
    endpoints: {
      dashboard: `${API_PREFIX}/admin/dashboard`,
      users: `${API_PREFIX}/admin/users`,
      books: `${API_PREFIX}/admin/books`,
      courses: `${API_PREFIX}/admin/courses`,
      liveClasses: `${API_PREFIX}/admin/live-classes`,
      payments: `${API_PREFIX}/admin/payments`
    },
    instructions: {
      step1: `Login at ${API_PREFIX}/auth/login with admin credentials`,
      step2: 'Use the returned accessToken in Authorization header',
      step3: 'Access protected endpoints with Bearer token'
    }
  });
});

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
    console.log('\n🚀 ===== MATHEMATICO BACKEND STARTED =====');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    console.log(`🔗 API root: http://localhost:${PORT}/api/v1`);
    const connectionStatus = getConnectionStatus();
    console.log(`🗄️  Database: ${connectionStatus.isConnected ? 'Connected' : 'Disconnected'}`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`☁️  Serverless: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);
    console.log('==========================================\n');
  });
}
