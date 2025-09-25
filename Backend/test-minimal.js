// Minimal test serverless function for debugging
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Minimal test API is working ✅",
    timestamp: new Date().toISOString(),
    serverless: !!process.env.VERCEL
  });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: "Health check passed ✅",
    environment: process.env.NODE_ENV || 'development',
    serverless: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
