const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/auth');

// Get Razorpay configuration (public endpoint - no auth required)
router.get('/config', paymentController.getRazorpayConfig);

// Apply authentication middleware to protected payment routes
router.use(authenticateToken);

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
