// Vercel serverless function for Mathematico Backend - Simplified Version
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins for now
    return callback(null, true);
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mathematico Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.3.0'
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    version: '1.3.0'
  });
});

// Sample data for demonstration
const sampleBooks = [
  {
    id: '1',
    title: 'Advanced Mathematics',
    author: 'Dr. Sarah Wilson',
    description: 'Comprehensive guide to advanced mathematical concepts.',
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
    description: 'Perfect introduction to algebra for beginners.',
    category: 'Mathematics',
    pages: 280,
    isbn: '978-1234567891',
    coverImage: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Basic+Algebra',
    pdfUrl: 'https://example.com/basic-algebra.pdf',
    status: 'active',
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Admin books endpoint
app.get('/api/v1/admin/books', (req, res) => {
  try {
    const { page = 1, limit = 100, status = 'all', category = 'all', search } = req.query;
    
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

// Admin login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple admin login check
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
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
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userPayload,
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
        message: 'Invalid credentials',
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Export the app for Vercel
module.exports = app;
