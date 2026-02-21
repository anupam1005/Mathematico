const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't include password in queries by default
    // Simplified password validation for development
    // validate: {
    //   validator: function(v) {
    //     return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
    //   },
    //   message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    // }
  },
  
  passwordChangedAt: {
    type: Date,
    select: false
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  
  dateOfBirth: {
    type: Date
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  
  // Academic Information
  grade: {
    type: String,
    trim: true
  },
  
  school: {
    type: String,
    trim: true
  },
  
  subjects: [{
    type: String,
    trim: true
  }],
  
  // Account Status
  role: {
    type: String,
    enum: ['student', 'admin', 'teacher'],
    default: 'student'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // Security Fields for Account Lockout
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  
  lockUntil: {
    type: Date,
    select: false
  },
  
  lastFailedLogin: {
    type: Date,
    select: false
  },
  
  // Refresh Token Management (for secure authentication)
  refreshTokens: [{
    tokenHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    deviceInfo: {
      userAgent: String,
      ip: String
    }
  }],
  
  // Learning Progress
  enrolledCourses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  purchasedBooks: [{
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    theme: {
      type: String,
      default: 'system'
    }
  },

  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: true
      },
      showPhone: {
        type: Boolean,
        default: false
      }
    },
    preferences: {
      language: {
        type: String,
        default: 'en'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      theme: {
        type: String,
        default: 'system'
      }
    },
    learning: {
      autoPlayVideos: {
        type: Boolean,
        default: true
      },
      downloadOverWifi: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Activity Tracking
  lastLogin: {
    type: Date
  },
  
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Account deactivation
  deactivated: {
    type: Boolean,
    default: false,
    select: false
  },
  
  // Account lockout
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  id: false
});

// Indexes for better performance (email index already created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  return verificationToken;
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    // Development fallback - should not be used in production
    console.warn('⚠️ Using fallback JWT secret in User model - NOT FOR PRODUCTION');
    return jwt.sign(
      { id: this._id, role: this.role },
      'temp-fallback-secret-for-testing-only',
      { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
    );
  }
  return jwt.sign(
    { id: this._id, role: this.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '90d' }
  );
};

// Check if account is locked
userSchema.virtual('isLocked').get(function() {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Handle failed login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // If we have a previous lock that has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 900000 }; // 15 minutes
  }
  
  return await this.updateOne(updates);
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function() {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove ALL sensitive fields that must never be exposed to clients
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.lastFailedLogin;
  delete userObject.deactivated;
  delete userObject.__v;
  delete userObject.passwordChangedAt;
  
  // Ensure isAdmin field is set based on role
  userObject.isAdmin = this.role === 'admin';
  userObject.is_admin = this.role === 'admin';
  
  // Ensure isActive field is properly set
  userObject.isActive = this.isActive !== false;
  userObject.is_active = this.isActive !== false;
  
  // Ensure email_verified field is set
  userObject.email_verified = this.isEmailVerified || false;
  
  // Map _id to id for frontend compatibility
  if (userObject._id) {
    userObject.id = userObject._id.toString();
  }
  
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function(tokenHash, expiresAt, deviceInfo = {}) {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(token => token.expiresAt > new Date());
  
  // Limit to 5 active refresh tokens per user (multiple devices)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest token
  }
  
  this.refreshTokens.push({
    tokenHash,
    expiresAt,
    deviceInfo
  });
  
  return this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function(tokenHash) {
  this.refreshTokens = this.refreshTokens.filter(token => token.tokenHash !== tokenHash);
  return this.save();
};

// Instance method to clear all refresh tokens (logout from all devices)
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Instance method to verify refresh token
userSchema.methods.hasValidRefreshToken = function(tokenHash) {
  const token = this.refreshTokens.find(t => t.tokenHash === tokenHash);
  
  if (!token) return false;
  
  // Check if token is expired
  if (token.expiresAt < new Date()) {
    // Remove expired token
    this.refreshTokens = this.refreshTokens.filter(t => t.tokenHash !== tokenHash);
    this.save();
    return false;
  }
  
  return true;
};

// Serverless-safe model export pattern
// In serverless environments (Vercel), models may persist across invocations
// This pattern prevents "Cannot overwrite model User" errors
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
