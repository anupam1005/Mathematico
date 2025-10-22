const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.REACT_NATIVE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.REACT_NATIVE_RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 */
const createOrder = async (req, res) => {
  try {
    console.log('PaymentController: Creating Razorpay order...');
    
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
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

    console.log('PaymentController: Order options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('PaymentController: Order created successfully:', order.id);

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
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify Razorpay payment
 */
const verifyPayment = async (req, res) => {
  try {
    console.log('PaymentController: Verifying payment...');
    
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
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.REACT_NATIVE_RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      console.log('PaymentController: Payment verified successfully');
      
      // Here you would typically:
      // 1. Save payment record to database
      // 2. Update user enrollment status
      // 3. Send confirmation email
      // 4. Update course/book access permissions
      
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
      console.log('PaymentController: Payment verification failed');
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('PaymentController: Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
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
    console.error('PaymentController: Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message,
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
    console.error('PaymentController: Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message,
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
    console.error('PaymentController: Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get Razorpay configuration (secure endpoint)
 */
const getRazorpayConfig = async (req, res) => {
  try {
    // Only return the public key ID, never the secret
    res.json({
      success: true,
      message: 'Razorpay configuration retrieved successfully',
      data: {
        keyId: process.env.RAZORPAY_KEY_ID || process.env.REACT_NATIVE_RAZORPAY_KEY_ID,
        currency: 'INR',
        name: 'Mathematico',
        description: 'Educational Platform',
        theme: {
          color: '#3399cc'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PaymentController: Error fetching Razorpay config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Razorpay configuration',
      error: error.message,
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
