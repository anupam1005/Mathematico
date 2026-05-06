const Razorpay = require('razorpay');
const crypto = require('crypto');
const { isRazorpayEnabled } = require('../utils/featureFlags');
const securityLogger = require('../utils/securityLogger');

// Initialize Razorpay with environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Import models at top level for consistency
const Course = require('../models/Course');
const Book = require('../models/Book');
const LiveClass = require('../models/LiveClass');
const Payment = require('../models/Payment');
const { connectDB } = require('../config/database');

// Don't throw on startup - fail gracefully when payment is attempted
let razorpay = null;
if (keyId && keySecret) {
  try {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    console.log('[BOOT] Razorpay initialized successfully (Key ID present)');
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error.message);
    razorpay = null;
  }
} else {
  console.warn('⚠️ Razorpay credentials not configured. Payment features will be unavailable.');
}

/**
 * Create Razorpay order
 */
const createOrder = async (req, res) => {
  try {
    // Ensure database connection
    await connectDB();

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
    
    const { amount, currency = 'INR', receipt, notes } = req.body;
    const courseId = req.body.courseId || notes?.courseId;
    const itemType = req.body.itemType || notes?.itemType || 'course';
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required (must be greater than 0)',
        error: 'INVALID_AMOUNT',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[PAYMENT] Creating order: amount=${amount}, type=${itemType}, id=${courseId || 'none'}`);

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

    // Validate item and get server-side price if ID provided
    let validatedAmount = amount;
    
    // 1. Course validation
    if (courseId && itemType === 'course') {
      try {
        const course = await Course.findById(courseId).select('title price status isAvailable');
        
        if (!course) {
          return res.status(404).json({
            success: false,
            message: 'Course not found',
            error: 'COURSE_NOT_FOUND',
            timestamp: new Date().toISOString()
          });
        }
        
        // Corrected check: Use 'status' instead of non-existent 'isPublished'
        if (course.status !== 'published' || !course.isAvailable) {
          return res.status(400).json({
            success: false,
            message: 'Course is not available for purchase',
            error: 'COURSE_NOT_AVAILABLE',
            timestamp: new Date().toISOString()
          });
        }
        
        // Use server-side price to prevent tampering
        if (course.price !== undefined && course.price !== null) {
          validatedAmount = course.price;
          if (Math.abs(validatedAmount - amount) > 0.01) {
            console.warn(`[PAYMENT:TAMPERING] Price mismatch for course ${courseId}: expected ${validatedAmount}, got ${amount}`);
            securityLogger.logSecurityEvent({
              eventType: 'PAYMENT_TAMPERING_ATTEMPT',
              userId: req.user?.id || 'anonymous',
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              url: req.originalUrl,
              itemId: courseId,
              itemType: 'course',
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
    
    // 2. Book validation
    const bookId = req.body.bookId || notes?.bookId;
    if (bookId && (itemType === 'book' || !courseId)) {
      try {
        console.log(`[PAYMENT] Validating book price for ID: ${bookId}`);
        const book = await Book.findById(bookId)
          .select('title price status isAvailable')
          .maxTimeMS(5000); // 5s timeout
        
        console.log(`[PAYMENT] Book fetched: ${book ? 'found' : 'not found'}`);
        
        if (!book) {
          console.error(`[PAYMENT] Book not found: ${bookId}`);
          return res.status(404).json({
            success: false,
            message: 'Book not found'
          });
        }

        if (!book.isAvailable || book.status !== 'published') {
          console.warn(`[PAYMENT] Book unavailable or not published: ${bookId}`);
          return res.status(403).json({
            success: false,
            message: 'Book is no longer available for purchase'
          });
        }

        if (book.price !== undefined && book.price !== null) {
          validatedAmount = book.price;
          console.log(`[PAYMENT] Validated book price: ${validatedAmount}`);
          if (Math.abs(validatedAmount - amount) > 0.01) {
            console.warn(`[PAYMENT:TAMPERING] Price mismatch for book ${bookId}: expected ${validatedAmount}, got ${amount}`);
            securityLogger.logSecurityEvent('PAYMENT_TAMPERING_ATTEMPT', {
              itemId: bookId,
              itemType: 'book',
              expectedPrice: validatedAmount,
              providedPrice: amount,
              userId: req.user?.id
            }, req);
          }
        }
      } catch (bookError) {
        console.error('Error validating book for payment:', bookError);
      }
    }

    // 3. Live Class validation
    const liveClassId = req.body.liveClassId || notes?.liveClassId;
    if (liveClassId && itemType === 'liveClass') {
      try {
        console.log(`[PAYMENT] Validating live class price for ID: ${liveClassId}`);
        const liveClass = await LiveClass.findById(liveClassId)
          .select('title price status isAvailable')
          .maxTimeMS(5000); // 5s timeout
        
        console.log(`[PAYMENT] Live class fetched: ${liveClass ? 'found' : 'not found'}`);
        
        if (!liveClass) {
          console.error(`[PAYMENT] Live class not found: ${liveClassId}`);
          return res.status(404).json({
            success: false,
            message: 'Live class not found'
          });
        }

        if (!liveClass.isAvailable || (liveClass.status === 'cancelled' || liveClass.status === 'completed')) {
          console.warn(`[PAYMENT] Live class unavailable or finished: ${liveClassId} (status: ${liveClass.status})`);
          return res.status(403).json({
            success: false,
            message: 'Live class is no longer available for purchase'
          });
        }

        if (liveClass.price !== undefined && liveClass.price !== null) {
          validatedAmount = liveClass.price;
          console.log(`[PAYMENT] Validated live class price: ${validatedAmount}`);
          if (Math.abs(validatedAmount - amount) > 0.01) {
            console.warn(`[PAYMENT:TAMPERING] Price mismatch for live class ${liveClassId}: expected ${validatedAmount}, got ${amount}`);
            securityLogger.logSecurityEvent('PAYMENT_TAMPERING_ATTEMPT', {
              itemId: liveClassId,
              itemType: 'liveClass',
              expectedPrice: validatedAmount,
              providedPrice: amount,
              userId: req.user?.id
            }, req);
          }
        }
      } catch (lcError) {
        console.error('Error validating live class for payment:', lcError);
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

    console.log('[PAYMENT] Options built, calling Razorpay API...', JSON.stringify(options));
    
    // Create order with a manual timeout to prevent hanging the request indefinitely
    // Razorpay SDK doesn't always respect global timeouts.
    const orderPromise = razorpay.orders.create(options);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Razorpay API timeout (15s)')), 15000)
    );
    
    console.log('[PAYMENT] Racing Razorpay API call with 15s timeout');
    const order = await Promise.race([orderPromise, timeoutPromise]);
    console.log(`[PAYMENT] Razorpay order created: ${order?.id || 'failed'}`);
    console.log(`[PAYMENT] Order created: ${order.id}`);
    
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
    // Ensure database connection
    await connectDB();

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
