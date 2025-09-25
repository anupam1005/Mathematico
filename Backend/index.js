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
const { Book, Course, LiveClass, User, testConnection, createUsersTable, createBooksTable, createCoursesTable, createLiveClassesTable } = require("./database");
const { logger, httpLogger, error, warn, info, debug } = require("./utils/logger");
const { swaggerUi, specs, swaggerOptions } = require("./config/swagger");

const app = express();

// Security middleware
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
  crossOriginEmbedderPolicy: false, // Allow cross-origin requests
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || "*", 
  credentials: true 
}));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.status(200).sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Add HTTP request logging
app.use(httpLogger);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later."
  }
});

// Configure multer for file uploads
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

// Initialize database on startup
async function initializeDatabase() {
  try {
    info('🔄 Initializing database...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      info('📊 Creating database tables...');
      await createUsersTable();
      await createBooksTable();
      await createCoursesTable();
      await createLiveClassesTable();
      info('✅ Database initialization complete');
    } else {
      warn('⚠️ Database connection failed, using fallback mode');
    }
  } catch (error) {
    error('❌ Database initialization error:', { error: error.message, stack: error.stack });
  }
}

// Initialize database
initializeDatabase();

// Log server startup
info('🚀 Mathematico Backend Server starting...', {
  nodeEnv: process.env.NODE_ENV || 'development',
  version: '2.0.0',
  port: process.env.PORT || 5000
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// ----------------- Root & Health -----------------
/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: API root endpoint
 *     description: Basic API information and status
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API is running ✅",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    serverless: true,
    documentation: {
      swagger: "/api-docs",
      json: "/api-docs.json"
    },
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth/*",
      admin: "/api/v1/admin/*",
      mobile: "/api/v1/mobile/*"
    }
  });
});

app.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Mathematico Backend API v1 is running ✅",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    serverless: true,
  });
});

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                           description: Server uptime in seconds
 *                         environment:
 *                           type: string
 *                           description: Current environment
 *                         version:
 *                           type: string
 *                           description: API version
 *                         services:
 *                           type: object
 *                           properties:
 *                             database:
 *                               type: object
 *                               properties:
 *                                 status:
 *                                   type: string
 *                                   enum: [healthy, unhealthy, error]
 *                                 responseTime:
 *                                   type: string
 *                             memory:
 *                               type: object
 *                               properties:
 *                                 used:
 *                                   type: number
 *                                 total:
 *                                   type: number
 *                                 unit:
 *                                   type: string
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/v1/health", async (req, res) => {
  const healthCheck = {
    success: true,
    message: "Mathematico Backend API is healthy ✅",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    services: {
      database: { status: 'unknown', responseTime: null },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: process.platform !== 'win32' ? os.loadavg() : null
      }
    }
  };

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

  // Log health check
  if (healthCheck.success) {
    info('Health check passed', { 
      uptime: healthCheck.uptime,
      memory: healthCheck.services.memory.used,
      dbStatus: healthCheck.services.database.status 
    });
  } else {
    warn('Health check failed', { 
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

// ----------------- AUTH ROUTES -----------------
/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication endpoints
 *   - name: System
 *     description: System health and monitoring
 *   - name: Admin - Books
 *     description: Admin book management (requires authentication)
 *   - name: Admin - Courses  
 *     description: Admin course management (requires authentication)
 *   - name: Admin - Live Classes
 *     description: Admin live class management (requires authentication)
 *   - name: Admin - Users
 *     description: Admin user management (requires authentication)
 *   - name: Mobile
 *     description: Mobile app endpoints
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "dc2006089@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Myname*321"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         tokens:
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                               description: JWT access token
 *                             refreshToken:
 *                               type: string
 *                               description: JWT refresh token
 *                             expiresIn:
 *                               type: number
 *                               description: Token expiration time in seconds
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// Refresh token endpoint
app.post("/api/v1/auth/refresh", (req, res) => {
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

// ----------------- MOBILE ROUTES -----------------
app.get("/api/v1/mobile/courses", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Mathematics",
        description: "Comprehensive course covering advanced mathematical concepts",
        instructor: "Dr. John Smith",
        price: 99.99,
        duration: "12 weeks",
        level: "Advanced",
        category: "Mathematics",
        thumbnail: "/placeholder.svg",
        rating: 4.8,
        studentsCount: 150,
        status: "published",
        isEnrolled: false,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Calculus Fundamentals",
        description: "Learn the basics of calculus from scratch",
        instructor: "Prof. Jane Doe",
        price: 79.99,
        duration: "8 weeks",
        level: "Beginner",
        category: "Mathematics",
        thumbnail: "/placeholder.svg",
        rating: 4.6,
        studentsCount: 200,
        status: "published",
        isEnrolled: true,
        progress: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/mobile/books", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Calculus Textbook",
        author: "Dr. John Smith",
        description: "Comprehensive textbook covering advanced calculus topics",
        category: "Mathematics",
        level: "Advanced",
        pages: 450,
        isbn: "978-1234567890",
        cover_image_url: "/placeholder.svg",
        pdf_url: "/uploads/advanced-calculus.pdf",
        status: "active",
        is_published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Linear Algebra Fundamentals",
        author: "Prof. Jane Doe",
        description: "Essential guide to linear algebra concepts and applications",
        category: "Mathematics",
        level: "Intermediate",
        pages: 320,
        isbn: "978-0987654321",
        cover_image_url: "/placeholder.svg",
        pdf_url: "/uploads/linear-algebra.pdf",
        status: "active",
        is_published: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/mobile/live-classes", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "Advanced Calculus Live Session",
        description: "Interactive live session covering advanced calculus topics",
        instructor: "Dr. John Smith",
        category: "Mathematics",
        level: "Advanced",
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        max_students: 50,
        current_students: 25,
        price: 29.99,
        status: "scheduled",
        is_published: true,
        meeting_link: "https://meet.google.com/abc-defg-hij",
        thumbnail: "/placeholder.svg",
        isEnrolled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    },
    timestamp: new Date().toISOString()
  });
});

// Mobile course enrollment
app.post("/api/v1/mobile/courses/:id/enroll", (req, res) => {
  try {
    const courseId = req.params.id;
    const { paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        courseId: parseInt(courseId),
        amount: amount || 99.99,
        status: 'completed',
        enrolledAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Course enrolled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mobile book purchase
app.post("/api/v1/mobile/books/:id/purchase", (req, res) => {
  try {
    const bookId = req.params.id;
    const { paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        bookId: parseInt(bookId),
        amount: amount || 49.99,
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Book purchased successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error purchasing book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mobile live class enrollment
app.post("/api/v1/mobile/live-classes/:id/enroll", (req, res) => {
  try {
    const classId = req.params.id;
    const { paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        liveClassId: parseInt(classId),
        amount: amount || 29.99,
        status: 'completed',
        enrolledAt: new Date().toISOString(),
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      },
      message: 'Live class enrolled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error enrolling in live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ----------------- ADMIN ROUTES (Protected with JWT) -----------------
app.get("/api/v1/admin/dashboard", authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      totalCourses: 25,
      totalBooks: 40,
      totalLiveClasses: 12,
      totalRevenue: 125000,
    },
  });
});

// Books - Protected routes
/**
 * @swagger
 * /api/v1/admin/books:
 *   get:
 *     tags: [Admin - Books]
 *     summary: Get all books (Admin only)
 *     description: Retrieve paginated list of books with optional filtering
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, author, or description
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/v1/admin/books", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const result = await Book.getAll(parseInt(page), parseInt(limit), category, search);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch books"
    });
  }
});

app.post("/api/v1/admin/books", authenticateToken, requireAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, author, description, category, pages, isbn, status } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: "Title and author are required"
      });
    }

    const bookData = {
      title,
      author,
      description: description || "",
      category: category || "Mathematics",
      pages: parseInt(pages) || 0,
      isbn: isbn || "",
      status: status || "draft",
      is_published: false,
      cover_image_url: req.files?.coverImage ? `/uploads/covers/${req.files.coverImage[0].filename}` : null,
      pdf_url: req.files?.pdfFile ? `/uploads/pdfs/${req.files.pdfFile[0].filename}` : null
    };

    const createdBook = await Book.create(bookData);

    res.json({
      success: true,
      message: "Book created successfully",
      data: createdBook
    });
  } catch (error) {
    console.error("Book creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create book"
    });
  }
});

app.put("/api/v1/admin/books/:id", authenticateToken, requireAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, category, pages, isbn, status } = req.body;
    
    const bookData = {
      title: title || "Updated Book",
      author: author || "Unknown Author",
      description: description || "",
      category: category || "Mathematics",
      pages: parseInt(pages) || 0,
      isbn: isbn || "",
      status: status || "draft",
      is_published: false
    };

    // Only update file URLs if new files are uploaded
    if (req.files?.coverImage) {
      bookData.cover_image_url = `/uploads/covers/${req.files.coverImage[0].filename}`;
    }
    if (req.files?.pdfFile) {
      bookData.pdf_url = `/uploads/pdfs/${req.files.pdfFile[0].filename}`;
    }

    const updatedBook = await Book.update(id, bookData);

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook
    });
  } catch (error) {
    console.error("Book update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update book"
    });
  }
});

app.delete("/api/v1/admin/books/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBook = await Book.delete(id);
    
    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: `Book ${id} deleted successfully`,
      data: deletedBook
    });
  } catch (error) {
    console.error("Book deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete book"
    });
  }
});

// Add missing book status update route
app.put("/api/v1/admin/books/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate status values
    const validStatuses = ['draft', 'active', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedBook = await Book.update(id, { status });

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: `Book ${id} status updated to ${status}`,
      data: updatedBook
    });
  } catch (error) {
    console.error("Book status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update book status"
    });
  }
});

// Courses - Protected routes
app.get("/api/v1/admin/courses", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const result = await Course.getAll(parseInt(page), parseInt(limit), category, search);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses"
    });
  }
});

app.post("/api/v1/admin/courses", authenticateToken, requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, category, level, price, originalPrice, students, status } = req.body;
    
    if (!title || !price) {
      return res.status(400).json({
        success: false,
        message: "Title and price are required"
      });
    }

    const courseData = {
      title,
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      price: parseFloat(price) || 0,
      original_price: parseFloat(originalPrice) || parseFloat(price) || 0,
      students: parseInt(students) || 0,
      status: status || "draft",
      is_published: false,
      image_url: req.files?.image ? `/uploads/covers/${req.files.image[0].filename}` : null,
      pdf_url: req.files?.pdf ? `/uploads/pdfs/${req.files.pdf[0].filename}` : null
    };

    const createdCourse = await Course.create(courseData);

    res.json({
      success: true,
      message: "Course created successfully",
      data: createdCourse
    });
  } catch (error) {
    console.error("Course creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create course"
    });
  }
});

app.put("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, level, price, originalPrice, students, status } = req.body;
    
    const courseData = {
      title: title || "Updated Course",
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      price: parseFloat(price) || 0,
      original_price: parseFloat(originalPrice) || parseFloat(price) || 0,
      students: parseInt(students) || 0,
      status: status || "draft",
      is_published: false
    };

    if (req.files?.image) {
      courseData.image_url = `/uploads/covers/${req.files.image[0].filename}`;
    }
    if (req.files?.pdf) {
      courseData.pdf_url = `/uploads/pdfs/${req.files.pdf[0].filename}`;
    }

    const updatedCourse = await Course.update(id, courseData);

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse
    });
  } catch (error) {
    console.error("Course update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update course"
    });
  }
});

app.delete("/api/v1/admin/courses/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCourse = await Course.delete(id);
    
    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      message: `Course ${id} deleted successfully`,
      data: deletedCourse
    });
  } catch (error) {
    console.error("Course deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course"
    });
  }
});

// Add missing course status update route
app.put("/api/v1/admin/courses/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate status values
    const validStatuses = ['draft', 'active', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedCourse = await Course.update(id, { status });

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({
      success: true,
      message: `Course ${id} status updated to ${status}`,
      data: updatedCourse
    });
  } catch (error) {
    console.error("Course status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update course status"
    });
  }
});

// Live Classes - Protected routes with meeting_link support
app.get("/api/v1/admin/live-classes", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const result = await LiveClass.getAll(parseInt(page), parseInt(limit), category, search);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get live classes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live classes"
    });
  }
});

app.post("/api/v1/admin/live-classes", authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, level, duration, maxStudents, scheduledAt, meetingLink, status } = req.body;
    
    if (!title || !meetingLink || !duration || !maxStudents) {
      return res.status(400).json({
        success: false,
        message: "Title, meeting link, duration, and max students are required"
      });
    }

    // Validate scheduledAt is in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future"
      });
    }

    const liveClassData = {
      title,
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      scheduled_at: scheduledAt,
      duration: parseInt(duration) || 60,
      max_students: parseInt(maxStudents) || 50,
      meeting_link: meetingLink,
      status: status || "draft",
      is_published: false,
      image_url: req.file ? `/uploads/covers/${req.file.filename}` : null
    };

    const createdLiveClass = await LiveClass.create(liveClassData);

    res.json({
      success: true,
      message: "Live class created successfully",
      data: createdLiveClass
    });
  } catch (error) {
    console.error("Live class creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create live class"
    });
  }
});

app.put("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, level, duration, maxStudents, scheduledAt, meetingLink, status } = req.body;
    
    const liveClassData = {
      title: title || "Updated Live Class",
      description: description || "",
      category: category || "Mathematics",
      level: level || "Foundation",
      scheduled_at: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: parseInt(duration) || 60,
      max_students: parseInt(maxStudents) || 50,
      meeting_link: meetingLink || "https://meet.google.com/abc-defg-hij",
      status: status || "draft",
      is_published: false
    };

    if (req.file) {
      liveClassData.image_url = `/uploads/covers/${req.file.filename}`;
    }

    const updatedLiveClass = await LiveClass.update(id, liveClassData);

    if (!updatedLiveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found"
      });
    }

    res.json({
      success: true,
      message: "Live class updated successfully",
      data: updatedLiveClass
    });
  } catch (error) {
    console.error("Live class update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update live class"
    });
  }
});

app.delete("/api/v1/admin/live-classes/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLiveClass = await LiveClass.delete(id);
    
    if (!deletedLiveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found"
      });
    }

    res.json({
      success: true,
      message: `Live class ${id} deleted successfully`,
      data: deletedLiveClass
    });
  } catch (error) {
    console.error("Live class deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete live class"
    });
  }
});

// Add missing live class status update route
app.put("/api/v1/admin/live-classes/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Validate status values
    const validStatuses = ['draft', 'scheduled', 'live', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedLiveClass = await LiveClass.updateStatus(id, status);

    if (!updatedLiveClass) {
      return res.status(404).json({
        success: false,
        message: "Live class not found"
      });
    }

    res.json({
      success: true,
      message: `Live class ${id} status updated to ${status}`,
      data: updatedLiveClass
    });
  } catch (error) {
    console.error("Live class status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update live class status"
    });
  }
});

// Users - Protected routes with full CRUD
app.get("/api/v1/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const result = await User.getAll(parseInt(page), parseInt(limit), role, search);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

app.post("/api/v1/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, is_active } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required"
      });
    }

    const userData = {
      id: Date.now().toString(),
      name,
      email,
      role: role || "user",
      is_active: is_active !== false,
      email_verified: false
    };

    const createdUser = await User.create(userData);

    res.json({
      success: true,
      message: "User created successfully",
      data: createdUser
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
});

app.put("/api/v1/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;
    
    const userData = {
      name: name || "Updated User",
      email: email || "user@example.com",
      role: role || "user",
      is_active: is_active !== false
    };

    const updatedUser = await User.update(id, userData);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser
    });
  } catch (error) {
    console.error("User update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user"
    });
  }
});

app.delete("/api/v1/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.delete(id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: `User ${id} deleted successfully`,
      data: deletedUser
    });
  } catch (error) {
    console.error("User deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user"
    });
  }
});

app.put("/api/v1/admin/users/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const updatedUser = await User.updateStatus(id, is_active);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: `User ${id} status updated to ${is_active ? 'active' : 'inactive'}`,
      data: updatedUser
    });
  } catch (error) {
    console.error("User status update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status"
    });
  }
});

// File upload endpoint for admin
app.post("/api/v1/admin/upload", authenticateToken, requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const fileUrl = `/uploads/${req.file.destination.split('/').pop()}/${req.file.filename}`;
    
    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload file"
    });
  }
});

// ----------------- 404 + Error Handler -----------------
app.use("*", (req, res) => {
  warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  error("🔥 Global error:", { 
    error: err.message, 
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app;
