const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { strictAuthenticateToken } = require('../middleware/strictJwtAuth');

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payments API',
    endpoints: {
      config: '/config',
      createOrder: '/create-order',
      verify: '/verify',
      history: '/history'
    },
    timestamp: new Date().toISOString()
  });
});

// Get Razorpay configuration (public endpoint - no auth required)
router.get('/config', paymentController.getRazorpayConfig);

// Apply authentication middleware to protected payment routes
router.use(strictAuthenticateToken);

// Create Razorpay order
router.post('/create-order', paymentController.createOrder);

// Verify payment
router.post('/verify', paymentController.verifyPayment);

// Get payment details
router.get('/payment/:paymentId', paymentController.getPaymentDetails);

// Get order details
router.get('/order/:orderId', paymentController.getOrderDetails);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
