const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Strong password validation regex
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Case-insensitive email normalization
const normalizeEmail = (email) => {
  if (!email) return email;
  return email.trim().toLowerCase();
};

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
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
    set: normalizeEmail // Normalize email before saving
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [1, 'Password is required'],
    select: false // Don't include password in queries by default
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
  
  // Token version for replay detection and token invalidation
  tokenVersion: {
    type: Number,
    default: 0,
    min: 0
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
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove ALL sensitive fields that must never be exposed to clients
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.tokenHash;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.lastFailedLogin;
      delete ret.deactivated;
      delete ret.__v;
      delete ret.passwordChangedAt;
      
      // Ensure consistent boolean fields for frontend compatibility
      ret.isAdmin = ret.role === 'admin';
      ret.is_admin = ret.role === 'admin';
      ret.isActive = ret.isActive !== false;
      ret.is_active = ret.isActive !== false;
      ret.email_verified = ret.isEmailVerified || false;
      
      // Map _id to id for frontend compatibility
      if (ret._id) {
        ret.id = ret._id.toString();
      }
      
      return ret;
    }
  },
  toObject: { virtuals: true },
  id: false
});

// Indexes for better performance and security
userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } }); // Case-insensitive unique email
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'enrolledCourses.courseId': 1, 'enrolledCourses.enrolledAt': -1 }); // Compound index for enrollments
userSchema.index({ 'purchasedBooks.bookId': 1, 'purchasedBooks.purchasedAt': -1 }); // Compound index for payments
userSchema.index({ loginAttempts: 1 }); // For account lockout queries
userSchema.index({ lockUntil: 1 }); // For expired lock cleanup

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password and handle email normalization
userSchema.pre('save', async function(next) {
  // Normalize email
  if (this.isModified('email')) {
    this.email = normalizeEmail(this.email);
  }
  
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Enforce bcrypt cost of 12 for security
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt for token invalidation
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
      // Increment token version to invalidate all existing tokens
      this.tokenVersion = (this.tokenVersion || 0) + 1;
    }
    
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

// Generate JWT token with enhanced security
userSchema.methods.generateAuthToken = function() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    // Development fallback - should not be used in production
    console.warn('⚠️ Using fallback JWT secret in User model - NOT FOR PRODUCTION');
    return jwt.sign(
      { 
        id: this._id, 
        role: this.role,
        iss: 'mathematico-backend',
        aud: 'mathematico-frontend'
      },
      'temp-fallback-secret-for-testing-only',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '90d',
        algorithm: 'HS256',
        issuer: 'mathematico-backend',
        audience: 'mathematico-frontend'
      }
    );
  }
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      iss: 'mathematico-backend',
      aud: 'mathematico-frontend'
    },
    secret,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '90d',
      algorithm: 'HS256',
      issuer: 'mathematico-backend',
      audience: 'mathematico-frontend'
    }
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

// Instance method to check password with timing-safe comparison
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    // In case of error, return false to prevent timing attacks
    return false;
  }
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
  delete userObject.tokenVersion;
  
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

// Instance method to get safe user profile (minimal response)
userSchema.methods.getSafeProfile = function() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    profilePicture: this.profilePicture || null
  };
};

// Static method to find user by email (case-insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: normalizeEmail(email) });
};

// Static method to create user with transaction safety
userSchema.statics.createSafe = async function(userData) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    
    // Normalize email before creation
    userData.email = normalizeEmail(userData.email);
    
    // Check for existing user with case-insensitive email
    const existingUser = await this.findOne({ email: userData.email }).session(session);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const user = new this(userData);
    await user.save({ session });
    
    await session.commitTransaction();
    return user;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Serverless-safe model export pattern
// In serverless environments (Vercel), models may persist across invocations
// This pattern prevents "Cannot overwrite model User" errors
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
