const express = require('express');
const router = express.Router();

// Import controllers
const mobileController = require('../controllers/mobileController');
const paymentController = require('../controllers/paymentController');
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

// Live class routes
router.get('/live-classes', mobileController.getAllLiveClasses);
router.get('/live-classes/:id', mobileController.getLiveClassById);
router.put('/live-classes/:id/start', mobileController.startLiveClass);
router.put('/live-classes/:id/end', mobileController.endLiveClass);
router.post('/live-classes/:id/join', (req, res) => {
  const { id } = req.params;
  console.log('📱 Student joining live class:', id);
  res.json({
    success: true,
    data: {
      joinLink: 'https://meet.google.com/sample-meeting-link',
      message: 'Join link generated successfully'
    },
    message: 'Ready to join live class'
  });
});

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
router.get('/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      pushNotifications: true,
      emailNotifications: true,
      courseUpdates: true,
      liveClassReminders: true,
      darkMode: false,
      autoPlayVideos: true,
      downloadQuality: 'High',
      language: 'en',
      timezone: 'UTC',
      theme: 'light'
    },
    message: 'Settings retrieved successfully (mock data)'
  });
});

router.put('/settings', (req, res) => {
  const settings = req.body;
  console.log('📱 Mobile settings update:', settings);
  res.json({
    success: true,
    message: 'Settings updated successfully (mock response)',
    data: settings
  });
});

// Payment routes
router.post('/payments/create-order', paymentController.createOrder);
router.post('/payments/verify', paymentController.verifyPayment);
router.get('/payments/config', paymentController.getRazorpayConfig);

// Payment history
router.get('/payments/history', paymentController.getPaymentHistory);

module.exports = router;