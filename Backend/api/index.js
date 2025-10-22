// Simplified serverless function for Vercel
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico Backend API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverless: true,
    database: {
      connected: false,
      status: 'serverless-mode'
    },
    endpoints: {
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      mobile: '/api/v1/mobile',
      student: '/api/v1/student',
      users: '/api/v1/users',
      health: '/health'
    },
    documentation: {
      info: 'Visit /api/v1/admin/info for admin API documentation',
      auth: 'Visit /api/v1/auth for authentication endpoints',
      health: 'Visit /health for system health check'
    },
    quickStart: {
      step1: 'Test health: GET /health',
      step2: 'Get auth info: GET /api/v1/auth',
      step3: 'Login: POST /api/v1/auth/login',
      step4: 'Access admin: GET /api/v1/admin (with Bearer token)'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: {
      status: 'serverless-mode',
      type: 'mongodb',
      host: 'serverless'
    },
    system: {
      platform: 'linux',
      arch: 'x64',
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    environment: 'production',
    serverless: true,
    timestamp: new Date().toISOString()
  });
});

// API v1 root
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico API - MongoDB Version',
    version: '2.0.0',
    database: 'MongoDB',
    environment: process.env.NODE_ENV || 'development',
    serverless: true,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      mobile: '/api/v1/mobile',
      student: '/api/v1/student',
      users: '/api/v1/users',
      health: '/health'
    }
  });
});

// Mobile API endpoints (simplified)
app.get('/api/v1/mobile', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is running',
    endpoints: ['/books', '/courses', '/live-classes'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/mobile/books', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Books service is running (serverless mode)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/mobile/courses', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Courses service is running (serverless mode)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/mobile/live-classes', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Live classes service is running (serverless mode)',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints (simplified)
app.get('/api/v1/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running (serverless mode)',
    endpoints: ['/login', '/register', '/refresh'],
    timestamp: new Date().toISOString()
  });
});

// Admin endpoints (simplified)
app.get('/api/v1/admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin service is running (serverless mode)',
    endpoints: ['/info', '/users', '/books', '/courses'],
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      root: '/',
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
      admin: '/api/v1/admin',
      mobile: '/api/v1/mobile',
      student: '/api/v1/student',
      users: '/api/v1/users'
    }
  });
});

module.exports = app;
