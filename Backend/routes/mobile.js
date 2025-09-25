const express = require('express');
const router = express.Router();

// Import mobile controller with fallback
let mobileController;
try {
  mobileController = require('../controllers/mobileController');
} catch (error) {
  console.warn('MobileController not available, using fallback data');
  // Fallback handlers with sample data
  mobileController = {
    getAllCourses: (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: 1,
            title: "Sample Course",
            description: "This is sample data - database not connected",
            price: 99.99,
            level: "Foundation",
            status: "published",
            serverless: true
          }
        ],
        message: "Sample data - database connection required for real data",
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    },
    getCourseById: (req, res) => {
      res.json({
        success: true,
        data: {
          id: parseInt(req.params.id),
          title: "Sample Course",
          description: "This is sample data - database not connected",
          price: 99.99,
          level: "Foundation",
          status: "published",
          serverless: true
        },
        message: "Sample data - database connection required for real data"
      });
    },
    getAllBooks: (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: 1,
            title: "Sample Book",
            author: "Sample Author",
            description: "This is sample data - database not connected",
            level: "Foundation",
            status: "published",
            serverless: true
          }
        ],
        message: "Sample data - database connection required for real data",
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    },
    getBookById: (req, res) => {
      res.json({
        success: true,
        data: {
          id: parseInt(req.params.id),
          title: "Sample Book",
          author: "Sample Author",
          description: "This is sample data - database not connected",
          level: "Foundation",
          status: "published",
          serverless: true
        },
        message: "Sample data - database connection required for real data"
      });
    },
    getAllLiveClasses: (req, res) => {
      res.json({
        success: true,
        data: [
          {
            id: 1,
            title: "Sample Live Class",
            description: "This is sample data - database not connected",
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: "scheduled",
            serverless: true
          }
        ],
        message: "Sample data - database connection required for real data",
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      });
    },
    getLiveClassById: (req, res) => {
      res.json({
        success: true,
        data: {
          id: parseInt(req.params.id),
          title: "Sample Live Class",
          description: "This is sample data - database not connected",
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "scheduled",
          serverless: true
        },
        message: "Sample data - database connection required for real data"
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
        message: "Search requires database connection",
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