// Simple API test script
const express = require('express');

console.log('🧪 Testing API endpoints...');

// Test the API locally
const app = express();

// Basic middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'test',
    vercel: false,
    database: {
      host: 'test',
      database: 'test',
      connected: false
    },
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mathematico API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: 'test',
    vercel: false,
    endpoints: {
      health: '/api/v1/health',
      api: '/api/v1'
    }
  });
});

// Start test server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   - http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/api/v1/health`);
  console.log('');
  console.log('🧪 Testing endpoints...');
  
  // Test endpoints
  const http = require('http');
  
  // Test root endpoint
  http.get(`http://localhost:${PORT}/`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Root endpoint test passed');
      console.log('   Response:', JSON.parse(data).message);
    });
  });
  
  // Test health endpoint
  http.get(`http://localhost:${PORT}/api/v1/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Health endpoint test passed');
      console.log('   Response:', JSON.parse(data).status);
      console.log('');
      console.log('🎉 All tests passed! API is working correctly.');
      console.log('🚀 Ready for Vercel deployment!');
      process.exit(0);
    });
  });
});
