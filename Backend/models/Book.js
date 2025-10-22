const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  author: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  
  isbn: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allow multiple null values
  },
  
  // Categorization
  category: {
    type: String,
    required: false,
    enum: [
      'mathematics',
      'physics',
      'chemistry',
      'biology',
      'computer_science',
      'engineering',
      'science',
      'general',
      'reference',
      'textbook'
    ],
    default: 'general'
  },
  
  subject: {
    type: String,
    required: false,
    trim: true
  },
  
  grade: {
    type: String,
    required: false,
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Content Information
  pages: {
    type: Number,
    min: [1, 'Book must have at least 1 page']
  },
  
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'es', 'fr', 'de', 'other']
  },
  
  edition: {
    type: String,
    trim: true
  },
  
  publisher: {
    type: String,
    trim: true
  },
  
  publicationYear: {
    type: Number,
    min: [1900, 'Publication year must be after 1900'],
    max: [new Date().getFullYear(), 'Publication year cannot be in the future']
  },
  
  // Media Files
  coverImage: {
    type: String, // URL to cover image
    required: false
  },
  
  pdfFile: {
    type: String, // URL to PDF file
    required: false
  },
  
  samplePages: [{
    type: String // URLs to sample page images
  }],
  
  // Pricing and Availability
  price: {
    type: Number,
    required: false,
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
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Digital Rights
  downloadLimit: {
    type: Number,
    default: 3, // Number of times user can download
    min: [1, 'Download limit must be at least 1']
  },
  
  accessDuration: {
    type: Number,
    default: 365, // Days
    min: [1, 'Access duration must be at least 1 day']
  },
  
  // Admin Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  
  downloads: {
    type: Number,
    default: 0
  },
  
  purchases: {
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
    user: {
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
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_review'],
    default: 'draft'
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
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
bookSchema.index({ title: 'text', description: 'text', author: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ subject: 1 });
bookSchema.index({ grade: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ featured: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ 'ratings.average': -1 });

// Pre-save middleware to generate slug
bookSchema.pre('save', function(next) {
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
bookSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to set publishedAt
bookSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual for formatted price
bookSchema.virtual('formattedPrice').get(function() {
  if (this.isFree) return 'Free';
  return `${this.currency} ${this.price.toFixed(2)}`;
});

// Virtual for average rating
bookSchema.virtual('averageRating').get(function() {
  return this.ratings.average;
});

// Instance method to add review
bookSchema.methods.addReview = function(userId, rating, comment) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(review => review.user.toString() === userId.toString());
  
  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
  } else {
    // Add new review
    this.reviews.push({ user: userId, rating, comment });
  }
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.ratings.average = totalRating / this.reviews.length;
  this.ratings.count = this.reviews.length;
  
  return this.save();
};

// Instance method to increment views
bookSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to increment downloads
bookSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Instance method to increment purchases
bookSchema.methods.incrementPurchases = function() {
  this.purchases += 1;
  return this.save();
};

// Static method to find published books
bookSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isAvailable: true });
};

// Static method to find featured books
bookSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'published', isAvailable: true });
};

// Static method to search books
bookSchema.statics.searchBooks = function(query, filters = {}) {
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

module.exports = mongoose.model('Book', bookSchema, 'book');
