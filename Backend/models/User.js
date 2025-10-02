const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 100
  },
  password_hash: {
    type: String,
    required: true
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: {
    type: String,
    default: null
  },
  avatar_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  last_login: {
    type: Date,
    default: null
  },
  login_attempts: {
    type: Number,
    default: 0
  },
  lock_until: {
    type: Date,
    default: null
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'instructor'],
    default: 'user'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users'
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ email_verified: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lock_until && this.lock_until > Date.now());
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lock_until && this.lock_until < Date.now()) {
    return this.updateOne({
      $unset: { lock_until: 1 },
      $set: { login_attempts: 1 }
    });
  }
  
  const updates = { $inc: { login_attempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.login_attempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lock_until: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { login_attempts: 1, lock_until: 1 }
  });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.createUser = async function(userData) {
  const { name, email, password, role = 'user', is_admin = false } = userData;
  
  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);
  
  const user = new this({
    name,
    email: email.toLowerCase(),
    password_hash,
    role,
    is_admin
  });
  
  return user.save();
};

userSchema.statics.getAll = async function(page = 1, limit = 10, filters = {}) {
  const query = {};
  
  // Apply filters
  if (filters.role) query.role = filters.role;
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.find(query)
      .select('-password_hash -email_verification_token')
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

userSchema.statics.findById = function(id) {
  return this.findOne({ _id: id }).select('-password_hash -email_verification_token');
};

userSchema.statics.updateUser = async function(id, updateData) {
  // Remove sensitive fields
  delete updateData.password_hash;
  delete updateData.email_verification_token;
  
  return this.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password_hash -email_verification_token');
};

userSchema.statics.deleteUser = function(id) {
  return this.findByIdAndDelete(id);
};

userSchema.statics.updateUserStatus = async function(id, status) {
  return this.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).select('-password_hash -email_verification_token');
};

userSchema.statics.getStats = async function() {
  const [total, active, inactive, admins] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'active' }),
    this.countDocuments({ status: 'inactive' }),
    this.countDocuments({ is_admin: true })
  ]);
  
  return {
    total,
    active,
    inactive,
    admins
  };
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Create and export the model
const User = mongoose.model('User', userSchema);

module.exports = User;
