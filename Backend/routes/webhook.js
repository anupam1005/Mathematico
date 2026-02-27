const express = require('express');
const router = express.Router();
const { handleRazorpayWebhook } = require('../controllers/webhookController');
const { createWebhookRateLimiter } = require('../middleware/webhookRateLimiter');

// Raw body parser middleware for webhook verification
// This must be used BEFORE express.json() for webhook routes
const rawBodyParser = express.raw({ type: 'application/json' });

// Webhook endpoint with raw body parsing and rate limiting
router.post('/razorpay', 
  rawBodyParser,
  createWebhookRateLimiter(),
  handleRazorpayWebhook
);

// Webhook health check
router.get('/razorpay/health', (req, res) => {
  res.json({
    success: true,
    message: 'Razorpay webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
