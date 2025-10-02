const mongoose = require('mongoose');

// Payment Schema
const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item_type: {
    type: String,
    enum: ['course', 'book', 'live_class'],
    required: true
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    maxlength: 3
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    default: null,
    maxlength: 50
  },
  payment_gateway: {
    type: String,
    default: null,
    maxlength: 50
  },
  transaction_id: {
    type: String,
    default: null
  },
  gateway_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Indexes
paymentSchema.index({ user_id: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ item_type: 1 });
paymentSchema.index({ item_id: 1 });
paymentSchema.index({ transaction_id: 1 }, { unique: true, sparse: true });
paymentSchema.index({ createdAt: -1 });

// Static methods
paymentSchema.statics.create = async function(paymentData) {
  const {
    user_id, item_type, item_id, amount, currency = 'INR',
    payment_method, payment_gateway, transaction_id, gateway_response, metadata
  } = paymentData;

  if (!user_id || !item_type || !item_id || !amount) {
    throw new Error('user_id, item_type, item_id, and amount are required');
  }

  const payment = new this({
    user_id,
    item_type,
    item_id,
    amount,
    currency,
    payment_method: payment_method || null,
    payment_gateway: payment_gateway || null,
    transaction_id: transaction_id || null,
    gateway_response: gateway_response || null,
    metadata: metadata || null
  });

  return payment.save();
};

paymentSchema.statics.getAll = async function(page = 1, limit = 10, filters = {}) {
  const query = {};
  
  // Apply filters
  if (filters.user_id) query.user_id = filters.user_id;
  if (filters.status) query.status = filters.status;
  if (filters.item_type) query.item_type = filters.item_type;
  if (filters.payment_gateway) query.payment_gateway = filters.payment_gateway;
  if (filters.transaction_id) query.transaction_id = filters.transaction_id;
  
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.find(query)
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

paymentSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('user_id', 'name email');
};

paymentSchema.statics.findByTransactionId = function(transactionId) {
  return this.findOne({ transaction_id: transactionId })
    .populate('user_id', 'name email');
};

paymentSchema.statics.updatePayment = async function(id, updateData) {
  return this.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('user_id', 'name email');
};

paymentSchema.statics.updatePaymentStatus = async function(id, status, additionalData = {}) {
  const updateData = { status, ...additionalData };
  
  return this.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).populate('user_id', 'name email');
};

paymentSchema.statics.deletePayment = function(id) {
  return this.findByIdAndDelete(id);
};

paymentSchema.statics.getStats = async function() {
  const [total, completed, pending, failed, refunded] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'completed' }),
    this.countDocuments({ status: 'pending' }),
    this.countDocuments({ status: 'failed' }),
    this.countDocuments({ status: 'refunded' })
  ]);
  
  // Calculate total revenue
  const revenueResult = await this.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
  ]);
  
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalAmount : 0;
  
  return {
    total,
    completed,
    pending,
    failed,
    refunded,
    totalRevenue
  };
};

paymentSchema.statics.getUserPayments = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ user_id: userId })
  ]);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

paymentSchema.statics.getRevenueByPeriod = async function(startDate, endDate) {
  const query = {
    status: 'completed',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalAmount: 0, totalTransactions: 0 };
};

// Create and export the model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
