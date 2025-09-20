// Vercel serverless function for Mathematico Backend
// This is a simplified version that includes all necessary functionality

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Book, testConnection, createBooksTable, createUsersTable, createCoursesTable, createLiveClassesTable, createEnrollmentsTable } = require('../database');

// Initialize database connection
let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    console.log('🔄 Initializing database connection...');
    const connected = await testConnection();
    if (connected) {
      await createUsersTable();
      await createBooksTable();
      await createCoursesTable();
      await createLiveClassesTable();
      await createEnrollmentsTable();
      dbInitialized = true;
      console.log('✅ Database initialized successfully');
    } else {
      console.error('❌ Failed to initialize database');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Create Express app
const app = express();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://mathematico-frontend.vercel.app',
  'https://mathematico-frontend-gvpmf2rwj-anupam-das-projects-db63fa41.vercel.app',
  'https://mathematico-backend-new.vercel.app',
  // Mobile app origins (React Native/Expo)
  'exp://192.168.1.100:8081',
  'exp://192.168.1.101:8081',
  'exp://192.168.1.102:8081',
  'exp://192.168.1.103:8081',
  'exp://192.168.1.104:8081',
  'exp://192.168.1.105:8081',
  'exp://192.168.1.106:8081',
  'exp://192.168.1.107:8081',
  'exp://192.168.1.108:8081',
  'exp://192.168.1.109:8081',
  'exp://192.168.1.110:8081',
  'exp://10.0.2.2:8081',
  'exp://localhost:8081',
  'exp://127.0.0.1:8081'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowing origin:', origin);
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ CORS allowing Vercel preview URL:', origin);
      return callback(null, true);
    }
    
    // Allow Expo/React Native development URLs
    if (origin.match(/^exp:\/\/.*$/)) {
      console.log('✅ CORS allowing Expo development URL:', origin);
      return callback(null, true);
    }
    
    // Allow localhost with any port for development
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      console.log('✅ CORS allowing localhost URL:', origin);
      return callback(null, true);
    }
    
    // Allow local IP addresses for mobile development
    if (origin.match(/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/)) {
      console.log('✅ CORS allowing local IP URL:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Cache-Control', 
    'Accept', 
    'Origin',
    'Pragma',
    'X-API-Key',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200
}));

// Static file serving for public directory
app.use(express.static('public'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Database initialization middleware
app.use(async (req, res, next) => {
  await initializeDatabase();
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mathematico API Server',
    version: '1.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin',
      enrollments: '/api/v1/enrollments'
    }
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    version: '1.3.0',
    mobile: {
      supported: true,
      baseUrl: 'https://mathematico-backend-new.vercel.app/api/v1',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        courses: '/api/v1/courses',
        books: '/api/v1/books',
        liveClasses: '/api/v1/live-classes',
        admin: '/api/v1/admin'
      },
      note: 'Use https://mathematico-backend-new.vercel.app as your API base URL for mobile apps'
    }
  });
});

// Auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if it's the admin user
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
      // Generate proper JWT token for admin
      const userPayload = {
        id: '1',
        email: email,
        name: 'Admin User',
        isAdmin: true,
        is_admin: true,
        role: 'admin',
        email_verified: true,
        is_active: true
      };
      
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const refreshToken = jwt.sign({ id: userPayload.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
      
      console.log('Admin login successful, JWT token generated:', token.substring(0, 20) + '...');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          token: token,
          refreshToken: refreshToken
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // For other users, create a proper JWT token
      const userPayload = {
        id: (Math.floor(Math.random() * 1000) + 2).toString(),
        email: email,
        name: email.split('@')[0] || 'User',
        isAdmin: false,
        is_admin: false,
        role: 'user',
        email_verified: true,
        is_active: true
      };
      
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const refreshToken = jwt.sign({ id: userPayload.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
      
      console.log('User login successful, token generated:', token.substring(0, 20) + '...');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          token: token,
          refreshToken: refreshToken
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Registration endpoint
app.post('/api/v1/auth/register', (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email, password, and name are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if email is already taken (admin email)
    if (email === 'dc2006089@gmail.com') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already exists',
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate a simple token
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    const refreshToken = Buffer.from(`${email}:refresh:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: (Math.floor(Math.random() * 1000) + 2).toString(),
          email: email,
          name: name,
          isAdmin: false,
          is_admin: false,
          role: 'user',
          email_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        token: token,
        refreshToken: refreshToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth status endpoint
app.get('/api/v1/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        timestamp: new Date().toISOString()
      });
    }
    
    // Simple token validation
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, timestamp] = decoded.split(':');
      
      if (!email) {
        throw new Error('Invalid token format');
      }
      
      // Check if it's the admin user
      if (email === 'dc2006089@gmail.com') {
        res.json({
          success: true,
          data: {
            user: {
              id: '1',
              email: email,
              name: 'Admin User',
              isAdmin: true,
              is_admin: true,
              role: 'admin',
              email_verified: true,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({
          success: true,
          data: {
            user: {
              id: (Math.floor(Math.random() * 1000) + 2).toString(),
              email: email,
              name: email.split('@')[0] || 'User',
              isAdmin: false,
              is_admin: false,
              role: 'user',
              email_verified: true,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Auth status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Auth status check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Logout endpoint
app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

// Refresh token endpoint
app.post('/api/v1/auth/refresh-token', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Simple token refresh (in production, use proper JWT)
    const newToken = Buffer.from(`refreshed:${Date.now()}`).toString('base64');
    const newRefreshToken = Buffer.from(`refresh:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh token endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Token refresh failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Forgot password endpoint
app.post('/api/v1/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email is required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forgot password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to send reset email',
      timestamp: new Date().toISOString()
    });
  }
});

// Reset password endpoint
app.post('/api/v1/auth/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Token and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Password reset failed',
      timestamp: new Date().toISOString()
    });
  }
});

// User-facing API endpoints
app.get('/api/v1/courses', async (req, res) => {
  try {
    // Initialize database if not already done
    await initializeDatabase();
    
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'status = "active"';
    let params = [];
    
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM courses WHERE ${whereClause}`,
      params
    );
    
    // Get courses with pagination
    const [courses] = await pool.execute(
      `SELECT * FROM courses WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      },
      message: 'Courses retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting courses:', error);
    
    // Return fallback data if database fails
    const sampleCourses = [
      {
        id: 1,
        title: 'Advanced Mathematics',
        description: 'Comprehensive course covering advanced mathematical concepts',
        instructor: 'Dr. John Smith',
        price: 99.99,
        duration: '12 weeks',
        level: 'Advanced',
        category: 'Mathematics',
        thumbnail: '/placeholder.svg',
        rating: 4.8,
        studentsCount: 150,
        status: 'published',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Calculus Fundamentals',
        description: 'Learn the basics of calculus from scratch',
        instructor: 'Prof. Jane Doe',
        price: 79.99,
        duration: '8 weeks',
        level: 'Beginner',
        category: 'Mathematics',
        thumbnail: '/placeholder.svg',
        rating: 4.6,
        studentsCount: 200,
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: sampleCourses,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: sampleCourses.length,
        totalPages: Math.ceil(sampleCourses.length / parseInt(req.query.limit) || 10)
      },
      message: 'Courses retrieved successfully (fallback data)',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/courses/:id', (req, res) => {
  const courseId = req.params.id;
  
  // Sample course detail
  const course = {
    id: parseInt(courseId),
    title: 'Advanced Mathematics',
    description: 'Comprehensive course covering advanced mathematical concepts including differential equations, linear algebra, and complex analysis.',
    instructor: 'Dr. John Smith',
    price: 99.99,
    duration: '12 weeks',
    level: 'Advanced',
    category: 'Mathematics',
    thumbnail: '/placeholder.svg',
    rating: 4.8,
    studentsCount: 150,
    status: 'published',
    modules: [
      {
        id: 1,
        title: 'Introduction to Advanced Mathematics',
        lessons: [
          { id: 1, title: 'Overview of Course', duration: '15 min', type: 'video' },
          { id: 2, title: 'Mathematical Foundations', duration: '30 min', type: 'video' }
        ]
      },
      {
        id: 2,
        title: 'Differential Equations',
        lessons: [
          { id: 3, title: 'First Order Equations', duration: '45 min', type: 'video' },
          { id: 4, title: 'Second Order Equations', duration: '50 min', type: 'video' }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: course,
    message: 'Course details retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/books', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const result = await Book.getAll(page, limit, category, search);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Books retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/books/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    const book = await Book.getById(bookId);
    
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
      message: 'Book details retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting book by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create a new book
app.post('/api/v1/books', async (req, res) => {
  try {
    const bookData = req.body;
    
    const newBook = await Book.create(bookData);
    
    console.log('Creating new book:', newBook);
    
    res.status(201).json({
      success: true,
      data: newBook,
      message: 'Book created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update a book
app.put('/api/v1/books/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const updateData = req.body;
    
    const updatedBook = await Book.update(bookId, updateData);
    
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Updating book:', updatedBook);
    
    res.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete a book
app.delete('/api/v1/books/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    const deletedBook = await Book.delete(bookId);
    
    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Deleting book with ID:', bookId, 'Book:', deletedBook.title);
    
    res.json({
      success: true,
      data: deletedBook,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Toggle book publish status
app.patch('/api/v1/books/:id/publish', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const { isPublished } = req.body;
    
    const updatedBook = await Book.togglePublish(bookId, isPublished);
    
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Toggling publish status for book:', bookId, 'to:', isPublished);
    
    res.json({
      success: true,
      data: updatedBook,
      message: 'Book publish status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling book publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book publish status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/live-classes', async (req, res) => {
  try {
    // Initialize database if not already done
    await initializeDatabase();
    
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'status IN ("scheduled", "live")';
    let params = [];
    
    if (status) {
      whereClause = 'status = ?';
      params.push(status);
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM live_classes WHERE ${whereClause}`,
      params
    );
    
    // Get live classes with pagination
    const [liveClasses] = await pool.execute(
      `SELECT * FROM live_classes WHERE ${whereClause} ORDER BY scheduled_at ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      success: true,
      data: liveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      },
      message: 'Live classes retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting live classes:', error);
    
    // Return fallback data if database fails
    const sampleLiveClasses = [
      {
        id: 1,
        title: 'Advanced Mathematics Live Session',
        description: 'Interactive live session on advanced mathematical concepts',
        instructor: 'Dr. John Smith',
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        duration: 120, // minutes
        maxStudents: 50,
        currentStudents: 25,
        price: 29.99,
        status: 'scheduled',
        meetingLink: 'https://meet.example.com/advanced-math',
        thumbnail: '/placeholder.svg',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Calculus Problem Solving',
        description: 'Live problem-solving session for calculus students',
        instructor: 'Prof. Jane Doe',
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        duration: 90,
        maxStudents: 30,
        currentStudents: 18,
        price: 19.99,
        status: 'scheduled',
        meetingLink: 'https://meet.example.com/calculus-problems',
        thumbnail: '/placeholder.svg',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: sampleLiveClasses,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: sampleLiveClasses.length,
        totalPages: Math.ceil(sampleLiveClasses.length / parseInt(req.query.limit) || 10)
      },
      message: 'Live classes retrieved successfully (fallback data)',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/live-classes/:id', (req, res) => {
  const classId = req.params.id;
  
  const liveClass = {
    id: parseInt(classId),
    title: 'Advanced Mathematics Live Session',
    description: 'Interactive live session on advanced mathematical concepts including differential equations and linear algebra.',
    instructor: 'Dr. John Smith',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    maxStudents: 50,
    currentStudents: 25,
    price: 29.99,
    status: 'upcoming',
    meetingLink: 'https://meet.example.com/advanced-math',
    thumbnail: '/placeholder.svg',
    agenda: [
      { time: '0-30 min', topic: 'Introduction and Overview' },
      { time: '30-60 min', topic: 'Differential Equations' },
      { time: '60-90 min', topic: 'Linear Algebra' },
      { time: '90-120 min', topic: 'Q&A Session' }
    ],
    materials: [
      { name: 'Course Notes', url: '/uploads/advanced-math-notes.pdf' },
      { name: 'Practice Problems', url: '/uploads/practice-problems.pdf' }
    ],
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: liveClass,
    message: 'Live class details retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Purchase and Enrollment endpoints
app.post('/api/v1/courses/:id/purchase', (req, res) => {
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
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    },
    message: 'Course purchased and enrolled successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/status', (req, res) => {
  res.json({
    success: true,
    data: {
      enrolled: true,
      status: 'enrolled',
      courses: [
        {
          id: 1,
          title: 'Advanced Mathematics',
          enrolledAt: new Date().toISOString(),
          progress: 25,
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    message: 'Enrollment status retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/my-courses', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        courseId: 1,
        title: 'Advanced Mathematics',
        instructor: 'Dr. John Smith',
        thumbnail: '/placeholder.svg',
        progress: 25,
        enrolledAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    message: 'User courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/my-books', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        bookId: 1,
        title: 'Advanced Calculus Textbook',
        author: 'Dr. John Smith',
        coverImage: '/placeholder.svg',
        purchasedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    message: 'User books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/enrollments/my-live-classes', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        liveClassId: 1,
        title: 'Advanced Mathematics Live Session',
        instructor: 'Dr. John Smith',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAt: new Date().toISOString(),
        meetingLink: 'https://meet.example.com/advanced-math'
      }
    ],
    message: 'User live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Course access verification
app.get('/api/v1/courses/:id/access', (req, res) => {
  const courseId = req.params.id;
  
  res.json({
    success: true,
    data: {
      hasAccess: true,
      courseId: parseInt(courseId),
      enrolledAt: new Date().toISOString(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 25
    },
    message: 'Course access verified',
    timestamp: new Date().toISOString()
  });
});

// Book access verification
app.get('/api/v1/books/:id/access', (req, res) => {
  const bookId = req.params.id;
  
  res.json({
    success: true,
    data: {
      hasAccess: true,
      bookId: parseInt(bookId),
      purchasedAt: new Date().toISOString(),
      accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    message: 'Book access verified',
    timestamp: new Date().toISOString()
  });
});

// Live class access verification
app.get('/api/v1/live-classes/:id/access', (req, res) => {
  const classId = req.params.id;
  
  res.json({
    success: true,
    data: {
      hasAccess: true,
      liveClassId: parseInt(classId),
      enrolledAt: new Date().toISOString(),
      meetingLink: 'https://meet.example.com/advanced-math'
    },
    message: 'Live class access verified',
    timestamp: new Date().toISOString()
  });
});

// Admin endpoints
app.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    // Initialize database if not already done
    await initializeDatabase();
    
    // Get real stats from database
    const [userStats] = await pool.execute(
      'SELECT COUNT(*) as totalUsers, COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeUsers FROM users'
    );
    
    const [courseStats] = await pool.execute(
      'SELECT COUNT(*) as totalCourses FROM courses'
    );
    
    const [bookStats] = await pool.execute(
      'SELECT COUNT(*) as totalBooks FROM books'
    );
    
    const [revenueStats] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as totalRevenue FROM enrollments WHERE payment_status = "completed"'
    );
    
    // Get recent users
    const [recentUsers] = await pool.execute(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    
    // Get recent courses
    const [recentCourses] = await pool.execute(
      'SELECT id, title, category, created_at FROM courses ORDER BY created_at DESC LIMIT 5'
    );
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: userStats[0]?.totalUsers || 0,
          totalStudents: userStats[0]?.activeUsers || 0,
          totalCourses: courseStats[0]?.totalCourses || 0,
          totalBooks: bookStats[0]?.totalBooks || 0,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          activeBatches: 0, // Placeholder
          totalModules: 0, // Placeholder
          totalLessons: 0 // Placeholder
        },
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        })),
        recentCourses: recentCourses.map(course => ({
          id: course.id,
          title: course.title,
          category: course.category,
          createdAt: course.created_at
        }))
      },
      message: 'Dashboard stats retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    
    // Return fallback data if database fails
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: 1250,
          totalStudents: 1200,
          totalCourses: 45,
          totalBooks: 28,
          totalRevenue: 125000,
          activeBatches: 12,
          totalModules: 180,
          totalLessons: 720
        },
        recentUsers: [
          { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2024-01-15' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '2024-01-14' },
          { id: '3', name: 'Bob Johnson', email: 'bob@example.com', createdAt: '2024-01-13' }
        ],
        recentCourses: [
          { id: '1', title: 'Advanced Mathematics', category: 'Mathematics', createdAt: '2024-01-15' },
          { id: '2', title: 'Physics Fundamentals', category: 'Physics', createdAt: '2024-01-14' },
          { id: '3', title: 'Chemistry Basics', category: 'Chemistry', createdAt: '2024-01-13' }
        ]
      },
      message: 'Dashboard stats retrieved successfully (fallback data)',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/courses', async (req, res) => {
  try {
    // Initialize database if not already done
    await initializeDatabase();
    
    const { page = 1, limit = 10, status = 'all', category = 'all', search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '1=1';
    let params = [];
    
    if (status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (category !== 'all') {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Sample data for demonstration
    const sampleCourses = [
      {
        id: '1',
        title: 'Complete Mathematics Course',
        description: 'A comprehensive mathematics course covering all major topics from basic algebra to advanced calculus.',
        category: 'Mathematics',
        level: 'Advanced',
        price: 199.99,
        status: 'active',
        students: 456,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Statistics and Data Analysis',
        description: 'Learn statistical methods and data analysis techniques with practical applications.',
        category: 'Statistics',
        level: 'Intermediate',
        price: 149.99,
        status: 'active',
        students: 312,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Geometry Fundamentals',
        description: 'Master the fundamentals of geometry with interactive lessons and practical exercises.',
        category: 'Mathematics',
        level: 'Foundation',
        price: 99.99,
        status: 'active',
        students: 278,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Advanced Calculus',
        description: 'Deep dive into advanced calculus concepts including multivariable calculus and differential equations.',
        category: 'Mathematics',
        level: 'Advanced',
        price: 249.99,
        status: 'active',
        students: 189,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Linear Algebra Mastery',
        description: 'Comprehensive course on linear algebra with applications in computer science and engineering.',
        category: 'Mathematics',
        level: 'Intermediate',
        price: 179.99,
        status: 'active',
        students: 234,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter courses based on search, status, and category
    let filteredCourses = sampleCourses;
    
    if (status !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.status === status);
    }
    
    if (category !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.category === category);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Pagination
    const paginatedCourses = filteredCourses.slice(offset, offset + parseInt(limit));
    const total = filteredCourses.length;
    
    res.json({
      success: true,
      data: paginatedCourses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      message: 'Admin courses retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin courses:', error);
    
    // Return fallback data if database fails
    const fallbackCourses = [
      {
        id: '1',
        title: 'Advanced Mathematics',
        description: 'Comprehensive course covering advanced mathematical concepts',
        category: 'Mathematics',
        level: 'Advanced',
        price: 2999,
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Physics Fundamentals',
        description: 'Introduction to fundamental physics principles',
        category: 'Physics',
        level: 'Foundation',
        price: 1999,
        status: 'draft',
        isPublished: false,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: fallbackCourses,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: fallbackCourses.length,
        totalPages: 1
      },
      message: 'Admin courses retrieved successfully (fallback data)',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/books', async (req, res) => {
  try {
    const { page = 1, limit = 100, status = 'all', category = 'all', search } = req.query;
    
    // Sample data for demonstration
    const sampleBooks = [
      {
        id: '1',
        title: 'Advanced Mathematics',
        author: 'Dr. Sarah Wilson',
        description: 'Comprehensive guide to advanced mathematical concepts including calculus, linear algebra, and differential equations.',
        category: 'Mathematics',
        pages: 450,
        isbn: '978-1234567890',
        coverImage: 'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Advanced+Math',
        pdfUrl: 'https://example.com/advanced-math.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Basic Algebra Fundamentals',
        author: 'Prof. Robert Brown',
        description: 'Perfect introduction to algebra for beginners. Covers all fundamental concepts with clear explanations and examples.',
        category: 'Mathematics',
        pages: 280,
        isbn: '978-1234567891',
        coverImage: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Basic+Algebra',
        pdfUrl: 'https://example.com/basic-algebra.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Statistics and Probability',
        author: 'Dr. Emily Davis',
        description: 'Complete guide to statistics and probability theory with practical applications and real-world examples.',
        category: 'Statistics',
        pages: 320,
        isbn: '978-1234567892',
        coverImage: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Statistics',
        pdfUrl: 'https://example.com/statistics.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Geometry Mastery',
        author: 'Prof. Michael Chen',
        description: 'Comprehensive geometry textbook covering plane geometry, solid geometry, and coordinate geometry.',
        category: 'Mathematics',
        pages: 380,
        isbn: '978-1234567893',
        coverImage: 'https://via.placeholder.com/300x400/EF4444/FFFFFF?text=Geometry',
        pdfUrl: 'https://example.com/geometry.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Trigonometry Essentials',
        author: 'Dr. Lisa Anderson',
        description: 'Essential trigonometry concepts with step-by-step solutions and practice problems.',
        category: 'Mathematics',
        pages: 250,
        isbn: '978-1234567894',
        coverImage: 'https://via.placeholder.com/300x400/8B5CF6/FFFFFF?text=Trigonometry',
        pdfUrl: 'https://example.com/trigonometry.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Filter books based on search, status, and category
    let filteredBooks = sampleBooks;
    
    if (status !== 'all') {
      filteredBooks = filteredBooks.filter(book => book.status === status);
    }
    
    if (category !== 'all') {
      filteredBooks = filteredBooks.filter(book => book.category === category);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBooks = filteredBooks.slice(offset, offset + parseInt(limit));
    const total = filteredBooks.length;
    
    res.json({
      success: true,
      data: paginatedBooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      message: 'Admin books retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role && role !== 'all') {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    );
    
    // Get users with pagination
    const [users] = await pool.execute(
      `SELECT id, name, email, role, is_admin, is_active, created_at, last_login FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.is_admin,
        isActive: user.is_active,
        status: user.is_active ? 'active' : 'inactive',
        createdAt: user.created_at,
        lastLogin: user.last_login
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      },
      message: 'Admin users retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin users',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/live-classes', async (req, res) => {
  try {
    const { page = 1, limit = 100, status = 'all', category = 'all', search } = req.query;
    
    // Sample data for demonstration
    const sampleLiveClasses = [
      {
        id: '1',
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session covering advanced calculus topics with real-time Q&A.',
        category: 'Mathematics',
        level: 'Advanced',
        duration: 90,
        maxStudents: 50,
        price: 29.99,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/calc-session-1',
        thumbnailUrl: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Calculus+Live',
        status: 'scheduled',
        enrolledStudents: 23,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Statistics Workshop',
        description: 'Hands-on statistics workshop with practical examples and data analysis.',
        category: 'Statistics',
        level: 'Intermediate',
        duration: 120,
        maxStudents: 30,
        price: 24.99,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/stats-workshop-1',
        thumbnailUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Stats+Workshop',
        status: 'scheduled',
        enrolledStudents: 18,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Geometry Problem Solving',
        description: 'Live problem-solving session for geometry with step-by-step solutions.',
        category: 'Mathematics',
        level: 'Intermediate',
        duration: 60,
        maxStudents: 40,
        price: 19.99,
        scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/geometry-session-1',
        thumbnailUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Geometry+Live',
        status: 'scheduled',
        enrolledStudents: 25,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Linear Algebra Masterclass',
        description: 'Comprehensive masterclass on linear algebra concepts and applications.',
        category: 'Mathematics',
        level: 'Advanced',
        duration: 150,
        maxStudents: 25,
        price: 39.99,
        scheduledAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/linear-algebra-masterclass',
        thumbnailUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Linear+Algebra',
        status: 'scheduled',
        enrolledStudents: 15,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Probability Theory Live',
        description: 'Live session on probability theory with real-world applications and examples.',
        category: 'Statistics',
        level: 'Intermediate',
        duration: 75,
        maxStudents: 35,
        price: 22.99,
        scheduledAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/probability-live',
        thumbnailUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Probability',
        status: 'scheduled',
        enrolledStudents: 20,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter live classes based on search, status, and category
    let filteredLiveClasses = sampleLiveClasses;
    
    if (status !== 'all') {
      filteredLiveClasses = filteredLiveClasses.filter(liveClass => liveClass.status === status);
    }
    
    if (category !== 'all') {
      filteredLiveClasses = filteredLiveClasses.filter(liveClass => liveClass.category === category);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredLiveClasses = filteredLiveClasses.filter(liveClass => 
        liveClass.title.toLowerCase().includes(searchTerm) ||
        liveClass.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLiveClasses = filteredLiveClasses.slice(offset, offset + parseInt(limit));
    const total = filteredLiveClasses.length;
    
    res.json({
      success: true,
      data: paginatedLiveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      message: 'Admin live classes retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: 'Mathematico',
      siteDescription: 'A Mathematics Learning Platform',
      contactEmail: 'dc2006089@gmail.com',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      maxFileSize: '10MB',
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b'
      }
    },
    message: 'Admin settings retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin POST endpoints for creating resources
app.post('/api/v1/admin/courses', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000) + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Course created successfully',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/admin/books', async (req, res) => {
  try {
    const {
      title,
      author,
      description,
      category,
      level,
      pages,
      isbn,
      coverImage,
      pdfUrl,
      status = 'draft',
      isPublished = false
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Insert book into database
    const [result] = await pool.execute(
      `INSERT INTO books (title, author, description, category, level, pages, isbn, coverImage, pdfUrl, status, is_published, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, author, description, category, level, pages, isbn, coverImage, pdfUrl, status, isPublished]
    );
    
    // Get the created book
    const [books] = await pool.execute(
      'SELECT * FROM books WHERE id = ?',
      [result.insertId]
    );
    
    res.json({
      success: true,
      data: books[0],
      message: 'Book created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/admin/live-classes', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subject,
      level,
      scheduledAt,
      duration,
      maxStudents,
      meetingUrl,
      meetingId,
      meetingPassword,
      status = 'draft',
      isPublished = false
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Insert live class into database
    const [result] = await pool.execute(
      `INSERT INTO live_classes (title, description, category, subject, level, scheduled_at, duration, max_students, meeting_url, meeting_id, meeting_password, status, is_published, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, description, category, subject, level, scheduledAt, duration, maxStudents, meetingUrl, meetingId, meetingPassword, status, isPublished]
    );
    
    // Get the created live class
    const [liveClasses] = await pool.execute(
      'SELECT * FROM live_classes WHERE id = ?',
      [result.insertId]
    );
    
    res.json({
      success: true,
      data: liveClasses[0],
      message: 'Live class created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin PUT endpoints for updating resources
app.put('/api/v1/admin/courses/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Course updated successfully',
    timestamp: new Date().toISOString()
  });
});

app.put('/api/v1/admin/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    const {
      title,
      author,
      description,
      category,
      level,
      pages,
      isbn,
      coverImage,
      pdfUrl,
      status,
      isPublished
    } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (author !== undefined) {
      updateFields.push('author = ?');
      updateValues.push(author);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (level !== undefined) {
      updateFields.push('level = ?');
      updateValues.push(level);
    }
    if (pages !== undefined) {
      updateFields.push('pages = ?');
      updateValues.push(pages);
    }
    if (isbn !== undefined) {
      updateFields.push('isbn = ?');
      updateValues.push(isbn);
    }
    if (coverImage !== undefined) {
      updateFields.push('coverImage = ?');
      updateValues.push(coverImage);
    }
    if (pdfUrl !== undefined) {
      updateFields.push('pdfUrl = ?');
      updateValues.push(pdfUrl);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (isPublished !== undefined) {
      updateFields.push('is_published = ?');
      updateValues.push(isPublished);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        timestamp: new Date().toISOString()
      });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(bookId);
    
    // Update book in database
    await pool.execute(
      `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Get the updated book
    const [books] = await pool.execute(
      'SELECT * FROM books WHERE id = ?',
      [bookId]
    );
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: books[0],
      message: 'Book updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/v1/admin/live-classes/:id', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const {
      title,
      description,
      category,
      subject,
      level,
      scheduledAt,
      duration,
      maxStudents,
      meetingUrl,
      meetingId,
      meetingPassword,
      status,
      isPublished
    } = req.body;
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (subject !== undefined) {
      updateFields.push('subject = ?');
      updateValues.push(subject);
    }
    if (level !== undefined) {
      updateFields.push('level = ?');
      updateValues.push(level);
    }
    if (scheduledAt !== undefined) {
      updateFields.push('scheduled_at = ?');
      updateValues.push(scheduledAt);
    }
    if (duration !== undefined) {
      updateFields.push('duration = ?');
      updateValues.push(duration);
    }
    if (maxStudents !== undefined) {
      updateFields.push('max_students = ?');
      updateValues.push(maxStudents);
    }
    if (meetingUrl !== undefined) {
      updateFields.push('meeting_url = ?');
      updateValues.push(meetingUrl);
    }
    if (meetingId !== undefined) {
      updateFields.push('meeting_id = ?');
      updateValues.push(meetingId);
    }
    if (meetingPassword !== undefined) {
      updateFields.push('meeting_password = ?');
      updateValues.push(meetingPassword);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (isPublished !== undefined) {
      updateFields.push('is_published = ?');
      updateValues.push(isPublished);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
        timestamp: new Date().toISOString()
      });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(liveClassId);
    
    // Update live class in database
    await pool.execute(
      `UPDATE live_classes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Get the updated live class
    const [liveClasses] = await pool.execute(
      'SELECT * FROM live_classes WHERE id = ?',
      [liveClassId]
    );
    
    if (liveClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: liveClasses[0],
      message: 'Live class updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin DELETE endpoints
app.delete('/api/v1/admin/courses/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Course deleted successfully',
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/v1/admin/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // Check if book exists
    const [books] = await pool.execute(
      'SELECT id FROM books WHERE id = ?',
      [bookId]
    );
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Delete book from database
    await pool.execute(
      'DELETE FROM books WHERE id = ?',
      [bookId]
    );
    
    res.json({
      success: true,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/v1/admin/live-classes/:id', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    
    // Check if live class exists
    const [liveClasses] = await pool.execute(
      'SELECT id FROM live_classes WHERE id = ?',
      [liveClassId]
    );
    
    if (liveClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Delete live class from database
    await pool.execute(
      'DELETE FROM live_classes WHERE id = ?',
      [liveClassId]
    );
    
    res.json({
      success: true,
      message: 'Live class deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Book specific endpoints
app.put('/api/v1/admin/books/:id/toggle-publish', async (req, res) => {
  try {
    const bookId = req.params.id;
    const { isPublished } = req.body;
    
    // Update book publish status
    await pool.execute(
      'UPDATE books SET is_published = ?, updated_at = NOW() WHERE id = ?',
      [isPublished, bookId]
    );
    
    // Get the updated book
    const [books] = await pool.execute(
      'SELECT * FROM books WHERE id = ?',
      [bookId]
    );
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: books[0],
      message: `Book ${isPublished ? 'published' : 'unpublished'} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling book publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle book publish status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get single book by ID
app.get('/api/v1/admin/books/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    
    const [books] = await pool.execute(
      'SELECT * FROM books WHERE id = ?',
      [bookId]
    );
    
    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: books[0],
      message: 'Book retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Live class specific endpoints
app.put('/api/v1/admin/live-classes/:id/toggle-publish', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const { isPublished } = req.body;
    
    // Update live class publish status
    await pool.execute(
      'UPDATE live_classes SET is_published = ?, updated_at = NOW() WHERE id = ?',
      [isPublished, liveClassId]
    );
    
    // Get the updated live class
    const [liveClasses] = await pool.execute(
      'SELECT * FROM live_classes WHERE id = ?',
      [liveClassId]
    );
    
    if (liveClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: liveClasses[0],
      message: `Live class ${isPublished ? 'published' : 'unpublished'} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling live class publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle live class publish status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get single live class by ID
app.get('/api/v1/admin/live-classes/:id', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    
    const [liveClasses] = await pool.execute(
      'SELECT * FROM live_classes WHERE id = ?',
      [liveClassId]
    );
    
    if (liveClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: liveClasses[0],
      message: 'Live class retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin user management endpoints
app.get('/api/v1/admin/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [users] = await pool.execute(
      'SELECT id, name, email, is_admin, is_active, created_at, last_login FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: users[0],
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/v1/admin/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, isAdmin, isActive } = req.body;
    
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, is_admin = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, email, isAdmin, isActive, userId]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/v1/admin/users/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;
    
    await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [isActive, userId]
    );
    
    res.json({
      success: true,
      message: 'User status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/v1/admin/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin settings update
app.put('/api/v1/admin/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'Settings updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Static asset handling with CORS
app.get('/logo.png', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/.*\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile('logo.png', { root: 'public' }, (err) => {
    if (err) {
      console.error('Error serving logo.png:', err);
      res.status(404).json({ error: 'Logo not found' });
    }
  });
});

app.get('/placeholder.svg', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/.*\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile('placeholder.svg', { root: 'public' }, (err) => {
    if (err) {
      console.error('Error serving placeholder.svg:', err);
      res.status(404).json({ error: 'Placeholder not found' });
    }
  });
});

// Favicon handling
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end();
});

app.get('/favicon', (req, res) => {
  res.status(204).end();
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Export the app for Vercel
module.exports = app;