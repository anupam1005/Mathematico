const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['created', 'captured', 'failed', 'refunded', 'partially_refunded'],
    default: 'created'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    index: true
  },
  liveClassId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveClass',
    index: true
  },
  itemType: {
    type: String,
    enum: ['course', 'book', 'live_class'],
    required: true
  },
  webhookPayload: {
    type: mongoose.Schema.Types.Mixed,
    select: false // Don't include in queries by default for security
  },
  processedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.webhookPayload;
      return ret;
    }
  }
});

// Compound indexes for performance
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ courseId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

// Unique indexes explicitly defined
PaymentSchema.index({ paymentId: 1 }, { unique: true });
PaymentSchema.index({ orderId: 1 }, { unique: true });

// Static method to find payment by paymentId or orderId
PaymentSchema.statics.findByPaymentOrOrderId = function(identifier) {
  return this.findOne({
    $or: [
      { paymentId: identifier },
      { orderId: identifier }
    ]
  });
};

// Static method to check if payment already processed
PaymentSchema.statics.isPaymentProcessed = async function(paymentId, orderId) {
  const existingPayment = await this.findOne({
    $or: [
      { paymentId: paymentId },
      { orderId: orderId }
    ],
    status: { $in: ['captured', 'refunded', 'partially_refunded'] }
  });
  return !!existingPayment;
};

// Instance method to mark as processed
PaymentSchema.methods.markAsProcessed = function(status = 'captured', failureReason = null) {
  this.status = status;
  this.processedAt = new Date();
  if (failureReason) {
    this.failureReason = failureReason;
  }
  return this.save();
};

// Pre-save middleware to ensure data integrity
PaymentSchema.pre('save', function(next) {
  // Validate that at least one item type is set
  if (!this.courseId && !this.bookId && !this.liveClassId) {
    return next(new Error('At least one of courseId, bookId, or liveClassId must be provided'));
  }
  
  // Validate itemType matches the provided ID
  if (this.itemType === 'course' && !this.courseId) {
    return next(new Error('courseId is required when itemType is course'));
  }
  if (this.itemType === 'book' && !this.bookId) {
    return next(new Error('bookId is required when itemType is book'));
  }
  if (this.itemType === 'live_class' && !this.liveClassId) {
    return next(new Error('liveClassId is required when itemType is live_class'));
  }
  
  next();
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
