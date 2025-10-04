const mongoose = require('mongoose');

// Book Schema
const bookSchema = new mongoose.Schema({
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
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  publisher: {
    type: String,
    default: null,
    trim: true,
    maxlength: 255
  },
  category: {
    type: String,
    default: null,
    trim: true,
    maxlength: 100
  },
  subject: {
    type: String,
    default: null,
    trim: true,
    maxlength: 100
  },
  class: {
    type: String,
    default: null,
    trim: true,
    maxlength: 100
  },
  level: {
    type: String,
    enum: ['Foundation', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Foundation'
  },
  cover_image_url: {
    type: String,
    default: null
  },
  pdf_url: {
    type: String,
    default: null
  },
  pages: {
    type: Number,
    default: null
  },
  isbn: {
    type: String,
    default: null,
    trim: true,
    maxlength: 50
  },
  price: {
    type: Number,
    default: 0.00
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
  is_featured: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0
  },
  tags: {
    type: [String],
    default: []
  },
  table_of_contents: {
    type: String,
    default: null
  },
  summary: {
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
  collection: 'books'
});

// Indexes
bookSchema.index({ slug: 1 }, { unique: true });
bookSchema.index({ status: 1 });
bookSchema.index({ is_featured: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ subject: 1 });
bookSchema.index({ level: 1 });
bookSchema.index({ created_by: 1 });
bookSchema.index({ isbn: 1 });
bookSchema.index({ title: 'text', description: 'text', author: 'text' }); // Text search

// Static methods
bookSchema.statics.create = async function(bookData) {
  const {
    title, author, description, category, level, pages, isbn,
    cover_image_url, pdf_url, status = 'draft', created_by
  } = bookData;

  if (!title || !author) {
    throw new Error('Title and Author are required');
  }

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const book = new this({
    title,
    slug,
    author,
    description: description || null,
    category: category || null,
    level: level || 'Foundation',
    pages: pages || null,
    isbn: isbn || null,
    cover_image_url: cover_image_url || null,
    pdf_url: pdf_url || null,
    status,
    created_by: created_by || new mongoose.Types.ObjectId()
  });

  return book.save();
};

bookSchema.statics.getAll = async function(page = 1, limit = 10, filters = {}) {
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

bookSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('created_by', 'name email');
};

bookSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug })
    .populate('created_by', 'name email');
};

bookSchema.statics.updateBook = async function(id, updateData) {
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

bookSchema.statics.deleteBook = function(id) {
  return this.findByIdAndDelete(id);
};

bookSchema.statics.updateBookStatus = async function(id, status) {
  return this.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).populate('created_by', 'name email');
};

bookSchema.statics.getStats = async function() {
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

bookSchema.statics.incrementDownloads = function(id) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { downloads: 1 } },
    { new: true }
  );
};

// Pre-save middleware
bookSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Create and export the model
const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
