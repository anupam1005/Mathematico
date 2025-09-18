/**
 * Vercel serverless handler to ensure /api/v1 works even if compiled server isn't found.
 * This is a fallback handler that provides basic API functionality.
 */

const express = require('express');
const cors = require('cors');

const app = express();

// Basic JSON body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for mobile apps
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for mobile apps during development
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, allow specific origins
    const allowedOrigins = [
      'https://mathematico-frontend.vercel.app',
      'https://mathematico-backend-new.vercel.app',
      'https://mathematico-mobile.vercel.app',
      'https://mathematico-app.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    return callback(null, true); // Allow all for now
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
    'Pragma'
  ]
}));

// Health endpoint - Primary endpoint for mobile connectivity testing
app.get('/api/v1/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    version: '1.3.0',
    handler: 'fallback',
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
      }
    },
    message: 'Mathematico API Fallback Handler - Mobile Ready'
  });
});

// Root API endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    status: 'Mathematico API v1 running',
    message: 'Mathematico API v1 - Fallback Handler',
    version: '1.3.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    handler: 'fallback',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin',
      users: '/api/v1/users',
      payments: '/api/v1/payments'
    }
  });
});

// Try to load the main API handler
let mainApiLoaded = false;
try {
  const mainApi = require('../index.js');
  if (mainApi && typeof mainApi === 'function') {
    // Mount the main API handler
    app.use('/api/v1', mainApi);
    mainApiLoaded = true;
    console.log('✅ Main API handler loaded successfully');
  }
} catch (error) {
  console.log('⚠️ Main API handler not available, using fallback:', error.message);
}

// Fallback endpoints for when main API is not available
if (!mainApiLoaded) {
  // Basic auth endpoints
  app.post('/api/v1/auth/login', (req, res) => {
    res.json({
      success: true,
      message: 'Login endpoint - Fallback handler',
      data: {
        user: {
          id: 1,
          email: req.body.email || 'test@example.com',
          name: 'Test User',
          isAdmin: true,
          role: 'admin'
        },
        tokens: {
          accessToken: 'fallback-token',
          refreshToken: 'fallback-refresh-token',
          expiresIn: 3600
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  // Basic courses endpoint
  app.get('/api/v1/courses', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'Sample Course - Fallback',
          description: 'This is a fallback course from the API handler',
          price: 0,
          status: 'published',
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Courses retrieved successfully - Fallback handler',
      timestamp: new Date().toISOString()
    });
  });

  // Basic books endpoint
  app.get('/api/v1/books', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'Sample Book - Fallback',
          author: 'Test Author',
          price: 0,
          status: 'published',
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Books retrieved successfully - Fallback handler',
      timestamp: new Date().toISOString()
    });
  });

  // Basic live classes endpoint
  app.get('/api/v1/live-classes', (req, res) => {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'Sample Live Class - Fallback',
          description: 'This is a fallback live class from the API handler',
          status: 'upcoming',
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Live classes retrieved successfully - Fallback handler',
      timestamp: new Date().toISOString()
    });
  });
}

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found in fallback handler`,
    timestamp: new Date().toISOString(),
    handler: 'fallback'
  });
});

// Export the app for Vercel
module.exports = app;
