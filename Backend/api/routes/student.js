const express = require('express');
const router = express.Router();

// Import controllers
const studentController = require('../../controllers/studentController');

// Import middleware
const { authenticateToken, requireUser } = require('../../middlewares/auth');

// Test route (no auth required)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student API is working!',
    note: 'Authentication required for other endpoints',
    endpoints: {
      dashboard: 'GET /api/student/dashboard',
      courses: 'GET /api/student/courses',
      books: 'GET /api/student/books',
      liveClasses: 'GET /api/student/live-classes'
    },
    timestamp: new Date().toISOString()
  });
});

// All student routes require authentication and user role
router.use(authenticateToken);
router.use(requireUser);

// Student dashboard
router.get('/dashboard', studentController.getDashboard);

// Student courses
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseById);
router.post('/courses/:id/enroll', studentController.enrollInCourse);

// Student books
router.get('/books', studentController.getBooks);
router.get('/books/:id', studentController.getBookById);
router.post('/books/:id/purchase', studentController.purchaseBook);

// Student live classes
router.get('/live-classes', studentController.getLiveClasses);
router.get('/live-classes/:id', studentController.getLiveClassById);
router.post('/live-classes/:id/enroll', studentController.enrollInLiveClass);

// Student progress
router.get('/progress/:courseId', studentController.getCourseProgress);
router.put('/progress/:courseId', studentController.updateCourseProgress);

// Student notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationAsRead);

module.exports = router;
