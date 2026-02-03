const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

/**
 * Create Razorpay order
 */
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required (must be greater than 0)',
        timestamp: new Date().toISOString()
      });
    }

    // Verify Razorpay is initialized
    if (!razorpay || !razorpay.orders) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not available. Please contact support.',
        timestamp: new Date().toISOString()
      });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Ensure receipt is under 40 characters (Razorpay limit)
    const shortReceipt = receipt && receipt.length <= 40 
      ? receipt 
      : `receipt_${Date.now().toString().slice(-8)}`;

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: shortReceipt,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);
    
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
    console.error('PaymentController: Error creating order');
    res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again or contact support.',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify Razorpay payment
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is required',
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

    if (isAuthentic) {
      // Get order details to retrieve notes (courseId, bookId, userId)
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        
        // Extract enrollment information from order notes
        const { courseId, bookId, liveClassId, userId, itemType } = order.notes || {};
        
        // Enroll student based on item type
        if (courseId && userId) {
          // Import Course model dynamically to avoid circular dependencies
          const Course = require('../models/Course');
          const course = await Course.findById(courseId);
          if (course) {
            await course.enrollStudent(userId);
          }
        } else if (bookId && userId) {
          // Import Book model dynamically
          const Book = require('../models/Book');
          const book = await Book.findById(bookId);
          if (book && book.purchaseBook) {
            await book.purchaseBook(userId);
          }
        } else if (liveClassId && userId) {
          // Import LiveClass model dynamically
          const LiveClass = require('../models/LiveClass');
          const liveClass = await LiveClass.findById(liveClassId);
          if (liveClass && liveClass.enrollStudent) {
            await liveClass.enrollStudent(userId);
          }
        }
      } catch (enrollmentError) {
        console.error('PaymentController: Enrollment error');
        // Don't fail the payment verification, but log the error
      }
      
      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          verified: true,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('PaymentController: Error verifying payment');
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment details
 */
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
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
    console.error('PaymentController: Error fetching payment details');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get order details
 */
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
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
    console.error('PaymentController: Error fetching order details');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { count = 10, skip = 0 } = req.query;
    
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
    console.error('PaymentController: Error fetching payment history');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get Razorpay configuration (secure endpoint)
 */
const getRazorpayConfig = async (req, res) => {
  try {
    if (!keyId) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay configuration not found. Please contact support.',
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
    console.error('PaymentController: Error fetching Razorpay config');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Razorpay configuration',
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
