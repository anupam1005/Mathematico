const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Live class title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Live class description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'computer_science',
      'engineering',
      'science',
      'general',
      'doubt_clearing',
      'exam_preparation'
    ],
    default: 'general'
  },
  
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  
  grade: {
    type: String,
    required: [true, 'Grade level is required'],
    trim: true
  },
  
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Schedule Information
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Class must be at least 15 minutes long'],
    max: [480, 'Class cannot exceed 8 hours']
  },
  
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
    required: true
  },
  
  // Recurring Classes
  isRecurring: {
    type: Boolean,
    default: false
  },
  
  recurrence: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() { return this.isRecurring; }
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    endDate: {
      type: Date
    },
    occurrences: {
      type: Number,
      min: 1
    }
  },
  
  // Class Content
  topics: [{
    type: String,
    trim: true
  }],
  
  learningObjectives: [{
    type: String,
    trim: true
  }],
  
  materials: [{
    type: {
      type: String,
      enum: ['pdf', 'image', 'document', 'link', 'video'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  // Media Files
  thumbnail: {
    type: String, // URL to class thumbnail
    required: [true, 'Class thumbnail is required']
  },
  
  previewVideo: {
    type: String // URL to preview video
  },
  
  // Pricing and Enrollment
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  isFree: {
    type: Boolean,
    default: false
  },
  
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: {
      type: Date
    }
  },
  
  // Instructor Information
  instructor: {
    name: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true
    },
    bio: {
      type: String,
      trim: true
    },
    profilePicture: {
      type: String
    },
    qualifications: [{
      type: String,
      trim: true
    }],
    experience: {
      type: String,
      trim: true
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  
  // Admin Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Enrollment Information
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    attendance: {
      type: String,
      enum: ['present', 'absent', 'late', 'not_marked'],
      default: 'not_marked'
    },
    joinedAt: {
      type: Date
    },
    leftAt: {
      type: Date
    },
    durationAttended: {
      type: Number, // in minutes
      default: 0
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Feedback comment cannot exceed 500 characters']
      }
    }
  }],
  
  // Class Capacity
  maxStudents: {
    type: Number,
    required: [true, 'Maximum students is required'],
    min: [1, 'Class must allow at least 1 student'],
    max: [1000, 'Class cannot exceed 1000 students']
  },
  
  minStudents: {
    type: Number,
    default: 1,
    min: [1, 'Minimum students must be at least 1']
  },
  
  // Platform Information
  platform: {
    type: String,
    enum: ['zoom', 'google_meet', 'teams', 'custom', 'youtube', 'other'],
    default: 'zoom'
  },
  
  meetingLink: {
    type: String,
    required: [true, 'Meeting link is required']
  },
  
  meetingId: {
    type: String
  },
  
  meetingPassword: {
    type: String
  },
  
  // Recording Information
  willBeRecorded: {
    type: Boolean,
    default: false
  },
  
  recordingUrl: {
    type: String
  },
  
  recordingAvailable: {
    type: Boolean,
    default: false
  },
  
  recordingExpiryDate: {
    type: Date
  },
  
  // Class Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  
  enrollments: {
    type: Number,
    default: 0
  },
  
  attendance: {
    total: {
      type: Number,
      default: 0
    },
    present: {
      type: Number,
      default: 0
    },
    absent: {
      type: Number,
      default: 0
    },
    late: {
      type: Number,
      default: 0
    }
  },
  
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notifications
  reminderSent: {
    type: Boolean,
    default: false
  },
  
  reminderSentAt: {
    type: Date
  },
  
  // SEO and Search
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
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

// Indexes for better performance
liveClassSchema.index({ title: 'text', description: 'text', subject: 'text' });
liveClassSchema.index({ category: 1 });
liveClassSchema.index({ subject: 1 });
liveClassSchema.index({ grade: 1 });
liveClassSchema.index({ startTime: 1 });
liveClassSchema.index({ endTime: 1 });
liveClassSchema.index({ status: 1 });
liveClassSchema.index({ featured: 1 });
liveClassSchema.index({ isFree: 1 });
liveClassSchema.index({ createdAt: -1 });
liveClassSchema.index({ 'ratings.average': -1 });
liveClassSchema.index({ 'enrolledStudents.student': 1 });
liveClassSchema.index({ 'instructor.instructorId': 1 });

// Pre-save middleware to generate slug
liveClassSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim('-'); // Remove leading/trailing hyphens
  }
  next();
});

// Pre-save middleware to update updatedAt
liveClassSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to validate time
liveClassSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    return next(new Error('Start time must be before end time'));
  }
  
  // Calculate duration if not provided
  if (!this.duration) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // Convert to minutes
  }
  
  next();
});

// Virtual for formatted price
liveClassSchema.virtual('formattedPrice').get(function() {
  if (this.isFree) return 'Free';
  
  let price = this.price;
  if (this.discount.percentage > 0 && 
      (!this.discount.validUntil || this.discount.validUntil > new Date())) {
    price = price * (1 - this.discount.percentage / 100);
  }
  
  return `${this.currency} ${price.toFixed(2)}`;
});

// Virtual for enrollment count
liveClassSchema.virtual('enrollmentCount').get(function() {
  return this.enrolledStudents.length;
});

// Virtual for attendance rate
liveClassSchema.virtual('attendanceRate').get(function() {
  if (this.attendance.total === 0) return 0;
  return (this.attendance.present / this.attendance.total) * 100;
});

// Virtual for class status based on time
liveClassSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  
  if (this.status === 'cancelled' || this.status === 'postponed') {
    return this.status;
  }
  
  if (now < this.startTime) {
    return 'upcoming';
  } else if (now >= this.startTime && now <= this.endTime) {
    return 'live';
  } else {
    return 'completed';
  }
});

// Virtual for time until class starts
liveClassSchema.virtual('timeUntilStart').get(function() {
  const now = new Date();
  const timeDiff = this.startTime - now;
  
  if (timeDiff <= 0) return null;
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
});

// Instance method to enroll student
liveClassSchema.methods.enrollStudent = function(studentId) {
  // Check if student is already enrolled
  const existingEnrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this class');
  }
  
  // Check if class has reached maximum capacity
  if (this.enrolledStudents.length >= this.maxStudents) {
    throw new Error('Class has reached maximum capacity');
  }
  
  // Check if enrollment deadline has passed
  if (this.startTime <= new Date()) {
    throw new Error('Cannot enroll in a class that has already started');
  }
  
  // Add student to enrolled students
  this.enrolledStudents.push({
    student: studentId,
    enrolledAt: new Date()
  });
  
  this.enrollments += 1;
  return this.save();
};

// Instance method to mark attendance
liveClassSchema.methods.markAttendance = function(studentId, attendanceStatus) {
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Student is not enrolled in this class');
  }
  
  // Update attendance
  enrollment.attendance = attendanceStatus;
  
  // Update class attendance statistics
  this.attendance.total += 1;
  this.attendance[attendanceStatus] += 1;
  
  return this.save();
};

// Instance method to add review
liveClassSchema.methods.addReview = function(studentId, rating, comment) {
  // Check if student is enrolled
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Only enrolled students can review this class');
  }
  
  // Check if student already reviewed
  const existingReview = this.reviews.find(
    review => review.student.toString() === studentId.toString()
  );
  
  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
  } else {
    // Add new review
    this.reviews.push({ student: studentId, rating, comment });
  }
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = totalRating / this.reviews.length;
  this.ratings.count = this.reviews.length;
  
  return this.save();
};

// Instance method to increment views
liveClassSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to start class
liveClassSchema.methods.startClass = function() {
  if (this.status !== 'scheduled') {
    throw new Error('Only scheduled classes can be started');
  }
  
  this.status = 'live';
  return this.save();
};

// Instance method to end class
liveClassSchema.methods.endClass = function() {
  if (this.status !== 'live') {
    throw new Error('Only live classes can be ended');
  }
  
  this.status = 'completed';
  return this.save();
};

// Static method to find upcoming classes
liveClassSchema.statics.findUpcoming = function() {
  return this.find({
    startTime: { $gt: new Date() },
    status: 'scheduled',
    isAvailable: true
  }).sort({ startTime: 1 });
};

// Static method to find live classes
liveClassSchema.statics.findLive = function() {
  const now = new Date();
  return this.find({
    startTime: { $lte: now },
    endTime: { $gte: now },
    status: 'live',
    isAvailable: true
  });
};

// Static method to find featured classes
liveClassSchema.statics.findFeatured = function() {
  return this.find({
    featured: true,
    status: 'scheduled',
    isAvailable: true,
    startTime: { $gt: new Date() }
  });
};

// Static method to search classes
liveClassSchema.statics.searchClasses = function(query, filters = {}) {
  const searchQuery = {
    status: 'scheduled',
    isAvailable: true,
    startTime: { $gt: new Date() },
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('LiveClass', liveClassSchema);
