const Razorpay = require('razorpay');
const crypto = require('crypto');
const { isRazorpayEnabled } = require('../utils/featureFlags');
const securityLogger = require('../utils/securityLogger');

// Initialize Razorpay with environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Don't throw on startup - fail gracefully when payment is attempted
let razorpay = null;
if (keyId && keySecret) {
  try {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Razorpay initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error.message);
    razorpay = null;
  }
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Razorpay credentials not configured. Payment features will be unavailable.');
  }
}

/**
 * Create Razorpay order
 */
const createOrder = async (req, res) => {
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      securityLogger.logSecurityEvent({
        eventType: 'PAYMENT_FEATURE_DISABLED',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        reason: 'RAZORPAY_DISABLED'
      });
      
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    
    const { amount, currency = 'INR', receipt, notes, courseId, itemType } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required (must be greater than 0)',
        error: 'INVALID_AMOUNT',
        timestamp: new Date().toISOString()
      });
    }

    // Verify Razorpay is initialized
    if (!razorpay || !razorpay.orders) {
      securityLogger.logSecurityEvent({
        eventType: 'PAYMENT_SERVICE_UNAVAILABLE',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        reason: 'RAZORPAY_NOT_INITIALIZED'
      });
      
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.',
        error: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    // Validate course and get server-side price if courseId provided
    let validatedAmount = amount;
    if (courseId) {
      try {
        const Course = require('../models/Course');
        const course = await Course.findById(courseId).select('title price isPublished');
        
        if (!course) {
          return res.status(404).json({
            success: false,
            message: 'Course not found',
            error: 'COURSE_NOT_FOUND',
            timestamp: new Date().toISOString()
          });
        }
        
        if (!course.isPublished) {
          return res.status(400).json({
            success: false,
            message: 'Course is not available for purchase',
            error: 'COURSE_NOT_PUBLISHED',
            timestamp: new Date().toISOString()
          });
        }
        
        // Use server-side price to prevent tampering
        if (course.price && course.price > 0) {
          validatedAmount = course.price;
          if (Math.abs(validatedAmount - amount) > 0.01) {
            securityLogger.logSecurityEvent({
              eventType: 'PAYMENT_TAMPERING_ATTEMPT',
              userId: req.user?.id || 'anonymous',
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              url: req.originalUrl,
              courseId,
              expectedAmount: validatedAmount,
              providedAmount: amount
            });
          }
        }
      } catch (courseError) {
        console.error('Error validating course for payment:', courseError);
        return res.status(500).json({
          success: false,
          message: 'Error validating course information',
          error: 'COURSE_VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(validatedAmount * 100);

    // Ensure receipt is under 40 characters (Razorpay limit)
    const shortReceipt = receipt && receipt.length <= 40 
      ? receipt 
      : `receipt_${Date.now().toString().slice(-8)}`;

    // Build order notes with security information
    const orderNotes = {
      ...notes,
      userId: req.user?.id,
      courseId: courseId || null,
      itemType: itemType || 'course',
      timestamp: new Date().toISOString(),
      ip: req.ip
    };

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: shortReceipt,
      notes: orderNotes
    };

    const order = await razorpay.orders.create(options);
    
    securityLogger.logSecurityEvent({
      eventType: 'PAYMENT_ORDER_CREATED',
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      orderId: order.id,
      amount: amountInPaise,
      currency,
      courseId,
      itemType
    });
    
    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error creating order:', error);
    securityLogger.logSecurityEvent({
      eventType: 'PAYMENT_ORDER_ERROR',
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again or contact support.',
      error: 'ORDER_CREATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify Razorpay payment (READ-ONLY - for status confirmation only)
 * Primary payment processing is handled by webhooks for security
 */
const verifyPayment = async (req, res) => {
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      securityLogger.logSecurityEvent({
        eventType: 'PAYMENT_FEATURE_DISABLED',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        reason: 'RAZORPAY_DISABLED'
      });
      
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is required',
        error: 'MISSING_VERIFICATION_DATA',
        timestamp: new Date().toISOString()
      });
    }

    // Verify Razorpay is initialized before proceeding
    if (!razorpay || !razorpay.orders) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.',
        error: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      securityLogger.logSecurityEvent({
        eventType: 'PAYMENT_SIGNATURE_VERIFICATION_FAILED',
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        providedSignature: razorpay_signature,
        expectedSignature
      });
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - invalid signature',
        error: 'INVALID_SIGNATURE',
        timestamp: new Date().toISOString()
      });
    }

    // Check payment status from database (authoritative source)
    const Payment = require('../models/Payment');
    let paymentRecord = await Payment.findOne({
      $or: [
        { paymentId: razorpay_payment_id },
        { orderId: razorpay_order_id }
      ]
    });

    // If no record found, check Razorpay directly
    if (!paymentRecord) {
      try {
        const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
        
        paymentRecord = {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: razorpayPayment.status,
          amount: razorpayPayment.amount,
          currency: razorpayPayment.currency,
          processedAt: razorpayPayment.created_at,
          // Note: This is a temporary record for verification only
          // Webhook will create the permanent record
          isTemporary: true
        };
      } catch (razorpayError) {
        securityLogger.logSecurityEvent({
          eventType: 'PAYMENT_VERIFICATION_RAZORPAY_ERROR',
          userId: req.user?.id || 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          error: razorpayError.message
        });
        
        return res.status(500).json({
          success: false,
          message: 'Unable to verify payment status',
          error: 'VERIFICATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Log verification attempt (read-only operation)
    securityLogger.logSecurityEvent({
      eventType: 'PAYMENT_VERIFICATION_READ_ONLY',
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentStatus: paymentRecord.status,
      isTemporary: paymentRecord.isTemporary || false
    });
    
    // Return payment status only (no enrollment or processing)
    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        status: paymentRecord.status,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        processed: paymentRecord.status === 'captured',
        processedAt: paymentRecord.processedAt,
        isTemporary: paymentRecord.isTemporary || false,
        note: paymentRecord.isTemporary ? 
          'Webhook processing in progress - permanent record will be created' :
          'Payment processed via webhook'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error verifying payment:', error);
    securityLogger.logSecurityEvent({
      eventType: 'PAYMENT_VERIFICATION_ERROR',
      userId: req.user?.id || 'unknown',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment status',
      error: 'VERIFICATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment details
 */
const getPaymentDetails = async (req, res) => {
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
        error: 'PAYMENT_ID_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Verify Razorpay is initialized
    if (!razorpay || !razorpay.payments) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.',
        error: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: payment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: 'PAYMENT_DETAILS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get order details
 */
const getOrderDetails = async (req, res) => {
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
        error: 'ORDER_ID_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Verify Razorpay is initialized
    if (!razorpay || !razorpay.orders) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.',
        error: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    const order = await razorpay.orders.fetch(orderId);
    
    res.json({
      success: true,
      message: 'Order details retrieved successfully',
      data: order,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: 'ORDER_DETAILS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    
    const { count = 10, skip = 0 } = req.query;
    
    // Verify Razorpay is initialized
    if (!razorpay || !razorpay.payments) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.',
        error: 'SERVICE_UNAVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    const payments = await razorpay.payments.all({
      count: parseInt(count),
      skip: parseInt(skip)
    });
    
    res.json({
      success: true,
      message: 'Payment history retrieved successfully',
      data: payments,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: 'PAYMENT_HISTORY_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get Razorpay configuration (secure endpoint)
 */
const getRazorpayConfig = async (req, res) => {
  try {
    // Check if Razorpay feature is enabled
    if (!isRazorpayEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is currently disabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!keyId) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay configuration not found. Please contact support.',
        error: 'CONFIG_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    const config = {
      keyId: keyId,
      currency: 'INR',
      name: 'Mathematico',
      description: 'Educational Platform - Course & Book Purchases',
      theme: {
        color: '#3399cc'
      }
    };
    
    // Only return the public key ID, never the secret
    res.json({
      success: true,
      message: 'Razorpay configuration retrieved successfully',
      data: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error fetching Razorpay config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Razorpay configuration',
      error: 'CONFIG_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getOrderDetails,
  getPaymentHistory,
  getRazorpayConfig
};
