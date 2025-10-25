const express = require('express');
const router = express.Router();

// Simple auth routes for serverless deployment
console.log('🔐 Loading simple auth routes...');

// Root auth endpoint
router.get('/', (req, res) => {
  console.log('🔐 Auth root endpoint accessed');
  res.json({
    success: true,
    message: 'Auth API is working ✅',
    endpoints: {
      login: '/login',
      register: '/register',
      logout: '/logout',
      test: '/test',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Auth test endpoint requested');
  res.json({
    success: true,
    message: 'Auth routes are working ✅',
    timestamp: new Date().toISOString()
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
router.post('/login', (req, res) => {
  console.log('🔐 Login request received:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
      timestamp: new Date().toISOString()
    });
  }

  // Simple admin check
  const ADMIN_EMAIL = 'dc2006089@gmail.com';
  const ADMIN_PASSWORD = 'Myname*321';
  
  if (email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Generate simple token
    const token = `admin-token-${Date.now()}`;
    
    return res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: 'admin-user-id',
          name: 'Admin User',
          email: ADMIN_EMAIL,
          role: 'admin',
          isAdmin: true,
          isActive: true
        },
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 3600
      },
      timestamp: new Date().toISOString()
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid email or password',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
router.post('/register', (req, res) => {
  console.log('📝 Registration request received:', req.body);
  
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required',
      timestamp: new Date().toISOString()
    });
  }

  // Prevent admin email registration
  const ADMIN_EMAIL = 'dc2006089@gmail.com';
  if (email.toLowerCase() === ADMIN_EMAIL) {
    return res.status(403).json({
      success: false,
      message: 'This email is reserved for admin use. Please use a different email.',
      timestamp: new Date().toISOString()
    });
  }

  // For now, just return success without actually creating user
  const token = `user-token-${Date.now()}`;
  
  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: `user-${Date.now()}`,
        name: name,
        email: email,
        role: 'student',
        isAdmin: false,
        isActive: true
      },
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 3600
    },
    timestamp: new Date().toISOString()
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Simple auth routes loaded successfully');

module.exports = router;