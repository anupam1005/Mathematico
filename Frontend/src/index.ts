import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppDataSource } from './config/data-source';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "http://localhost:*"],
      frameAncestors: ["'self'", "http://localhost:*"]
    }
  } : false, // Disable CSP in development
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - allow multiple origins for development and mobile apps
const allowedOrigins = [
  'http://localhost:8080',  // Your current frontend port
  'http://localhost:5173',  // Vite default port
  'http://localhost:3000',  // React default port
  'http://127.0.0.1:8080', // Alternative localhost
  'http://127.0.0.1:5173', // Alternative localhost
  'http://127.0.0.1:3000', // Alternative localhost
  'https://mathematico-frontend.vercel.app', // Production frontend
  'https://mathematico-backend-new.vercel.app', // Production backend
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🌐 CORS allowed origins:', allowedOrigins);
console.log('🌐 CORS configuration loaded with preflightContinue: false');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins in development, or specific origins in production
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
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
    'X-Requested-With',
    'User-Agent'
  ],
  exposedHeaders: [
    'Content-Length', 
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'X-Total-Count',
    'X-Page-Count'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Debug CORS requests in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('🌐 CORS Request:', {
      method: req.method,
      url: req.url,
      origin: origin,
      headers: req.headers
    });
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Origin, Pragma');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS Preflight request handled for:', req.url);
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}

// Static file serving for uploads - BEFORE CORS to ensure proper headers
app.use('/uploads', (req, res, next) => {
  // Apply CORS headers to static file requests
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Origin, Pragma');
  
  // Fix Cross-Origin-Resource-Policy for images and other static files
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Remove X-Frame-Options to allow iframe embedding
  res.removeHeader('X-Frame-Options');
  
  // Set proper content type for PDF files
  if (req.url.toLowerCase().endsWith('.pdf')) {
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', 'inline');
    // Remove CSP for PDF files to allow iframe embedding
    res.removeHeader('Content-Security-Policy');
  }
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS Preflight request handled for static file:', req.url);
    res.sendStatus(200);
  } else {
    next();
  }
}, express.static(path.join(__dirname, '../uploads')));

// Special route for PDF files to ensure proper headers
app.get('/uploads/*.pdf', (req, res, next) => {
  // Set headers specifically for PDF files
  res.header('Content-Type', 'application/pdf');
  res.header('Content-Disposition', 'inline');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Remove any blocking headers
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  
  next();
});

// API routes with versioning
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Mathematico API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin'
    }
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server function
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/health`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🗄️  Database: ${process.env.DB_DATABASE || 'mathematico'}`);
      console.log(`👤 Admin Email: ${process.env.ADMIN_EMAIL || 'dc2006089@gmail.com'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
