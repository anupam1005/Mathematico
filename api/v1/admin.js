// Vercel serverless function for admin endpoints
const express = require('express');
const cors = require('cors');

const app = express();

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

// Root admin endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is working ✅',
    endpoints: {
      dashboard: '/dashboard',
      users: '/users',
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      payments: '/payments',
      settings: '/settings',
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
    message: 'Admin service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalRevenue: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Users management
app.get('/users', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Books management
app.get('/books', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Courses management
app.get('/courses', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Live classes management
app.get('/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Payments management
app.get('/payments', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    timestamp: new Date().toISOString()
  });
});

// Settings
app.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: 'Mathematico',
      siteDescription: 'Mathematics Learning Platform',
      maintenanceMode: false,
      registrationEnabled: true
    },
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
