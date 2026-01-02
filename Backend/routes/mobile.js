const express = require('express');
const router = express.Router();

<<<<<<< HEAD
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

=======
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

>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
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
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

// Search routes
router.get('/search', mobileController.search);

// Featured content
router.get('/featured', mobileController.getFeaturedContent);

<<<<<<< HEAD
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
=======
// App info
router.get('/app-info', mobileController.getAppInfo);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

module.exports = router;