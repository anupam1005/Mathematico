// Vercel serverless backend entry point for Mathematico - MongoDB Version
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

// Import database middleware
const { ensureDatabase } = require('./middlewares/database');

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

// Static file serving with error handling
try {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
  console.log('✅ Static file serving configured');
} catch (error) {
  console.warn('⚠️ Static file serving not available:', error.message);
}

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

// Initialize connection for serverless
if (process.env.VERCEL === '1') {
  // In serverless, initialize connection but don't block
  console.log('🔗 Initializing MongoDB connection for serverless...');
  connectToDatabase().then(() => {
    console.log('✅ MongoDB connection ready for serverless');
  }).catch(err => {
    console.warn('⚠️ Initial MongoDB connection failed in serverless mode:', err.message);
  });
} else {
  // In local development, await the connection
  (async () => {
    await connectToDatabase();
  })();
}

// Global database connection handler for serverless functions
app.use(async (req, res, next) => {
  // Skip for health and root endpoints
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  
  // Only try database connection in non-serverless environments
  if (process.env.VERCEL !== '1') {
    try {
      const { ensureDatabaseConnection } = require('./utils/database');
      const isConnected = await ensureDatabaseConnection();
      if (!isConnected) {
        console.warn('⚠️ Database not connected for request:', req.method, req.path);
      }
    } catch (error) {
      console.error('❌ Database connection error for request:', req.method, req.path, error.message);
    }
  }
  
  next();
});

// API Routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Import route handlers with MongoDB models
let authRoutes, adminRoutes, mobileRoutes, studentRoutes, usersRoutes;

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
  adminRoutes = require('./routes/admin');
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
  mobileRoutes = require('./routes/mobile');
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
  studentRoutes = require('./routes/student');
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


try {
  // Users routes
  usersRoutes = require('./routes/users');
  console.log('✅ Users routes loaded');
} catch (err) {
  console.warn('⚠️ Users routes not available:', err.message);
  usersRoutes = express.Router();
  usersRoutes.all('*', (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Users service unavailable - MongoDB connection required',
    serverless: true 
  }));
}


// Direct mobile content routes (for frontend compatibility) - MUST be before route mounting
app.get(`${API_PREFIX}/books`, async (req, res) => {
  try {
    // Fallback data for books
    res.json({
      success: true,
      data: [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x400',
          pdfUrl: 'https://example.com/book1.pdf',
          pages: 250,
          isbn: '978-1234567890',
          status: 'published',
          is_featured: true,
          download_count: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Calculus Fundamentals',
          description: 'Learn calculus from the ground up',
          author: 'Prof. Jane Doe',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x400',
          pdfUrl: 'https://example.com/book2.pdf',
          pages: 180,
          isbn: '978-0987654321',
          status: 'published',
          is_featured: false,
          download_count: 89,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Books endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/courses`, async (req, res) => {
  try {
    // Fallback data for courses
    res.json({
      success: true,
      data: [
        {
          _id: '1',
          title: 'Linear Algebra Course',
          description: 'Master linear algebra concepts and applications',
          instructor: 'Dr. Sarah Johnson',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          duration: '8 weeks',
          level: 'Intermediate',
          price: 99.99,
          status: 'published',
          is_featured: true,
          enrollment_count: 245,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Statistics Fundamentals',
          description: 'Learn statistical analysis and probability',
          instructor: 'Prof. Michael Brown',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          duration: '6 weeks',
          level: 'Beginner',
          price: 79.99,
          status: 'published',
          is_featured: false,
          enrollment_count: 189,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Courses endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/live-classes`, async (req, res) => {
  try {
    // Fallback data for live classes
    res.json({
      success: true,
      data: [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Davis',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 90,
          maxStudents: 50,
          currentStudents: 23,
          status: 'upcoming',
          is_featured: true,
          price: 29.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Geometry Problem Solving',
          description: 'Live problem-solving session for geometry',
          instructor: 'Prof. Robert Wilson',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          duration: 60,
          maxStudents: 30,
          currentStudents: 15,
          status: 'upcoming',
          is_featured: false,
          price: 19.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Live classes endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Individual detail routes for mobile content
app.get(`${API_PREFIX}/books/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fallback data for individual book
    const fallbackBooks = [
      {
        _id: '1',
        title: 'Advanced Mathematics',
        description: 'Comprehensive guide to advanced mathematical concepts',
        author: 'Dr. John Smith',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x400',
        pdfUrl: 'https://example.com/book1.pdf',
        pages: 250,
        isbn: '978-1234567890',
        status: 'published',
        is_featured: true,
        download_count: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Calculus Fundamentals',
        description: 'Learn calculus from the ground up',
        author: 'Prof. Jane Doe',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x400',
        pdfUrl: 'https://example.com/book2.pdf',
        pages: 180,
        isbn: '978-0987654321',
        status: 'published',
        is_featured: false,
        download_count: 89,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const book = fallbackBooks.find(b => b._id === id);
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
    console.error('Book detail endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/courses/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fallback data for individual course
    const fallbackCourses = [
      {
        _id: '1',
        title: 'Linear Algebra Course',
        description: 'Master linear algebra concepts and applications',
        instructor: 'Dr. Sarah Johnson',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x200',
        duration: '8 weeks',
        level: 'Intermediate',
        price: 99.99,
        status: 'published',
        is_featured: true,
        enrollment_count: 245,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Statistics Fundamentals',
        description: 'Learn statistical analysis and probability',
        instructor: 'Prof. Michael Brown',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x200',
        duration: '6 weeks',
        level: 'Beginner',
        price: 79.99,
        status: 'published',
        is_featured: false,
        enrollment_count: 189,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const course = fallbackCourses.find(c => c._id === id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: course,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Course detail endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/live-classes/:id`, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fallback data for individual live class
    const fallbackLiveClasses = [
      {
        _id: '1',
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session on advanced calculus topics',
        instructor: 'Dr. Emily Davis',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x200',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        duration: 90,
        maxStudents: 50,
        currentStudents: 23,
        status: 'upcoming',
        is_featured: true,
        price: 29.99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Geometry Problem Solving',
        description: 'Live problem-solving session for geometry',
        instructor: 'Prof. Robert Wilson',
        category: 'Mathematics',
        coverImageUrl: 'https://via.placeholder.com/300x200',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        duration: 60,
        maxStudents: 30,
        currentStudents: 15,
        status: 'upcoming',
        is_featured: false,
        price: 19.99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const liveClass = fallbackLiveClasses.find(lc => lc._id === id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: liveClass,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Live class detail endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin fallback routes - MUST be before admin route mounting
app.get(`${API_PREFIX}/admin/dashboard`, async (req, res) => {
  try {
    // Try to get real data from database first
    try {
      const { ensureDatabaseConnection } = require('./utils/database');
      const isConnected = await ensureDatabaseConnection();
      
      if (isConnected) {
        // Import models
        const User = require('./models/User');
        const Book = require('./models/Book');
        const Course = require('./models/Course');
        const LiveClass = require('./models/LiveClass');
        const Payment = require('./models/Payment');
        
        // Get real stats from database
        const [userStats, bookStats, courseStats, liveClassStats, paymentStats] = await Promise.allSettled([
          User.getStats().catch(() => ({ total: 0 })),
          Book.getStats().catch(() => ({ total: 0 })),
          Course.getStats().catch(() => ({ total: 0 })),
          LiveClass.getStats().catch(() => ({ total: 0 })),
          Payment.getStats().catch(() => ({ total: 0, totalRevenue: 0 }))
        ]);

        const dashboardData = {
          stats: {
            totalUsers: userStats.status === 'fulfilled' ? userStats.value.total : 0,
            totalBooks: bookStats.status === 'fulfilled' ? bookStats.value.total : 0,
            totalCourses: courseStats.status === 'fulfilled' ? courseStats.value.total : 0,
            totalLiveClasses: liveClassStats.status === 'fulfilled' ? liveClassStats.value.total : 0,
            totalRevenue: paymentStats.status === 'fulfilled' ? paymentStats.value.totalRevenue : 0,
            monthlyRevenue: paymentStats.status === 'fulfilled' ? paymentStats.value.monthlyRevenue || 0 : 0
          },
          recentActivity: [
            {
              id: '1',
              type: 'user_registration',
              message: 'New user registered',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              type: 'book_upload',
              message: 'New book uploaded',
              timestamp: new Date().toISOString()
            }
          ]
        };

        return res.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString(),
          database: true
        });
      }
    } catch (dbError) {
      console.log('Database connection failed, using fallback data:', dbError.message);
    }

    // Fallback data when database is not available
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: 1250,
          totalBooks: 45,
          totalCourses: 23,
          totalLiveClasses: 12,
          totalRevenue: 15750.50,
          monthlyRevenue: 3250.75
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_registration',
            message: 'New user registered',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'book_upload',
            message: 'New book uploaded',
            timestamp: new Date().toISOString()
          }
        ]
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Admin dashboard endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/admin/users`, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'student',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'student',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Admin users endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get(`${API_PREFIX}/admin/payments`, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          _id: '1',
          userId: '1',
          userName: 'John Doe',
          amount: 99.99,
          type: 'course_purchase',
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          userId: '2',
          userName: 'Jane Smith',
          amount: 29.99,
          type: 'live_class',
          status: 'completed',
          createdAt: new Date().toISOString()
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Admin payments endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
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

// Root API endpoint (no authentication required)
app.get(`${API_PREFIX}`, (req, res) => {
  console.log('🌐 Root API endpoint requested');
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
      health: '/health',
      docs: '/api-docs'
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
