const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

// Import controllers
const mobileController = require('../controllers/mobileController');
const paymentController = require('../controllers/paymentController');
const profileController = require('../controllers/profileController');
const studentController = require('../controllers/studentController');
console.log('✅ MobileController loaded successfully');

// ============= ROUTE DEFINITIONS =============

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API',
    endpoints: {
      health: '/health',
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      settings: '/settings',
      payments: '/payments'
    },
    timestamp: new Date().toISOString()
  });
});

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
router.get('/books/:id/viewer', mobileController.getSecurePdfViewer);
router.get('/books/:id/stream', mobileController.streamSecurePdf);

// Course routes
router.get('/courses', mobileController.getAllCourses);
router.get('/courses/:id', mobileController.getCourseById);
router.post('/courses/:id/enroll', authenticateToken, mobileController.enrollInCourse);

// Enrollment routes
router.get('/enrollments', authenticateToken, mobileController.getEnrollments);
router.get('/enrollments/:id', authenticateToken, mobileController.getEnrollmentById);
router.put('/enrollments/:id', authenticateToken, mobileController.updateEnrollmentStatus);
router.delete('/enrollments/:id', authenticateToken, mobileController.cancelEnrollment);
router.get('/enrollments/:id/progress', authenticateToken, mobileController.getEnrollmentProgress);
router.post('/enrollments/:id/lessons/:lessonId/complete', authenticateToken, mobileController.markLessonComplete);

// Live class routes
router.get('/live-classes', mobileController.getAllLiveClasses);
router.get('/live-classes/:id', mobileController.getLiveClassById);
router.put('/live-classes/:id/start', mobileController.startLiveClass);
router.put('/live-classes/:id/end', mobileController.endLiveClass);
router.post('/live-classes/:id/join', authenticateToken, studentController.joinLiveClass);

// Search routes
router.get('/search', mobileController.search);

// Featured content
router.get('/featured', mobileController.getFeaturedContent);

// Categories
router.get('/categories', mobileController.getCategories);

// App info
router.get('/app-info', mobileController.getAppInfo);
router.get('/info', mobileController.getAppInfo);

// Statistics
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalStudents: 0,
      activeUsers: 0
    },
    message: 'Statistics retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Settings routes
router.get('/settings', authenticateToken, profileController.getUserSettings);

router.put('/settings', authenticateToken, profileController.updateUserSettings);

// Payment routes
router.get('/payments/config', paymentController.getRazorpayConfig);
router.post('/payments/create-order', authenticateToken, paymentController.createOrder);
router.post('/payments/verify', authenticateToken, paymentController.verifyPayment);

// Payment history
router.get('/payments/history', authenticateToken, paymentController.getPaymentHistory);

module.exports = router;