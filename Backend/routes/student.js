const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Import student controller with fallback
let studentController;
try {
  studentController = require('../controllers/studentController');
} catch (error) {
  console.warn('StudentController not available, using fallback handlers');
  // Fallback handlers
  const fallbackHandler = (req, res) => res.status(503).json({ 
    success: false, 
    message: 'Student service temporarily unavailable - database connection required',
    serverless: true
  });
  
  studentController = {
    getCourses: fallbackHandler,
    getCourseById: fallbackHandler,
    enrollInCourse: fallbackHandler,
    getBooks: fallbackHandler,
    getBookById: fallbackHandler,
    purchaseBook: fallbackHandler,
    getLiveClasses: fallbackHandler,
    getLiveClassById: fallbackHandler,
    enrollInLiveClass: fallbackHandler,
    getCourseProgress: fallbackHandler,
    updateCourseProgress: fallbackHandler,
    getNotifications: fallbackHandler,
    markNotificationAsRead: fallbackHandler
  };
}

// Apply auth middleware to all student routes
router.use(authenticateToken);

// Student course routes
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseById);
router.post('/courses/:id/enroll', studentController.enrollInCourse);

// Student book routes  
router.get('/books', studentController.getBooks);
router.get('/books/:id', studentController.getBookById);
router.post('/books/:id/purchase', studentController.purchaseBook);
router.get('/books/stats', studentController.getBookStats);

// Student live class routes
router.get('/live-classes', studentController.getLiveClasses);
router.get('/live-classes/:id', studentController.getLiveClassById);
router.post('/live-classes/:id/enroll', studentController.enrollInLiveClass);

// Student progress routes
router.get('/progress/:courseId', studentController.getCourseProgress);
router.put('/progress/:courseId', studentController.updateCourseProgress);

// Student notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationAsRead);

// Student personal data endpoints
router.get('/my-courses', studentController.getMyCourses);
router.get('/my-books', studentController.getMyBooks);
router.get('/my-live-classes', studentController.getMyLiveClasses);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Student routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;