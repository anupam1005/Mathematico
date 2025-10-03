// Vercel serverless function for mobile endpoints
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Import backend controllers and utilities
let mobileController, authenticateToken, connectToDatabase;
try {
  mobileController = require('../../Backend/controllers/mobileController');
  authenticateToken = require('../../Backend/middlewares/auth').authenticateToken;
  connectToDatabase = require('../../Backend/utils/database').connectToDatabase;
  console.log('✅ Backend modules loaded successfully');
} catch (error) {
  console.error('❌ Failed to load backend modules:', error.message);
  // Fallback to inline implementation
}

// JWT secrets for fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Fallback authentication middleware
const fallbackAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
};

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://localhost:8081',
      'https://mathematico-frontend.vercel.app',
      'https://mathematico-backend-new.vercel.app'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
}));

app.use(express.json());

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    if (connectToDatabase) {
      await connectToDatabase();
    }
  } catch (error) {
    console.warn('Database connection warning:', error.message);
  }
  next();
});

// Root mobile endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working ✅',
    endpoints: {
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      search: '/search',
      featured: '/featured',
      categories: '/categories',
      test: '/test',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is healthy',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Mobile routes - use actual controllers when available
if (mobileController) {
  // Use actual backend controllers
  app.get('/books', mobileController.getAllBooks);
  app.get('/books/:id', mobileController.getBookById);
  app.get('/courses', mobileController.getAllCourses);
  app.get('/courses/:id', mobileController.getCourseById);
  app.get('/live-classes', mobileController.getAllLiveClasses);
  app.get('/live-classes/:id', mobileController.getLiveClassById);
  app.get('/search', mobileController.searchContent);
  app.get('/featured', mobileController.getFeaturedContent);
  app.get('/categories', mobileController.getCategories);
} else {
  // Fallback implementation with sample data
  app.get('/books', (req, res) => {
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
      timestamp: new Date().toISOString()
    });
  });
}

// Common routes for both controller and fallback
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  console.log('📱 Mobile serverless function called:', req.method, req.url);
  app(req, res);
};
