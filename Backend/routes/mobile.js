const express = require('express');
const router = express.Router();
const { strictAuthenticateToken, strictRequireAdmin } = require('../middleware/strictJwtAuth');

// Import controllers
const mobileController = require('../controllers/mobileController');
const paymentController = require('../controllers/paymentController');
const profileController = require('../controllers/profileController');
const studentController = require('../controllers/studentController');
if (process.env.NODE_ENV !== 'production' && !global.controllersLoaded) {
  console.log('✅ MobileController loaded successfully');
  global.controllersLoaded = true;
}

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
router.post('/courses/:id/enroll', strictAuthenticateToken, mobileController.enrollInCourse);

// Enrollment routes
router.get('/enrollments', strictAuthenticateToken, mobileController.getEnrollments);
router.get('/enrollments/:id', strictAuthenticateToken, mobileController.getEnrollmentById);
router.put('/enrollments/:id', strictAuthenticateToken, mobileController.updateEnrollmentStatus);
router.delete('/enrollments/:id', strictAuthenticateToken, mobileController.cancelEnrollment);
router.get('/enrollments/:id/progress', strictAuthenticateToken, mobileController.getEnrollmentProgress);
router.post('/enrollments/:id/lessons/:lessonId/complete', strictAuthenticateToken, mobileController.markLessonComplete);

// Live class routes
router.get('/live-classes', mobileController.getAllLiveClasses);
router.get('/live-classes/:id', mobileController.getLiveClassById);
// Starting/ending classes is an admin action
router.put('/live-classes/:id/start', strictAuthenticateToken, strictRequireAdmin, mobileController.startLiveClass);
router.put('/live-classes/:id/end', strictAuthenticateToken, strictRequireAdmin, mobileController.endLiveClass);
router.post('/live-classes/:id/join', strictAuthenticateToken, studentController.joinLiveClass);

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
router.get('/settings', strictAuthenticateToken, profileController.getUserSettings);

router.put('/settings', strictAuthenticateToken, profileController.updateUserSettings);

// Payment routes
router.get('/payments/config', paymentController.getRazorpayConfig);
router.post('/payments/create-order', strictAuthenticateToken, paymentController.createOrder);
router.post('/payments/verify', strictAuthenticateToken, paymentController.verifyPayment);

// Payment history
router.get('/payments/history', strictAuthenticateToken, paymentController.getPaymentHistory);

module.exports = router;