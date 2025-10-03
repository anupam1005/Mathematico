// Vercel serverless function for users endpoints
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

// Root users endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working ✅',
    endpoints: {
      profile: '/profile',
      settings: '/settings',
      preferences: '/preferences',
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
    message: 'Users service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Profile endpoints
app.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Sample User',
      email: 'user@example.com',
      role: 'user',
      avatar: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

app.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Settings endpoints
app.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: true,
      emailUpdates: true,
      darkMode: false,
      language: 'en'
    },
    timestamp: new Date().toISOString()
  });
});

app.put('/settings', (req, res) => {
  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Preferences endpoints
app.get('/preferences', (req, res) => {
  res.json({
    success: true,
    data: {
      subjects: ['Mathematics', 'Physics'],
      difficulty: 'intermediate',
      studyTime: 'evening'
    },
    timestamp: new Date().toISOString()
  });
});

app.put('/preferences', (req, res) => {
  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
