const mongoose = require('mongoose');

// Course Schema
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  slug: {
    type: String,
    required: true,
    lowercase: true
  },
  description: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  original_price: {
    type: Number,
    default: null,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    maxlength: 3
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  level: {
    type: String,
    enum: ['Foundation', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Foundation'
  },
  category: {
    type: String,
    default: null,
    trim: true,
    maxlength: 100
  },
  instructor: {
    type: String,
    default: 'Admin',
    trim: true,
    maxlength: 255
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  content: {
    type: String,
    default: null
  },
  requirements: {
    type: String,
    default: null
  },
  what_you_will_learn: {
    type: [String],
    default: []
  },
  who_is_this_for: {
    type: [String],
    default: []
  },
  topics: {
    type: [String],
    default: []
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  enrolled_count: {
    type: Number,
    default: 0,
    min: 0
  },
  pdf_url: {
    type: String,
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'courses'
});

// Indexes
courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ created_by: 1 });
courseSchema.index({ is_featured: 1 });
courseSchema.index({ title: 'text', description: 'text' }); // Text search

// Static methods
courseSchema.statics.create = async function(courseData) {
  const {
    title, description, instructor, price, original_price, duration, level,
    category, thumbnail, pdf_url, enrolled_count, status = 'draft', created_by
  } = courseData;

  if (!title || !price) {
    throw new Error('Title and Price are required');
  }

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const course = new this({
    title,
    slug,
    description: description || null,
    instructor: instructor || 'Admin',
    price,
    original_price: original_price || null,
    duration: duration || 0,
    level: level || 'Foundation',
    category: category || null,
    thumbnail: thumbnail || null,
    pdf_url: pdf_url || null,
    enrolled_count: enrolled_count || 0,
    status,
    created_by: created_by || '1'
  });

  return course.save();
};

courseSchema.statics.getAll = async function(page = 1, limit = 10, filters = {}) {
  const query = {};
  
  // Apply filters
  if (filters.status) query.status = filters.status;
  if (filters.statusIn) query.status = { $in: filters.statusIn };
  if (filters.category) query.category = filters.category;
  if (filters.level) query.level = filters.level;
  if (filters.is_featured) query.is_featured = filters.is_featured;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.find(query)
      .populate('created_by', 'name email')
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

courseSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('created_by', 'name email');
};

courseSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug })
    .populate('created_by', 'name email');
};

courseSchema.statics.updateCourse = async function(id, updateData) {
  // Generate new slug if title is being updated
  if (updateData.title) {
    updateData.slug = updateData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  return this.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('created_by', 'name email');
};

courseSchema.statics.deleteCourse = function(id) {
  return this.findByIdAndDelete(id);
};

courseSchema.statics.updateCourseStatus = async function(id, status) {
  return this.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).populate('created_by', 'name email');
};

courseSchema.statics.getStats = async function() {
  const [total, published, draft, archived] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'published' }),
    this.countDocuments({ status: 'draft' }),
    this.countDocuments({ status: 'archived' })
  ]);
  
  return {
    total,
    published,
    draft,
    archived
  };
};

courseSchema.statics.incrementEnrollment = function(id) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { enrolled_count: 1 } },
    { new: true }
  );
};

courseSchema.statics.decrementEnrollment = function(id) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { enrolled_count: -1 } },
    { new: true }
  );
};

// Pre-save middleware
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Create and export the model
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
