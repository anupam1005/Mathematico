const express = require('express');
const router = express.Router();

// Import controllers
const studentController = require('../../controllers/studentController');

// Import middleware
const { authenticateToken, requireActiveUser } = require('../../middlewares/authMiddleware');

// Test route (no auth required)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student API is working!',
    note: 'Authentication required for enrollment/purchase actions',
    endpoints: {
      dashboard: 'GET /api/student/dashboard',
      courses: 'GET /api/student/courses',
      books: 'GET /api/student/books',
      liveClasses: 'GET /api/student/live-classes'
    },
    timestamp: new Date().toISOString()
  });
});

// Public routes (no authentication required for browsing)
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseById);
router.get('/books', studentController.getBooks);
router.get('/books/:id', studentController.getBookById);
router.get('/live-classes', studentController.getLiveClasses);
router.get('/live-classes/:id', studentController.getLiveClassById);

// Protected routes (require authentication)
router.use(authenticateToken);
router.use(requireActiveUser);

// Student dashboard
router.get('/dashboard', studentController.getDashboard);

// Enrollment and purchase actions (require authentication)
router.post('/courses/:id/enroll', studentController.enrollInCourse);
router.post('/books/:id/purchase', studentController.purchaseBook);
router.post('/live-classes/:id/enroll', studentController.enrollInLiveClass);

// Student progress
router.get('/progress/:courseId', studentController.getCourseProgress);
router.put('/progress/:courseId', studentController.updateCourseProgress);

// Student notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationAsRead);

module.exports = router;
