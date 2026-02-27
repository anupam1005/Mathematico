const crypto = require('crypto');
const { Payment, Course, Book, LiveClass, User } = require('../models');
const { isRazorpayEnabled } = require('../utils/featureFlags');
const securityLogger = require('../utils/securityLogger');

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET not configured');
  }
  
  if (!signature) {
    throw new Error('Missing x-razorpay-signature header');
  }
  
  // DEBUG: Confirm rawBody is a Buffer
  console.log('[WEBHOOK DEBUG] rawBody type:', typeof rawBody);
  console.log('[WEBHOOK DEBUG] rawBody is Buffer:', Buffer.isBuffer(rawBody));
  console.log('[WEBHOOK DEBUG] rawBody length:', rawBody ? rawBody.length : 'null/undefined');
  console.log('[WEBHOOK DEBUG] received signature:', signature ? signature.substring(0, 20) + '...' : 'null');
  
  if (!Buffer.isBuffer(rawBody)) {
    throw new Error('rawBody is not a Buffer - body parser middleware order issue');
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
    
  console.log('[WEBHOOK DEBUG] expected signature:', expectedSignature.substring(0, 20) + '...');
  console.log('[WEBHOOK DEBUG] signatures match:', expectedSignature === signature);
  
  return expectedSignature === signature;
};

/**
 * Sanitize webhook payload for storage
 */
const sanitizeWebhookPayload = (payload) => {
  const sanitized = { ...payload };
  
  // Remove sensitive fields from payload before storage
  if (sanitized.payload && sanitized.payload.payment && sanitized.payload.payment.entity) {
    const payment = sanitized.payload.payment.entity;
    delete payment.card_id;
    delete payment.bank;
    delete payment.wallet;
    delete payment.vpa;
    delete payment.email;
    delete payment.contact;
  }
  
  return sanitized;
};

/**
 * Process payment.captured event
 */
const processPaymentCaptured = async (event) => {
  const payment = event.payload.payment.entity;
  const { payment_id, order_id, amount, currency, notes } = payment;
  
  // Extract required information from notes
  const { courseId, bookId, liveClassId, userId, itemType } = notes || {};
  
  if (!userId || (!courseId && !bookId && !liveClassId) || !itemType) {
    throw new Error('Missing required information in payment notes');
  }
  
  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  
  let item, expectedAmount;
  
  // Validate item and get expected amount
  switch (itemType) {
    case 'course':
      if (!courseId) throw new Error('courseId required for course payment');
      item = await Course.findById(courseId);
      if (!item) throw new Error(`Course not found: ${courseId}`);
      if (!item.isPublished) throw new Error(`Course not published: ${courseId}`);
      expectedAmount = item.price * 100; // Convert to paise
      break;
      
    case 'book':
      if (!bookId) throw new Error('bookId required for book payment');
      item = await Book.findById(bookId);
      if (!item) throw new Error(`Book not found: ${bookId}`);
      expectedAmount = item.price * 100; // Convert to paise
      break;
      
    case 'live_class':
      if (!liveClassId) throw new Error('liveClassId required for live class payment');
      item = await LiveClass.findById(liveClassId);
      if (!item) throw new Error(`Live class not found: ${liveClassId}`);
      expectedAmount = item.price * 100; // Convert to paise
      break;
      
    default:
      throw new Error(`Invalid itemType: ${itemType}`);
  }
  
  // Validate amount matches expected price
  if (amount !== expectedAmount) {
    throw new Error(`Amount mismatch: expected ${expectedAmount}, got ${amount}`);
  }
  
  // Validate currency
  if (currency !== 'INR') {
    throw new Error(`Invalid currency: ${currency}. Only INR supported`);
  }
  
  // Check if payment already processed (idempotency check)
  const existingPayment = await Payment.isPaymentProcessed(payment_id, order_id);
  if (existingPayment) {
    return { alreadyProcessed: true, payment: existingPayment };
  }
  
  // Create payment record
  const paymentRecord = new Payment({
    paymentId: payment_id,
    orderId: order_id,
    status: 'captured',
    amount: amount,
    currency: currency,
    userId: userId,
    courseId: courseId || null,
    bookId: bookId || null,
    liveClassId: liveClassId || null,
    itemType: itemType,
    webhookPayload: sanitizeWebhookPayload({ event }),
    processedAt: new Date()
  });
  
  await paymentRecord.save();
  
  // Enroll user in the item
  try {
    switch (itemType) {
      case 'course':
        await item.enrollStudent(userId);
        break;
      case 'book':
        await item.purchaseBook(userId);
        break;
      case 'live_class':
        await item.enrollStudent(userId);
        break;
    }
  } catch (enrollmentError) {
    // Don't fail the payment if enrollment fails, but log it
    console.error(`Enrollment failed for user ${userId} in ${itemType} ${item._id}:`, enrollmentError);
    securityLogger.logSecurityEvent({
      eventType: 'WEBHOOK_ENROLLMENT_FAILED',
      userId,
      itemType,
      itemId: item._id,
      paymentId: payment_id,
      orderId: order_id,
      error: enrollmentError.message
    });
  }
  
  return { alreadyProcessed: false, payment: paymentRecord };
};

/**
 * Process payment.failed event
 */
const processPaymentFailed = async (event) => {
  const payment = event.payload.payment.entity;
  const { payment_id, order_id, amount, currency, notes } = payment;
  const { errorCode, errorDescription, source } = payment;
  
  const { courseId, bookId, liveClassId, userId, itemType } = notes || {};
  
  // Check if payment already processed
  const existingPayment = await Payment.isPaymentProcessed(payment_id, order_id);
  if (existingPayment) {
    return { alreadyProcessed: true };
  }
  
  // Create failed payment record
  const paymentRecord = new Payment({
    paymentId: payment_id,
    orderId: order_id,
    status: 'failed',
    amount: amount,
    currency: currency,
    userId: userId || null,
    courseId: courseId || null,
    bookId: bookId || null,
    liveClassId: liveClassId || null,
    itemType: itemType || 'unknown',
    webhookPayload: sanitizeWebhookPayload({ event }),
    processedAt: new Date(),
    failureReason: `${errorCode}: ${errorDescription} (${source})`
  });
  
  await paymentRecord.save();
  
  return { alreadyProcessed: false, payment: paymentRecord };
};

/**
 * Process order.paid event
 */
const processOrderPaid = async (event) => {
  const order = event.payload.order.entity;
  const { id: order_id, amount, currency, notes } = order;
  
  // This event is less reliable than payment.captured, so we use it for logging only
  securityLogger.logSecurityEvent({
    eventType: 'WEBHOOK_ORDER_PAID_RECEIVED',
    orderId: order_id,
    amount,
    currency,
    notes
  });
  
  return { processed: true };
};

/**
 * Main webhook handler
 */
const handleRazorpayWebhook = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      securityLogger.logSecurityEvent({
        eventType: 'WEBHOOK_FEATURE_DISABLED',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        reason: 'RAZORPAY_DISABLED'
      });
      
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED'
      });
    }
    
    // Get raw body and signature
    const rawBody = req.body;
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    try {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        securityLogger.logSecurityEvent({
          eventType: 'WEBHOOK_SIGNATURE_VERIFICATION_FAILED',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          signature: signature ? signature.substring(0, 20) + '...' : 'null', // Log partial signature for debugging
          bodyLength: rawBody ? rawBody.length : 0
        });
        
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
          error: 'INVALID_SIGNATURE'
        });
      }
    } catch (signatureError) {
      securityLogger.logSecurityEvent({
        eventType: 'WEBHOOK_SIGNATURE_ERROR',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        error: signatureError.message
      });
      
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed',
        error: 'SIGNATURE_ERROR'
      });
    }
    
    // Parse webhook event from Buffer AFTER successful signature verification
    let event;
    try {
      const rawBodyString = rawBody.toString('utf8');
      console.log('[WEBHOOK DEBUG] rawBody as string length:', rawBodyString.length);
      console.log('[WEBHOOK DEBUG] rawBody as string preview:', rawBodyString.substring(0, 200) + '...');
      event = JSON.parse(rawBodyString);
    } catch (parseError) {
      securityLogger.logSecurityEvent({
        eventType: 'WEBHOOK_PARSE_ERROR',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        error: parseError.message
      });
      
      return res.status(200).json({
        success: false,
        message: 'Invalid webhook payload',
        error: 'INVALID_PAYLOAD'
      });
    }
    
    const { event: eventType } = event;
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Missing event type in webhook payload',
        error: 'MISSING_EVENT_TYPE'
      });
    }
    
    // Process event based on type
    let result;
    switch (eventType) {
      case 'payment.captured':
        result = await processPaymentCaptured(event);
        break;
        
      case 'payment.failed':
        result = await processPaymentFailed(event);
        break;
        
      case 'order.paid':
        result = await processOrderPaid(event);
        break;
        
      default:
        // Log unknown event types but don't fail
        securityLogger.logSecurityEvent({
          eventType: 'WEBHOOK_UNKNOWN_EVENT',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          webhookEventType: eventType
        });
        
        return res.status(200).json({
          success: true,
          message: 'Event received but not processed',
          eventType,
          timestamp: new Date().toISOString()
        });
    }
    
    // Log successful processing
    securityLogger.logSecurityEvent({
      eventType: 'WEBHOOK_PROCESSED',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      webhookEventType: eventType,
      processingTime: Date.now() - startTime,
      alreadyProcessed: result.alreadyProcessed || false
    });
    
    // Always return 200 for valid webhooks
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      eventType,
      alreadyProcessed: result.alreadyProcessed || false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('Webhook processing error:', error);
    securityLogger.logSecurityEvent({
      eventType: 'WEBHOOK_PROCESSING_ERROR',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
      processingTime
    });
    
    // Always return 200 for webhooks to prevent retries on processed events
    // unless it's a signature verification error
    if (error.message.includes('signature') || error.message.includes('RAZORPAY_WEBHOOK_SECRET')) {
      return res.status(400).json({
        success: false,
        message: 'Webhook verification failed',
        error: 'VERIFICATION_ERROR'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Webhook received with processing error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  handleRazorpayWebhook
};
