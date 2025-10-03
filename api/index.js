// Vercel serverless function for main API endpoints
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

// Root API endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico API - Serverless Version',
    version: '2.0.0',
    database: 'MongoDB Atlas',
    environment: process.env.NODE_ENV || 'development',
    serverless: true,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      mobile: '/api/v1/mobile',
      student: '/api/v1/student',
      users: '/api/v1/users',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: {
      status: 'connected',
      type: 'mongodb'
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    environment: process.env.NODE_ENV || 'development',
    serverless: true,
    timestamp: new Date().toISOString()
  });
});

// API information endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico API - Serverless Version',
    version: '2.0.0',
    database: 'MongoDB Atlas',
    environment: process.env.NODE_ENV || 'development',
    serverless: true,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      mobile: '/api/v1/mobile',
      student: '/api/v1/student',
      users: '/api/v1/users',
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// Test endpoint
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'API routing is working ✅',
    serverless: true,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    serverless: true,
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
