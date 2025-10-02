const mongoose = require('mongoose');

// Live Class Schema
const liveClassSchema = new mongoose.Schema({
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
  thumbnail: {
    type: String,
    default: null
  },
  meeting_link: {
    type: String,
    required: true,
    trim: true
  },
  meeting_id: {
    type: String,
    default: null,
    trim: true
  },
  meeting_password: {
    type: String,
    default: null,
    trim: true
  },
  date: {
    type: Date,
    default: null
  },
  started_at: {
    type: Date,
    default: null
  },
  ended_at: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    required: true,
    default: 60,
    min: 1
  },
  max_students: {
    type: Number,
    required: true,
    default: 50,
    min: 1
  },
  enrolled_students: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0.00,
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
    enum: ['draft', 'upcoming', 'live', 'completed', 'cancelled'],
    default: 'draft'
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  is_recording_enabled: {
    type: Boolean,
    default: false
  },
  recording_url: {
    type: String,
    default: null
  },
  topics: {
    type: [String],
    default: []
  },
  prerequisites: {
    type: String,
    default: null
  },
  materials: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  instructor: {
    type: String,
    default: 'Admin',
    trim: true,
    maxlength: 255
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'live_classes'
});

// Indexes
liveClassSchema.index({ slug: 1 }, { unique: true });
liveClassSchema.index({ status: 1 });
liveClassSchema.index({ is_featured: 1 });
liveClassSchema.index({ category: 1 });
liveClassSchema.index({ subject: 1 });
liveClassSchema.index({ level: 1 });
liveClassSchema.index({ date: 1 });
liveClassSchema.index({ created_by: 1 });
liveClassSchema.index({ title: 'text', description: 'text' }); // Text search

// Static methods
liveClassSchema.statics.create = async function(liveClassData) {
  const {
    title, description, instructor, date, duration, maxStudents, price,
    status = 'draft', meetingLink, thumbnail, category, subject, class: classField, level, created_by
  } = liveClassData;

  if (!title || !meetingLink) {
    throw new Error('Title and Meeting Link are required');
  }

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const liveClass = new this({
    title,
    slug,
    description: description || null,
    instructor: instructor || 'Admin',
    date: date || null,
    duration: duration || 60,
    max_students: maxStudents || 50,
    price: price || 0,
    status,
    meeting_link: meetingLink,
    thumbnail: thumbnail || null,
    category: category || null,
    subject: subject || null,
    class: classField || null,
    level: level || 'Foundation',
    created_by: created_by || '1'
  });

  return liveClass.save();
};

liveClassSchema.statics.getAll = async function(page = 1, limit = 10, filters = {}) {
  const query = {};
  
  // Apply filters
  if (filters.status) query.status = filters.status;
  if (filters.statusIn) query.status = { $in: filters.statusIn };
  if (filters.category) query.category = filters.category;
  if (filters.subject) query.subject = filters.subject;
  if (filters.level) query.level = filters.level;
  if (filters.is_featured) query.is_featured = filters.is_featured;
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.find(query)
      .populate('created_by', 'name email')
      .sort({ date: -1 })
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

liveClassSchema.statics.findById = function(id) {
  return this.findOne({ _id: id })
    .populate('created_by', 'name email');
};

liveClassSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug })
    .populate('created_by', 'name email');
};

liveClassSchema.statics.updateLiveClass = async function(id, updateData) {
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

liveClassSchema.statics.deleteLiveClass = function(id) {
  return this.findByIdAndDelete(id);
};

liveClassSchema.statics.updateLiveClassStatus = async function(id, status) {
  return this.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true }
  ).populate('created_by', 'name email');
};

liveClassSchema.statics.getStats = async function() {
  const [total, upcoming, live, completed, cancelled] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'upcoming' }),
    this.countDocuments({ status: 'live' }),
    this.countDocuments({ status: 'completed' }),
    this.countDocuments({ status: 'cancelled' })
  ]);
  
  return {
    total,
    upcoming,
    live,
    completed,
    cancelled
  };
};

liveClassSchema.statics.incrementEnrollment = function(id) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { enrolled_students: 1 } },
    { new: true }
  );
};

liveClassSchema.statics.decrementEnrollment = function(id) {
  return this.findByIdAndUpdate(
    id,
    { $inc: { enrolled_students: -1 } },
    { new: true }
  );
};

liveClassSchema.statics.startLiveClass = function(id) {
  return this.findByIdAndUpdate(
    id,
    { 
      $set: { 
        status: 'live',
        started_at: new Date()
      }
    },
    { new: true }
  );
};

liveClassSchema.statics.endLiveClass = function(id) {
  return this.findByIdAndUpdate(
    id,
    { 
      $set: { 
        status: 'completed',
        ended_at: new Date()
      }
    },
    { new: true }
  );
};

// Pre-save middleware
liveClassSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Create and export the model
const LiveClass = mongoose.model('LiveClass', liveClassSchema);

module.exports = LiveClass;
