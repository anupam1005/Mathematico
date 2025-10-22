const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Course description is required'],
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
      'preparation',
      'remedial'
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
  
  // Course Content
  curriculum: [{
    module: {
      type: String,
      required: true,
      trim: true
    },
    lessons: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      duration: {
        type: Number, // in minutes
        default: 0
      },
      videoUrl: {
        type: String
      },
      materials: [{
        type: {
          type: String,
          enum: ['pdf', 'image', 'document', 'link'],
          required: true
        },
        title: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        }
      }],
      isFree: {
        type: Boolean,
        default: false
      }
    }]
  }],
  
  // Media Files
  thumbnail: {
    type: String, // URL to course thumbnail
    required: [true, 'Course thumbnail is required']
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
  
  // Course Details
  duration: {
    type: Number, // Total duration in hours
    required: [true, 'Course duration is required'],
    min: [1, 'Course must be at least 1 hour long']
  },
  
  totalLessons: {
    type: Number,
    default: 0
  },
  
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'es', 'fr', 'de', 'other']
  },
  
  prerequisites: [{
    type: String,
    trim: true
  }],
  
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  
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
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedLessons: [{
      lessonId: {
        type: String
      },
      completedAt: {
        type: Date,
        default: Date.now
      }
    }],
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateUrl: {
      type: String
    }
  }],
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  
  enrollments: {
    type: Number,
    default: 0
  },
  
  completions: {
    type: Number,
    default: 0
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
  
  // Schedule and Availability
  startDate: {
    type: Date
  },
  
  endDate: {
    type: Date
  },
  
  enrollmentDeadline: {
    type: Date
  },
  
  isSelfPaced: {
    type: Boolean,
    default: true
  },
  
  maxStudents: {
    type: Number,
    min: [1, 'Course must allow at least 1 student']
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'suspended'],
    default: 'draft'
  },
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  featured: {
    type: Boolean,
    default: false
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
  publishedAt: {
    type: Date
  },
  
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
courseSchema.index({ title: 'text', description: 'text', subject: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ subject: 1 });
courseSchema.index({ grade: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ featured: 1 });
courseSchema.index({ isFree: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ 'enrolledStudents.student': 1 });

// Pre-save middleware to generate slug
courseSchema.pre('save', function(next) {
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
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to set publishedAt
courseSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Pre-save middleware to calculate total lessons
courseSchema.pre('save', function(next) {
  if (this.curriculum && Array.isArray(this.curriculum)) {
    this.totalLessons = this.curriculum.reduce((total, module) => {
      return total + (module.lessons && Array.isArray(module.lessons) ? module.lessons.length : 0);
    }, 0);
  } else {
    this.totalLessons = 0;
  }
  next();
});

// Virtual for formatted price
courseSchema.virtual('formattedPrice').get(function() {
  if (this.isFree) return 'Free';
  
  let price = this.price;
  if (this.discount.percentage > 0 && 
      (!this.discount.validUntil || this.discount.validUntil > new Date())) {
    price = price * (1 - this.discount.percentage / 100);
  }
  
  return `${this.currency} ${price.toFixed(2)}`;
});

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function() {
  return this.enrolledStudents.length;
});

// Virtual for completion rate
courseSchema.virtual('completionRate').get(function() {
  if (this.enrolledStudents.length === 0) return 0;
  return (this.completions / this.enrolledStudents.length) * 100;
});

// Instance method to enroll student
courseSchema.methods.enrollStudent = function(studentId) {
  // Check if student is already enrolled
  const existingEnrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (existingEnrollment) {
    throw new Error('Student is already enrolled in this course');
  }
  
  // Check if course has reached maximum capacity
  if (this.maxStudents && this.enrolledStudents.length >= this.maxStudents) {
    throw new Error('Course has reached maximum capacity');
  }
  
  // Add student to enrolled students
  this.enrolledStudents.push({
    student: studentId,
    enrolledAt: new Date()
  });
  
  this.enrollments += 1;
  return this.save();
};

// Instance method to update student progress
courseSchema.methods.updateStudentProgress = function(studentId, lessonId) {
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Student is not enrolled in this course');
  }
  
  // Add lesson to completed lessons if not already completed
  const existingLesson = enrollment.completedLessons.find(
    lesson => lesson.lessonId === lessonId
  );
  
  if (!existingLesson) {
    enrollment.completedLessons.push({
      lessonId: lessonId,
      completedAt: new Date()
    });
  }
  
  // Calculate progress percentage
  enrollment.progress = (enrollment.completedLessons.length / this.totalLessons) * 100;
  enrollment.lastAccessed = new Date();
  
  // Check if course is completed
  if (enrollment.progress >= 100 && !enrollment.certificateIssued) {
    enrollment.certificateIssued = true;
    this.completions += 1;
  }
  
  return this.save();
};

// Instance method to add review
courseSchema.methods.addReview = function(studentId, rating, comment) {
  // Check if student is enrolled
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (!enrollment) {
    throw new Error('Only enrolled students can review this course');
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
courseSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find published courses
courseSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isAvailable: true });
};

// Static method to find featured courses
courseSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'published', isAvailable: true });
};

// Static method to search courses
courseSchema.statics.searchCourses = function(query, filters = {}) {
  const searchQuery = {
    status: 'published',
    isAvailable: true,
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Course', courseSchema);
