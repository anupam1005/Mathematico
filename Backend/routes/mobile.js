const express = require('express');
const router = express.Router();

// Import mobile controller with fallback
let mobileController;
try {
  mobileController = require('../controllers/mobileController');
} catch (error) {
  console.warn('MobileController not available, using fallback data');
  // Fallback handlers - no mock data
  mobileController = {
    getAllCourses: (req, res) => {
      res.json({
        success: true,
        data: [],
        message: "No courses available",
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    },
    getCourseById: (req, res) => {
      res.json({
        success: false,
        message: "Course not found"
      });
    },
    getAllBooks: (req, res) => {
      res.json({
        success: true,
        data: [],
        message: "No books available",
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    },
    getBookById: (req, res) => {
      res.json({
        success: false,
        message: "Book not found"
      });
    },
    getAllLiveClasses: (req, res) => {
      res.json({
        success: true,
        data: [],
        message: "No live classes available",
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    },
    getLiveClassById: (req, res) => {
      res.json({
        success: false,
        message: "Live class not found"
      });
    },
    search: (req, res) => {
      res.json({
        success: true,
        data: {
          courses: [],
          books: [],
          liveClasses: []
        },
        message: "No results found",
        query: req.query.q || ''
      });
    },
    getAppInfo: (req, res) => {
      res.json({
        success: true,
        data: {
          version: "2.0.0",
          serverless: true,
          timestamp: new Date().toISOString(),
          status: "running"
        }
      });
    }
  };
}

// Public mobile routes (no auth required)
router.get('/courses', mobileController.getAllCourses);
router.get('/courses/:id', mobileController.getCourseById);
router.get('/books', mobileController.getAllBooks);
router.get('/books/:id', mobileController.getBookById);
router.get('/live-classes', mobileController.getAllLiveClasses);
router.get('/live-classes/:id', mobileController.getLiveClassById);
router.get('/search', mobileController.search);
router.get('/app-info', mobileController.getAppInfo);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile routes are working ✅',
    serverless: true,
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/v1/mobile/courses',
      '/api/v1/mobile/books', 
      '/api/v1/mobile/live-classes',
      '/api/v1/mobile/search',
      '/api/v1/mobile/app-info'
    ]
  });
});

module.exports = router;