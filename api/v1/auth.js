// Vercel serverless function for auth endpoints
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

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

// JWT secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-refresh-secret-change-in-production';

// Generate tokens
const generateAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const generateRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

// Auth routes
app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
        timestamp: new Date().toISOString()
      });
    }

    // Check for admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'dc2006089@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Myname*321';
    
    let userPayload;
    if (email === adminEmail && password === adminPassword) {
      userPayload = {
        id: 1,
        email,
        name: "Admin User",
        role: "admin",
        isAdmin: true,
        is_admin: true,
        email_verified: true,
        is_active: true
      };
    } else if (email === 'test@example.com' && password === 'password123') {
      // Test user for development
      userPayload = {
        id: 2,
        email,
        name: "Test User",
        role: "user",
        isAdmin: false,
        is_admin: false,
        email_verified: true,
        is_active: true
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        timestamp: new Date().toISOString()
      });
    }

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          ...userPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Login failed",
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // For serverless mode, create a simple user registration
    const userPayload = {
      id: Date.now(), // Simple ID generation
      email,
      name,
      role: 'user',
      isAdmin: false,
      is_admin: false,
      email_verified: false,
      is_active: true
    };
    
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          ...userPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

app.post('/refresh-token', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    // For demo purposes, generate new tokens
    const userPayload = {
      id: 1,
      email: "dc2006089@gmail.com",
      name: "Admin User",
      role: "admin",
      isAdmin: true,
    };

    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: userPayload.id });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600
        }
      }
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token"
    });
  }
});

app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working ✅',
    timestamp: new Date().toISOString()
  });
});

// Root auth endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working ✅',
    endpoints: {
      login: '/login',
      register: '/register',
      logout: '/logout',
      refresh: '/refresh-token',
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
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = (req, res) => {
  app(req, res);
};
