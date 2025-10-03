const express = require('express');
const router = express.Router();

// Import mobile controller
const mobileController = require('../controllers/mobileController');
console.log('✅ MobileController loaded successfully');

// ============= ROUTE DEFINITIONS =============

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Book routes
router.get('/books', mobileController.getAllBooks);
router.get('/books/:id', mobileController.getBookById);

// Course routes
router.get('/courses', mobileController.getAllCourses);
router.get('/courses/:id', mobileController.getCourseById);

// Live class routes
router.get('/live-classes', mobileController.getAllLiveClasses);
router.get('/live-classes/:id', mobileController.getLiveClassById);

// Search routes
router.get('/search', mobileController.search);

// Featured content
router.get('/featured', mobileController.getFeaturedContent);

// App info
router.get('/app-info', mobileController.getAppInfo);

module.exports = router;