const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database connection
const { testConnection, createUsersTable, createBooksTable, createCoursesTable, createLiveClassesTable, createEnrollmentsTable } = require('./database');

// Import middleware
const { authenticateToken, requireAdmin, requireActiveUser } = require('./middlewares/authMiddleware');

// API routes are defined directly in this file

// Initialize Express app
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Database initialization
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

// Database initialization middleware
app.use(async (req, res, next) => {
  await initializeDatabase();
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mathematico Unified API Server',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/auth',
      student: '/api/student',
      admin: '/api/admin'
    },
    documentation: {
      auth: 'https://your-backend.vercel.app/api/auth',
      student: 'https://your-backend.vercel.app/api/student',
      admin: 'https://your-backend.vercel.app/api/admin'
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
    version: '2.0.0',
    services: {
      database: dbInitialized ? 'connected' : 'disconnected',
      mobile: 'available',
      admin: 'available',
      auth: 'available'
    },
    student: {
      supported: true,
      baseUrl: 'https://your-backend.vercel.app/api/student',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/auth',
        dashboard: '/api/student/dashboard',
        courses: '/api/student/courses',
        books: '/api/student/books',
        liveClasses: '/api/student/live-classes'
      }
    },
    admin: {
      supported: true,
      baseUrl: 'https://your-backend.vercel.app/api/admin',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/auth',
        dashboard: '/api/admin/dashboard',
        courses: '/api/admin/courses',
        books: '/api/admin/books',
        users: '/api/admin/users'
      }
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// All API routes are defined directly in this file

// Basic auth routes
app.get('/api/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth endpoint is working',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint is working',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Register endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Basic admin routes
app.get('/api/admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Admin dashboard endpoint
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 1250,
        totalStudents: 1200,
        totalCourses: 45,
        totalModules: 180,
        totalLessons: 720,
        totalRevenue: 125000,
        activeBatches: 12,
      },
      recentUsers: [],
      recentCourses: [],
    },
    message: 'Dashboard data retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin users endpoint
app.get('/api/admin/users', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Users retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin books endpoint
app.get('/api/admin/books', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin live classes endpoint
app.get('/api/admin/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin courses endpoint
app.get('/api/v1/admin/courses', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin books endpoint (v1) - will be updated to use books array below

// Admin users endpoint (v1)
app.get('/api/v1/admin/users', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Users retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin live classes endpoint (v1)
app.get('/api/v1/admin/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Admin dashboard endpoint (v1)
app.get('/api/v1/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 1250,
        totalStudents: 1200,
        totalCourses: 45,
        totalModules: 180,
        totalLessons: 720,
        totalRevenue: 125000,
        activeBatches: 12,
      },
      recentUsers: [],
      recentCourses: [],
    },
    message: 'Dashboard data retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Book management endpoints
let books = [
  {
    id: '1',
    title: 'Advanced Mathematics',
    author: 'Dr. John Smith',
    description: 'Comprehensive guide to advanced mathematical concepts',
    category: 'Mathematics',
    subject: 'Calculus',
    level: 'Advanced',
    status: 'active',
    isPublished: true,
    downloads: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Physics Fundamentals',
    author: 'Prof. Jane Doe',
    description: 'Essential physics concepts for beginners',
    category: 'Physics',
    subject: 'Mechanics',
    level: 'Foundation',
    status: 'draft',
    isPublished: false,
    downloads: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Chemistry Basics',
    author: 'Dr. Mike Johnson',
    description: 'Introduction to chemical principles',
    category: 'Chemistry',
    subject: 'General Chemistry',
    level: 'Intermediate',
    status: 'active',
    isPublished: true,
    downloads: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Get all books
app.get('/api/v1/admin/books', (req, res) => {
  res.json({
    success: true,
    data: books,
    message: 'Books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Create book
app.post('/api/v1/admin/books', (req, res) => {
  try {
    const { title, author, description, category, subject, level, status = 'draft' } = req.body;
    
    const newBook = {
      id: (books.length + 1).toString(),
      title,
      author,
      description,
      category,
      subject,
      level,
      status,
      isPublished: status === 'active',
      downloads: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    books.push(newBook);
    
    res.json({
      success: true,
      data: newBook,
      message: 'Book created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update book
app.put('/api/v1/admin/books/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookIndex = books.findIndex(book => book.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const updatedBook = {
      ...books[bookIndex],
      ...req.body,
      id,
      updatedAt: new Date().toISOString()
    };
    
    books[bookIndex] = updatedBook;
    
    res.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete book
app.delete('/api/v1/admin/books/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookIndex = books.findIndex(book => book.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    books.splice(bookIndex, 1);
    
    res.json({
      success: true,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Toggle book publish status
app.put('/api/v1/admin/books/:id/toggle-publish', (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    const bookIndex = books.findIndex(book => book.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    books[bookIndex].isPublished = isPublished;
    books[bookIndex].status = isPublished ? 'active' : 'draft';
    books[bookIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: books[bookIndex],
      message: `Book ${isPublished ? 'published' : 'unpublished'} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle book status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Static file serving
app.use(express.static('public'));

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
      
      console.log('Admin login successful, token generated:', token.substring(0, 20) + '...');
      
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

app.post('/api/v1/auth/register', (req, res) => {
  try {
    console.log('Register attempt:', req.body);
    
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name, email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Generate a simple token (in production, use proper JWT)
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
    console.error('Register endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/auth/me', (req, res) => {
  try {
    // For demo purposes, return a sample user
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'dc2006089@gmail.com',
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
      message: 'User profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile',
      timestamp: new Date().toISOString()
    });
  }
});

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
    
    // Generate new tokens
    const token = Buffer.from(`refresh:${Date.now()}`).toString('base64');
    const newRefreshToken = Buffer.from(`refresh:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        token: token,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh token endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to refresh token',
      timestamp: new Date().toISOString()
    });
  }
});

// In-memory storage for demo purposes

let courses = [
  {
    id: '1',
    title: 'JEE Mathematics',
    description: 'Complete JEE Mathematics preparation course',
    category: 'JEE',
    class: 'Class 12',
    subject: 'Mathematics',
    level: 'Advanced',
    price: 2999,
    originalPrice: 3999,
    duration: 120,
    status: 'active',
    isPublished: true,
    isFeatured: true,
    students: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let liveClasses = [
  {
    id: '1',
    title: 'Live Mathematics Session',
    description: 'Interactive live session on calculus',
    category: 'Mathematics',
    subject: 'Mathematics',
    class: 'Class 12',
    level: 'Advanced',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    maxStudents: 50,
    status: 'scheduled',
    isPublished: true,
    isFeatured: true,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    meetingId: 'abc-defg-hij',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Admin endpoints
app.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalUsers: 150,
        totalStudents: 120,
        totalCourses: courses.length,
        totalModules: 150,
        totalLessons: 500,
        totalRevenue: 15000,
        activeBatches: 8,
        recentUsers: [
          { id: '1', name: 'John Doe', email: 'john@example.com', type: 'user' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', type: 'user' }
        ],
        recentCourses: courses.slice(0, 2).map(course => ({
          id: course.id,
          title: course.title,
          category: course.category,
          type: 'course'
        }))
      },
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve dashboard data',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/books', async (req, res) => {
  try {
    console.log('Getting books, current count:', books.length);
    res.json({
      success: true,
      data: books,
      message: 'Books retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Books endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve books',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/admin/books', async (req, res) => {
  try {
    console.log('Creating book:', req.body);
    
    // Generate a new book ID
    const bookId = (Math.floor(Math.random() * 1000) + 100).toString();
    
    const newBook = {
      id: bookId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to in-memory storage
    books.push(newBook);
    
    console.log('Book created successfully, total books:', books.length);
    
    res.json({
      success: true,
      data: newBook,
      message: 'Book created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create book endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create book',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/courses', async (req, res) => {
  try {
    console.log('Getting courses, current count:', courses.length);
    res.json({
      success: true,
      data: courses,
      message: 'Courses retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Courses endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve courses',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/admin/courses', async (req, res) => {
  try {
    console.log('Creating course:', req.body);
    
    // Generate a new course ID
    const courseId = (Math.floor(Math.random() * 1000) + 100).toString();
    
    const newCourse = {
      id: courseId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to in-memory storage
    courses.push(newCourse);
    
    console.log('Course created successfully, total courses:', courses.length);
    
    res.json({
      success: true,
      data: newCourse,
      message: 'Course created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create course endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create course',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/admin/live-classes', async (req, res) => {
  try {
    console.log('Getting live classes, current count:', liveClasses.length);
    res.json({
      success: true,
      data: liveClasses,
      message: 'Live classes retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live classes endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve live classes',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/v1/admin/live-classes', async (req, res) => {
  try {
    console.log('Creating live class:', req.body);
    
    // Generate a new live class ID
    const liveClassId = (Math.floor(Math.random() * 1000) + 100).toString();
    
    const newLiveClass = {
      id: liveClassId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to in-memory storage
    liveClasses.push(newLiveClass);
    
    console.log('Live class created successfully, total live classes:', liveClasses.length);
    
    res.json({
      success: true,
      data: newLiveClass,
      message: 'Live class created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create live class endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create live class',
      timestamp: new Date().toISOString()
    });
  }
});

// User-facing endpoints
app.get('/api/v1/books', async (req, res) => {
  try {
    console.log('Getting books for users, current count:', books.length);
    res.json({
      success: true,
      data: books.filter(book => book.isPublished),
      message: 'Books retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User books endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve books',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/courses', async (req, res) => {
  try {
    console.log('Getting courses for users, current count:', courses.length);
    res.json({
      success: true,
      data: courses.filter(course => course.isPublished),
      message: 'Courses retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User courses endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve courses',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/v1/live-classes', async (req, res) => {
  try {
    console.log('Getting live classes for users, current count:', liveClasses.length);
    res.json({
      success: true,
      data: liveClasses.filter(liveClass => liveClass.isPublished),
      message: 'Live classes retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User live classes endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve live classes',
      timestamp: new Date().toISOString()
    });
  }
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

// Start server
const PORT = process.env.PORT || 5000;

// Always start the server (for both development and production)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👨‍🎓 Student API: http://localhost:${PORT}/api/student`);
  console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);
});

// Export the app for Vercel
module.exports = app;
