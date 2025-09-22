// Vercel serverless function - simple and clean
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const app = express();

// security + cors
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

// body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Favicon route - return 404 for serverless
app.get('/favicon.ico', (req, res) => {
  res.status(404).end();
});

// Robots.txt route
app.get('/robots.txt', (req, res) => {
  res.status(404).end();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  try {
    console.log('Root endpoint hit:', req.url);
    res.json({
      success: true,
      message: 'Mathematico Backend API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vercel: !!process.env.VERCEL,
      url: req.url,
      method: req.method
    });
  } catch (error) {
    console.error('Root endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if it's the hardcoded admin user
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
      const userPayload = {
        id: 1,
        email: email,
        name: 'Admin User',
        isAdmin: true,
        is_admin: true,
        role: 'admin',
        email_verified: true,
        is_active: true
      };
      
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
      const refreshToken = jwt.sign({ id: userPayload.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          tokens: {
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin dashboard endpoint
app.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    let stats = {
      totalUsers: 0,
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalRevenue: 0
    };

    res.json({
      success: true,
      data: {
        stats: stats,
        recentActivity: []
      },
      message: 'Admin dashboard retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple fallback controllers
const adminController = {
  getBooks: (req, res) => res.json({ success: true, data: [], message: 'Books endpoint' }),
  getBookById: (req, res) => res.json({ success: true, data: null, message: 'Book by ID endpoint' }),
  createBook: (req, res) => res.json({ success: true, message: 'Create book endpoint' }),
  updateBook: (req, res) => res.json({ success: true, message: 'Update book endpoint' }),
  deleteBook: (req, res) => res.json({ success: true, message: 'Delete book endpoint' }),
  updateBookStatus: (req, res) => res.json({ success: true, message: 'Update book status endpoint' }),
  getCourses: (req, res) => res.json({ success: true, data: [], message: 'Courses endpoint' }),
  createCourse: (req, res) => res.json({ success: true, message: 'Create course endpoint' }),
  getCourseById: (req, res) => res.json({ success: true, data: null, message: 'Course by ID endpoint' }),
  updateCourse: (req, res) => res.json({ success: true, message: 'Update course endpoint' }),
  deleteCourse: (req, res) => res.json({ success: true, message: 'Delete course endpoint' }),
  updateCourseStatus: (req, res) => res.json({ success: true, message: 'Update course status endpoint' }),
  getLiveClasses: (req, res) => res.json({ success: true, data: [], message: 'Live classes endpoint' }),
  createLiveClass: (req, res) => res.json({ success: true, message: 'Create live class endpoint' }),
  getLiveClassById: (req, res) => res.json({ success: true, data: null, message: 'Live class by ID endpoint' }),
  updateLiveClass: (req, res) => res.json({ success: true, message: 'Update live class endpoint' }),
  deleteLiveClass: (req, res) => res.json({ success: true, message: 'Delete live class endpoint' }),
  updateLiveClassStatus: (req, res) => res.json({ success: true, message: 'Update live class status endpoint' }),
  getUsers: (req, res) => res.json({ success: true, data: [], message: 'Users endpoint' }),
  uploadFilesForBook: (req, res, next) => { next(); }
};

// Simple middleware
const authenticateToken = (req, res, next) => { next(); };
const requireAdmin = (req, res, next) => { next(); };

// Books
app.get('/api/v1/admin/books', authenticateToken, requireAdmin, adminController.getBooks);
app.get('/api/v1/admin/books/:id', authenticateToken, requireAdmin, adminController.getBookById);
app.post('/api/v1/admin/books', authenticateToken, requireAdmin, adminController.uploadFilesForBook, adminController.createBook);
app.put('/api/v1/admin/books/:id', authenticateToken, requireAdmin, adminController.updateBook);
app.delete('/api/v1/admin/books/:id', authenticateToken, requireAdmin, adminController.deleteBook);
app.put('/api/v1/admin/books/:id/toggle-publish', authenticateToken, requireAdmin, adminController.updateBookStatus);

// Courses
app.get('/api/v1/admin/courses', authenticateToken, requireAdmin, adminController.getCourses);
app.post('/api/v1/admin/courses', authenticateToken, requireAdmin, adminController.createCourse);
app.get('/api/v1/admin/courses/:id', authenticateToken, requireAdmin, adminController.getCourseById);
app.put('/api/v1/admin/courses/:id', authenticateToken, requireAdmin, adminController.updateCourse);
app.delete('/api/v1/admin/courses/:id', authenticateToken, requireAdmin, adminController.deleteCourse);
app.put('/api/v1/admin/courses/:id/status', authenticateToken, requireAdmin, adminController.updateCourseStatus);

// Live classes
app.get('/api/v1/admin/live-classes', authenticateToken, requireAdmin, adminController.getLiveClasses);
app.post('/api/v1/admin/live-classes', authenticateToken, requireAdmin, adminController.createLiveClass);
app.get('/api/v1/admin/live-classes/:id', authenticateToken, requireAdmin, adminController.getLiveClassById);
app.put('/api/v1/admin/live-classes/:id', authenticateToken, requireAdmin, adminController.updateLiveClass);
app.delete('/api/v1/admin/live-classes/:id', authenticateToken, requireAdmin, adminController.deleteLiveClass);
app.put('/api/v1/admin/live-classes/:id/toggle-publish', authenticateToken, requireAdmin, adminController.updateLiveClassStatus);

// Users
app.get('/api/v1/admin/users', authenticateToken, requireAdmin, adminController.getUsers);

// Public routes for users
app.get('/api/v1/books', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Books retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/courses', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Courses retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Live classes retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// fallback 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Export for Vercel
module.exports = app;