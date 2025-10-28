const express = require('express');
const router = express.Router();

// Import mobile controller
const mobileController = require('../controllers/mobileController');
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

// App info
router.get('/app-info', mobileController.getAppInfo);

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
router.post('/payments/create-order', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    
    // Simple order creation for demo
    const order = {
      id: `order_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      status: 'created',
      notes: notes || {}
    };
    
    res.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

router.post('/payments/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Simple verification for demo (in production, verify signature)
    res.json({
      success: true,
      data: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        verified: true
      },
      message: 'Payment verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

router.get('/payments/config', (req, res) => {
  res.json({
    success: true,
    data: {
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_REPhtJhKrjuo5z',
      currency: 'INR',
      name: 'Mathematico',
      description: 'Educational Platform',
      theme: { color: '#3399cc' }
    },
    message: 'Configuration retrieved successfully'
  });
});

router.get('/payments/history', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Payment history retrieved successfully'
  });
});

module.exports = router;