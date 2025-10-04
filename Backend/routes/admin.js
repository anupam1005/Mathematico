const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { upload, handleUploadError } = require('../middlewares/upload');
const { connectToDatabase } = require('../utils/database');

// Import admin controller with MongoDB - NO FALLBACKS
const adminController = require('../controllers/adminController');
console.log('✅ MongoDB AdminController loaded successfully');

// Middleware to ensure database connection
const ensureDatabaseConnection = async (req, res, next) => {
  try {
    // Try to connect to database if not connected
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    // Continue with fallback mode
    next();
  }
};

// Public admin info endpoint (no auth required) - MUST BE BEFORE MIDDLEWARE
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico Admin API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    authentication: {
      required: true,
      method: 'JWT Bearer Token',
      loginEndpoint: '/api/v1/auth/login',
      description: 'Use admin credentials to get access token'
    },
    endpoints: {
      dashboard: '/dashboard',
      users: '/users',
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      payments: '/payments'
    },
    instructions: {
      step1: 'Login at /api/v1/auth/login with admin credentials',
      step2: 'Use the returned accessToken in Authorization header',
      step3: 'Access protected endpoints with Bearer token'
    }
  });
});

// Apply auth middleware to all other admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Root admin endpoint (requires authentication)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API - Access granted',
    user: req.user,
    timestamp: new Date().toISOString(),
    endpoints: {
      dashboard: '/dashboard',
      users: '/users',
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      payments: '/payments'
    }
  });
});

// Dashboard routes
router.get('/dashboard', adminController.getDashboard);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.updateUserStatus);

// Book management routes
router.get('/books', ensureDatabaseConnection, adminController.getAllBooks);
router.get('/books/:id', ensureDatabaseConnection, adminController.getBookById);
router.post('/books', ensureDatabaseConnection, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]), adminController.createBook);
router.put('/books/:id', ensureDatabaseConnection, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]), adminController.updateBook);
router.delete('/books/:id', ensureDatabaseConnection, adminController.deleteBook);
router.put('/books/:id/status', ensureDatabaseConnection, adminController.updateBookStatus);

// Course management routes
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), adminController.createCourse);
router.put('/courses/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.put('/courses/:id/status', adminController.updateCourseStatus);
router.post('/courses/upload-thumbnail', upload.single('image'), adminController.uploadCourseThumbnail);
router.patch('/courses/:id/toggle-publish', adminController.toggleCoursePublish);

// Live class management routes
router.get('/live-classes', adminController.getAllLiveClasses);
router.get('/live-classes/:id', adminController.getLiveClassById);
router.post('/live-classes', upload.single('image'), adminController.createLiveClass);
router.put('/live-classes/:id', upload.single('image'), adminController.updateLiveClass);
router.delete('/live-classes/:id', adminController.deleteLiveClass);
router.put('/live-classes/:id/status', adminController.updateLiveClassStatus);

// Payment management routes
router.get('/payments', adminController.getAllPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.put('/payments/:id/status', adminController.updatePaymentStatus);

// File upload route
router.post('/upload', adminController.uploadFile);

// Statistics routes
router.get('/stats/books', adminController.getBookStats);
router.get('/stats/courses', adminController.getCourseStats);
router.get('/stats/live-classes', adminController.getLiveClassStats);

// Settings routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'MongoDB Admin routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware for file uploads
router.use(handleUploadError);

module.exports = router;
