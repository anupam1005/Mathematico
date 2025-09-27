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
    getAllUsers: fallbackHandler,
    getUserById: fallbackHandler,
    updateUser: fallbackHandler,
    deleteUser: fallbackHandler,
    updateUserStatus: fallbackHandler,
    getAllBooks: fallbackHandler,
    getBookById: fallbackHandler,
    createBook: fallbackHandler,
    updateBook: fallbackHandler,
    deleteBook: fallbackHandler,
    updateBookStatus: fallbackHandler,
    getAllCourses: fallbackHandler,
    getCourseById: fallbackHandler,
    createCourse: fallbackHandler,
    updateCourse: fallbackHandler,
    deleteCourse: fallbackHandler,
    updateCourseStatus: fallbackHandler,
    getAllLiveClasses: fallbackHandler,
    getLiveClassById: fallbackHandler,
    createLiveClass: fallbackHandler,
    updateLiveClass: fallbackHandler,
    deleteLiveClass: fallbackHandler,
    updateLiveClassStatus: fallbackHandler,
    getAllPayments: fallbackHandler,
    getPaymentById: fallbackHandler,
    updatePaymentStatus: fallbackHandler,
    uploadFile: fallbackHandler,
    getBookStats: fallbackHandler,
    getCourseStats: fallbackHandler,
    getLiveClassStats: fallbackHandler,
    getSettings: fallbackHandler,
    updateSettings: fallbackHandler,
    uploadCourseThumbnail: fallbackHandler,
    toggleCoursePublish: fallbackHandler,
    getPaymentStats: fallbackHandler
  };
}

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard routes
router.get('/dashboard', adminController.getDashboard);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.updateUserStatus);

// Book management routes
router.get('/books', adminController.getAllBooks);
router.get('/books/:id', adminController.getBookById);
router.post('/books', adminController.createBook);
router.put('/books/:id', adminController.updateBook);
router.delete('/books/:id', adminController.deleteBook);
router.put('/books/:id/status', adminController.updateBookStatus);

// Course management routes
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', adminController.createCourse);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.put('/courses/:id/status', adminController.updateCourseStatus);
router.post('/courses/upload-thumbnail', adminController.uploadCourseThumbnail);
router.patch('/courses/:id/toggle-publish', adminController.toggleCoursePublish);

// Live class management routes
router.get('/live-classes', adminController.getAllLiveClasses);
router.get('/live-classes/:id', adminController.getLiveClassById);
router.post('/live-classes', adminController.createLiveClass);
router.put('/live-classes/:id', adminController.updateLiveClass);
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
    message: 'Admin routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;