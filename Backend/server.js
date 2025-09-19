const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database connection
const { testConnection, createUsersTable, createBooksTable } = require('./database');

// Import middleware
const { authenticateToken, requireRole } = require('./middlewares/auth');

// Import API routes
const authRoutes = require('./api/routes/auth');
const studentRoutes = require('./api/routes/student');
const adminRoutes = require('./api/routes/admin');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://mathematico-frontend.vercel.app',
  'https://mathematico-frontend-gvpmf2rwj-anupam-das-projects-db63fa41.vercel.app',
  'https://mathematico-backend-new.vercel.app',
  // Mobile app origins (React Native/Expo)
  'exp://192.168.1.100:8081',
  'exp://192.168.1.101:8081',
  'exp://192.168.1.102:8081',
  'exp://192.168.1.103:8081',
  'exp://192.168.1.104:8081',
  'exp://192.168.1.105:8081',
  'exp://192.168.1.106:8081',
  'exp://192.168.1.107:8081',
  'exp://192.168.1.108:8081',
  'exp://192.168.1.109:8081',
  'exp://192.168.1.110:8081',
  'exp://10.0.2.2:8081',
  'exp://localhost:8081',
  'exp://127.0.0.1:8081'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowing origin:', origin);
      return callback(null, true);
    }
    
    // Allow Vercel preview URLs
    if (origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      console.log('✅ CORS allowing Vercel preview URL:', origin);
      return callback(null, true);
    }
    
    // Allow Expo/React Native development URLs
    if (origin.match(/^exp:\/\/.*$/)) {
      console.log('✅ CORS allowing Expo development URL:', origin);
      return callback(null, true);
    }
    
    // Allow localhost with any port for development
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      console.log('✅ CORS allowing localhost URL:', origin);
      return callback(null, true);
    }
    
    // Allow local IP addresses for mobile development
    if (origin.match(/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/)) {
      console.log('✅ CORS allowing local IP URL:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'), false);
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

// Database initialization
let dbInitialized = false;
async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    console.log('🔄 Initializing database connection...');
    const connected = await testConnection();
    if (connected) {
      await createUsersTable();
      await createBooksTable();
      dbInitialized = true;
      console.log('✅ Database initialized successfully');
    } else {
      console.error('❌ Failed to initialize database');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Database initialization middleware
app.use(async (req, res, next) => {
  await initializeDatabase();
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mathematico Unified API Server',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/auth',
      student: '/api/student',
      admin: '/api/admin'
    },
    documentation: {
      auth: 'https://your-backend.vercel.app/api/auth',
      student: 'https://your-backend.vercel.app/api/student',
      admin: 'https://your-backend.vercel.app/api/admin'
    }
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
    version: '2.0.0',
    services: {
      database: dbInitialized ? 'connected' : 'disconnected',
      mobile: 'available',
      admin: 'available',
      auth: 'available'
    },
    student: {
      supported: true,
      baseUrl: 'https://your-backend.vercel.app/api/student',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/auth',
        dashboard: '/api/student/dashboard',
        courses: '/api/student/courses',
        books: '/api/student/books',
        liveClasses: '/api/student/live-classes'
      }
    },
    admin: {
      supported: true,
      baseUrl: 'https://your-backend.vercel.app/api/admin',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/auth',
        dashboard: '/api/admin/dashboard',
        courses: '/api/admin/courses',
        books: '/api/admin/books',
        users: '/api/admin/users'
      }
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// Auth routes (login, register, etc.)
app.use('/api/auth', authRoutes);

// Student API routes (for mobile app and student dashboard)
app.use('/api/student', studentRoutes);

// Admin API routes (for admin panel)
app.use('/api/admin', adminRoutes);

// Static file serving
app.use(express.static('public'));

// Static asset handling with CORS
app.get('/logo.png', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/.*\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile('logo.png', { root: 'public' }, (err) => {
    if (err) {
      console.error('Error serving logo.png:', err);
      res.status(404).json({ error: 'Logo not found' });
    }
  });
});

app.get('/placeholder.svg', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || (origin && origin.match(/^https:\/\/.*\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.sendFile('placeholder.svg', { root: 'public' }, (err) => {
    if (err) {
      console.error('Error serving placeholder.svg:', err);
      res.status(404).json({ error: 'Placeholder not found' });
    }
  });
});

// Favicon handling
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Always start the server (for both development and production)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👨‍🎓 Student API: http://localhost:${PORT}/api/student`);
  console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);
});

// Export the app for Vercel
module.exports = app;
