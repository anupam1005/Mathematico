const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// Import admin controller with fallback
let adminController;
try {
  adminController = require('../controllers/adminController');
} catch (error) {
  console.warn('AdminController not available, using fallback handlers');
  // Fallback handlers
  const fallbackHandler = (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Admin service temporarily unavailable - database connection required',
    serverless: true
  });
  
  adminController = {
    getDashboard: fallbackHandler,
    getUsers: fallbackHandler,
    createUser: fallbackHandler,
    updateUser: fallbackHandler,
    deleteUser: fallbackHandler,
    updateUserStatus: fallbackHandler,
    getBooks: fallbackHandler,
    createBook: fallbackHandler,
    updateBook: fallbackHandler,
    deleteBook: fallbackHandler,
    updateBookStatus: fallbackHandler,
    getCourses: fallbackHandler,
    createCourse: fallbackHandler,
    updateCourse: fallbackHandler,
    deleteCourse: fallbackHandler,
    updateCourseStatus: fallbackHandler,
    getLiveClasses: fallbackHandler,
    createLiveClass: fallbackHandler,
    updateLiveClass: fallbackHandler,
    deleteLiveClass: fallbackHandler,
    updateLiveClassStatus: fallbackHandler,
    getPayments: fallbackHandler,
    updatePaymentStatus: fallbackHandler,
    uploadFile: fallbackHandler,
    getBookStats: fallbackHandler,
    getCourseStats: fallbackHandler,
    getLiveClassStats: fallbackHandler,
    getSettings: fallbackHandler,
    updateSettings: fallbackHandler
  };
}

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard', adminController.getDashboard);

// User management routes
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.updateUserStatus);

// Book management routes
router.get('/books', adminController.getBooks);
router.post('/books', adminController.createBook);
router.put('/books/:id', adminController.updateBook);
router.delete('/books/:id', adminController.deleteBook);
router.put('/books/:id/status', adminController.updateBookStatus);

// Course management routes
router.get('/courses', adminController.getCourses);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.put('/courses/:id/status', adminController.updateCourseStatus);

// Live class management routes
router.get('/live-classes', adminController.getLiveClasses);
router.post('/live-classes', adminController.createLiveClass);
router.put('/live-classes/:id', adminController.updateLiveClass);
router.delete('/live-classes/:id', adminController.deleteLiveClass);
router.put('/live-classes/:id/status', adminController.updateLiveClassStatus);

// Payment management routes
router.get('/payments', adminController.getPayments);
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
    message: 'Admin routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;