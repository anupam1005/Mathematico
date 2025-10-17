const express = require('express');
const router = express.Router();

// Import mobile controller (fallback to no-op handlers if missing)
let mobileController;
try {
  mobileController = require('../controllers/mobileController');
  console.log('✅ MobileController loaded successfully');
} catch (error) {
  console.warn('⚠️ MobileController not available, using fallback handlers');
  mobileController = {
    getAllBooks: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    getBookById: (req, res) => res.status(404).json({ success: false, message: 'Book not found (fallback)' }),
    getAllCourses: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    getCourseById: (req, res) => res.status(404).json({ success: false, message: 'Course not found (fallback)' }),
    getAllLiveClasses: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    getLiveClassById: (req, res) => res.status(404).json({ success: false, message: 'Live class not found (fallback)' }),
    search: (req, res) => res.json({ success: true, data: { books: [], courses: [], liveClasses: [] }, source: 'fallback' }),
    getFeaturedContent: (req, res) => res.json({ success: true, data: { books: [], courses: [], liveClasses: [] }, source: 'fallback' }),
    getAppInfo: (req, res) => res.json({ success: true, data: { version: 'fallback', status: 'ok' } })
  };
}

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