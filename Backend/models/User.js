const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
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

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
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

module.exports = mongoose.model('User', userSchema);
