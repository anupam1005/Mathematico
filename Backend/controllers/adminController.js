// Admin Controller - Handles admin panel operations with MongoDB
const connectDB = require('../config/database');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { uploadFileToCloud } = require('../utils/fileUpload');

// Serverless timeout wrapper (Vercel has 30s limit)
const withTimeout = (fn, timeoutMs = 25000) => {
  return async (req, res) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: 'Request timeout - serverless function exceeded time limit',
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    try {
      await fn(req, res);
    } finally {
      clearTimeout(timeout);
    }
  };
};

// Import models
let BookModel, UserModel, CourseModel, LiveClassModel;
let PaymentModel;
try {
  BookModel = require('../models/Book');
  UserModel = require('../models/User');
  CourseModel = require('../models/Course');
  LiveClassModel = require('../models/LiveClass');
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Admin models loaded successfully');
  }
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Admin models not available:', error && error.message ? error.message : error);
  }
}

try {
  PaymentModel = require('../models/Payment');
} catch (_) {
  PaymentModel = null;
}

// Configure Cloudinary (with serverless-safe initialization)
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Cloudinary configured successfully');
  }
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Cloudinary configuration failed:', error && error.message ? error.message : error);
  }
}

/**
 * Get dashboard statistics
 */
const getDashboard = async (req, res) => {
  try {
    // Ensure database connection
    await connectDB();
    
    // Get real statistics from database
    const [
      totalUsers,
      totalBooks,
      totalCourses,
      totalLiveClasses,
      publishedCourses,
      draftCourses,
      upcomingClasses,
      completedClasses
    ] = await Promise.all([
      UserModel ? UserModel.countDocuments({}) : 0,
      BookModel ? BookModel.countDocuments({}) : 0,
      CourseModel ? CourseModel.countDocuments({}) : 0,
      LiveClassModel ? LiveClassModel.countDocuments({}) : 0,
      CourseModel ? CourseModel.countDocuments({ status: 'published' }) : 0,
      CourseModel ? CourseModel.countDocuments({ status: 'draft' }) : 0,
      LiveClassModel ? LiveClassModel.countDocuments({ status: 'scheduled' }) : 0,
      LiveClassModel ? LiveClassModel.countDocuments({ status: 'completed' }) : 0
    ]);

    // Fetch recent users and courses
    const [recentUsers, recentCourses] = await Promise.all([
      UserModel ? UserModel.find({})
        .select('name email createdAt role')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean() : [],
      CourseModel ? CourseModel.find({})
        .select('title category status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean() : []
    ]);

    const dashboardData = {
      totalUsers,
      totalBooks,
      totalCourses,
      totalLiveClasses,
      totalRevenue: 0, // TODO: Implement revenue calculation
      courseStats: { 
        total: totalCourses, 
        published: publishedCourses, 
        draft: draftCourses 
      },
      liveClassStats: { 
        total: totalLiveClasses, 
        upcoming: upcomingClasses, 
        completed: completedClasses 
      },
      recentUsers: recentUsers || [],
      recentCourses: recentCourses || []
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= USER MANAGEMENT =============

const getAllUsers = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { role, status, search } = req.query;

    const query = {};
    if (role) query.role = role;
    // Normalize "status" filter to actual model fields
    if (typeof status === 'string' && status.trim()) {
      const normalized = status.trim().toLowerCase();
      if (normalized === 'active') query.isActive = true;
      else if (normalized === 'inactive' || normalized === 'deactivated') query.isActive = false;
      else if (normalized === 'true') query.isActive = true;
      else if (normalized === 'false') query.isActive = false;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await UserModel.find(query)
      .select('name email role isActive isEmailVerified createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserModel.countDocuments(query);

    res.json({
      success: true,
      data: (users || []).map(u => ({
        ...u,
        id: u._id?.toString?.() || u.id,
        isAdmin: u.role === 'admin',
        is_admin: u.role === 'admin',
        is_active: u.isActive !== false,
        status: u.isActive !== false ? 'active' : 'inactive',
        email_verified: u.isEmailVerified === true,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getUserById = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }
    await connectDB();
    const { id } = req.params;
    const user = await UserModel.findById(id).select('name email role isActive isEmailVerified createdAt updatedAt').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        ...user,
        id: user._id?.toString?.() || user.id,
        isAdmin: user.role === 'admin',
        is_admin: user.role === 'admin',
        is_active: user.isActive !== false,
        status: user.isActive !== false ? 'active' : 'inactive',
        email_verified: user.isEmailVerified === true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const createUser = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();

    const { name, email, password, role, isActive, isEmailVerified, isAdmin } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    let normalizedRole = 'student';
    const candidateRole = isAdmin === true ? 'admin' : role;
    if (['student', 'admin', 'teacher'].includes(candidateRole)) {
      normalizedRole = candidateRole;
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      isActive: isActive !== false,
      isEmailVerified: isEmailVerified === true
    });

    const publicUser = user.getPublicProfile ? user.getPublicProfile() : user;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: publicUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateUser = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const { name, email, password, role, isActive, isEmailVerified, isAdmin } = req.body;

    const user = await UserModel.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existing = await UserModel.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      user.email = normalizedEmail;
    }

    if (name) user.name = name.trim();

    const candidateRole = isAdmin === true ? 'admin' : role;
    if (candidateRole && ['student', 'admin', 'teacher'].includes(candidateRole)) {
      user.role = candidateRole;
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    if (typeof isEmailVerified === 'boolean') {
      user.isEmailVerified = isEmailVerified;
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }
      user.password = password;
    }

    user.updatedAt = new Date();
    await user.save();

    const publicUser = user.getPublicProfile ? user.getPublicProfile() : user;

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: publicUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    if (req.user && req.user.id && req.user.id.toString() === id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' && user.email === (process.env.ADMIN_EMAIL || '').toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete primary admin account'
      });
    }

    await UserModel.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const { status, isActive } = req.body;

    let nextStatus;
    if (typeof isActive === 'boolean') {
      nextStatus = isActive;
    } else if (typeof status === 'boolean') {
      nextStatus = status;
    } else if (typeof status === 'string') {
      const normalized = status.toLowerCase();
      if (['active', 'true', '1'].includes(normalized)) {
        nextStatus = true;
      } else if (['inactive', 'false', '0'].includes(normalized)) {
        nextStatus = false;
      }
    }

    if (typeof nextStatus !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isActive: nextStatus, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'User status updated successfully',
      data: user.getPublicProfile ? user.getPublicProfile() : user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= BOOK MANAGEMENT =============

const getAllBooks = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ success: false, message: 'Book model unavailable' });
    }

    // Ensure DB is connected (serverless-safe)
    try {
      await connectDB();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status (draft, published, etc.)

    // Build query
    const query = {};
    if (status) query.status = status;

    // Get books with pagination
    if (process.env.NODE_ENV !== 'production') {
      console.log('📚 Querying books with query:', JSON.stringify(query, null, 2));
    }
    const books = await BookModel.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BookModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📚 Found books:', books.length);
      console.log('📚 Total books in database:', total);
      console.log('📚 Database name:', mongoose.connection.db.databaseName);
      console.log('📚 Collection name:', BookModel.collection.name);
      
      // Check if collection exists and has documents
      const collectionStats = await mongoose.connection.db.collection(BookModel.collection.name).countDocuments();
      console.log('📚 Direct collection count:', collectionStats);
    }

    res.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getBookById = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ success: false, message: 'Book model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const book = await BookModel.findById(id).populate('createdBy', 'name email').lean();

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: book,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const createBook = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'Book model unavailable' 
      });
    }

    // Ensure DB is connected (serverless-safe)
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 Attempting to connect to database...');
      }
      await connectDB();
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Database connection successful');
        console.log('📊 Database ready state:', mongoose.connection.readyState);
      }
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }

    const {
      title,
      description,
      author,
      category,
      subject,
      grade,
      pages,
      price,
      currency = 'INR',
      isFree = false,
      isbn,
      edition,
      publisher,
      publicationYear,
      language = 'en',
      tags = []
    } = req.body;

    // Validate category against enum values
    const validCategories = ['mathematics', 'physics', 'chemistry', 'biology', 'computer_science', 'engineering', 'science', 'general', 'reference', 'textbook'];
    const finalCategory = validCategories.includes(category) ? category : 'general';

    // No validation - admin can input anything they want

    // Handle file uploads to Cloudinary
    let coverImageUrl = '';
    let pdfFileUrl = '';

    if (req.files) {
      try {
        // Check Cloudinary configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          console.warn('⚠️ Cloudinary credentials not configured, skipping file uploads');
        } else {
          // Upload cover image
          if (req.files.coverImage && req.files.coverImage[0]) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('📸 Uploading cover image to Cloudinary...');
            }
            const coverResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { 
                  resource_type: 'image', 
                  folder: 'mathematico/books/covers',
                  public_id: `cover_${Date.now()}`,
                  format: 'jpg',
                  quality: 'auto'
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(req.files.coverImage[0].buffer);
            });
            coverImageUrl = coverResult.secure_url;
            if (process.env.NODE_ENV !== 'production') {
              console.log('✅ Cover image uploaded:', coverImageUrl);
            }
          }

          // Upload PDF file
          if (req.files.pdfFile && req.files.pdfFile[0]) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('📄 Uploading PDF to Cloudinary...');
            }
            const pdfResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { 
                  resource_type: 'raw', 
                  folder: 'mathematico/books/pdfs',
                  public_id: `pdf_${Date.now()}`
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              uploadStream.end(req.files.pdfFile[0].buffer);
            });
            pdfFileUrl = pdfResult.secure_url;
            if (process.env.NODE_ENV !== 'production') {
              console.log('✅ PDF uploaded:', pdfFileUrl);
            }
          }
        }
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError);
        // Don't fail the entire request if file upload fails
        console.warn('⚠️ Continuing without file uploads due to error');
      }
    }

    // Create book data
    const bookData = {
      title: title || 'Untitled Book',
      description: description || 'No description provided',
      author: author || 'Unknown Author',
      category: finalCategory, // Use validated category
      subject: subject || 'General',
      grade: grade || 'All Levels',
      pages: pages ? Math.max(1, parseInt(pages)) : 1, // Ensure at least 1 page
      price: price ? parseFloat(price) : undefined,
      currency,
      isFree: isFree === 'true' || isFree === true,
      isbn,
      edition,
      publisher,
      publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
      language,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      coverImage: coverImageUrl || '',
      pdfFile: pdfFileUrl || '',
      status: 'draft', // Start as draft
      createdBy: req.user?.id, // Use admin ID from auth middleware
      isAvailable: true
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('📚 Creating book with data:', JSON.stringify(bookData, null, 2));
      console.log('📚 BookModel available:', !!BookModel);
      console.log('📚 Database connection status:', mongoose.connection.readyState);
    }

    // Create book in database
    const book = await BookModel.create(bookData);
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Book created successfully:', book._id);
    }

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateBook = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'Book model unavailable' 
      });
    }

    // Ensure DB is connected (serverless-safe)
    try {
      await connectDB();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      try {
        const coverResult = await uploadFileToCloud(
          req.files.coverImage[0],
          'mathematico/books/covers',
          'cloudinary'
        );
        updateData.coverImage = coverResult.url;
      } catch (uploadError) {
        console.error('Cover image upload error:', uploadError);
      }
    }

    if (req.files && req.files.pdfFile && req.files.pdfFile[0]) {
      try {
        const pdfResult = await uploadFileToCloud(
          req.files.pdfFile[0],
          'mathematico/books/pdfs',
          'cloudinary'
        );
        updateData.pdfFile = pdfResult.url;
      } catch (uploadError) {
        console.error('PDF upload error:', uploadError);
      }
    }

    const book = await BookModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update book error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to update book',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

const updateBookStatus = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ success: false, message: 'Book model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'published', 'archived', 'pending_review'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (draft, published, archived, pending_review) is required'
      });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    const book = await BookModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({
      success: true,
      message: `Book ${status} successfully`,
      data: book,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update book status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ success: false, message: 'Book model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const book = await BookModel.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= COURSE MANAGEMENT =============

const getAllCourses = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, category, level, subject, grade, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (level) query.level = level;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await CourseModel.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CourseModel.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const course = await CourseModel.findById(id)
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: course,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const createCourse = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();

    const {
      title,
      description,
      shortDescription,
      category,
      subject,
      grade,
      level,
      price,
      currency = 'INR',
      isFree = false,
      duration,
      tags = [],
      instructorName,
      instructorBio,
      instructorQualifications,
      instructorExperience,
      status,
      thumbnail,
      startDate,
      endDate,
      enrollmentDeadline
    } = req.body;

    const validCategories = ['mathematics', 'physics', 'chemistry', 'biology', 'computer_science', 'engineering', 'science', 'general', 'preparation', 'remedial'];
    const normalizedCategory = validCategories.includes(String(category || '').toLowerCase())
      ? String(category).toLowerCase()
      : 'general';

    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const normalizedLevel = validLevels.includes(String(level || '').toLowerCase())
      ? String(level).toLowerCase()
      : 'beginner';

    const validStatuses = ['draft', 'published', 'archived', 'suspended'];
    const normalizedStatus = validStatuses.includes(status) ? status : 'draft';

    let instructorUser = null;
    try {
      instructorUser = await UserModel.findById(req.user.id).select('name email');
    } catch (error) {
      console.warn('Unable to load instructor user details:', error.message);
    }

    let thumbnailUrl = '';
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          console.warn('⚠️ Cloudinary credentials not configured, skipping course thumbnail upload');
        } else {
          const imageResult = await uploadFileToCloud(
            req.files.image[0],
            'mathematico/courses/thumbnails',
            'cloudinary'
          );
          thumbnailUrl = imageResult.url;
        }
      } catch (uploadError) {
        console.error('Course thumbnail upload error:', uploadError);
      }
    } else if (thumbnail) {
      thumbnailUrl = thumbnail;
    }

    // Optional course PDF upload (field name: pdf)
    let pdfFileUrl = '';
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          console.warn('⚠️ Cloudinary credentials not configured, skipping course PDF upload');
        } else {
          const pdfResult = await uploadFileToCloud(
            req.files.pdf[0],
            'mathematico/courses/pdfs',
            'cloudinary'
          );
          pdfFileUrl = pdfResult.url;
        }
      } catch (uploadError) {
        console.error('Course PDF upload error:', uploadError);
      }
    }

    if (!thumbnailUrl) {
      thumbnailUrl = 'https://via.placeholder.com/800x450.png?text=Course';
    }

    const isFreeNormalized = isFree === 'true' || isFree === true;
    const numericPrice = isFreeNormalized ? 0 : parseFloat(price);
    const normalizedPrice = Number.isFinite(numericPrice) ? numericPrice : 0;

    const numericDuration = parseInt(duration, 10);
    const normalizedDuration = Number.isFinite(numericDuration) && numericDuration > 0 ? numericDuration : 1;

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

    const parsedQualifications = Array.isArray(instructorQualifications)
      ? instructorQualifications
      : typeof instructorQualifications === 'string'
        ? instructorQualifications.split(',').map(value => value.trim()).filter(Boolean)
        : [];

    const courseData = {
      title: title || 'Untitled Course',
      description: description || 'No description provided',
      shortDescription,
      category: normalizedCategory,
      subject: subject || 'General',
      grade: grade || 'All Levels',
      level: normalizedLevel,
      price: normalizedPrice,
      currency,
      isFree: isFreeNormalized,
      duration: normalizedDuration,
      tags: parsedTags,
      thumbnail: thumbnailUrl,
      pdfFile: pdfFileUrl || '',
      instructor: {
        name: instructorName || (instructorUser && instructorUser.name) || 'Admin',
        bio: instructorBio || '',
        qualifications: parsedQualifications,
        experience: instructorExperience || ''
      },
      createdBy: req.user?.id,
      status: normalizedStatus,
      isAvailable: true,
      startDate,
      endDate,
      enrollmentDeadline
    };

    const course = await CourseModel.create(courseData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    // Ensure we always return JSON, even in error cases
    const errorResponse = {
      success: false,
      message: 'Failed to create course',
      error: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    };
    
    // Check if headers already sent
    if (!res.headersSent) {
      res.status(500).json(errorResponse);
    }
  }
};

const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const imageResult = await uploadFileToCloud(
      req.file,
      'mathematico/courses/thumbnails',
      'cloudinary'
    );

    res.json({
      success: true,
      data: {
        url: imageResult.url
      },
      message: 'Thumbnail uploaded successfully'
    });
  } catch (error) {
    console.error('Upload course thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload course thumbnail',
      error: error.message
    });
  }
};

const toggleCoursePublish = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const course = await CourseModel.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    course.status = nextStatus;
    if (nextStatus === 'published') {
      course.publishedAt = new Date();
    }
    course.updatedAt = new Date();

    await course.save();

    res.json({
      success: true,
      message: `Course ${nextStatus} successfully`,
      data: course,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Toggle course publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle course publish status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'Course model unavailable' 
      });
    }

    // Ensure DB is connected (serverless-safe)
    try {
      await connectDB();
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message,
      });
    }

    const { id } = req.params;
    const updateData = { ...(req.body || {}) };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.enrolledStudents;
    delete updateData.reviews;

    // Normalize boolean fields sent via multipart/form-data
    if (typeof updateData.isFree === 'string') {
      updateData.isFree = updateData.isFree === 'true';
    }
    if (typeof updateData.isAvailable === 'string') {
      updateData.isAvailable = updateData.isAvailable === 'true';
    }

    // Handle image upload if present (field name: image)
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        const imageResult = await uploadFileToCloud(
          req.files.image[0],
          'mathematico/courses/thumbnails',
          'cloudinary'
        );
        updateData.thumbnail = imageResult.url;
      } catch (uploadError) {
        console.error('Course thumbnail upload error:', uploadError);
      }
    }

    // Handle PDF upload if present (field name: pdf)
    if (req.files && req.files.pdf && req.files.pdf[0]) {
      try {
        const pdfResult = await uploadFileToCloud(
          req.files.pdf[0],
          'mathematico/courses/pdfs',
          'cloudinary'
        );
        updateData.pdfFile = pdfResult.url;
      } catch (uploadError) {
        console.error('Course PDF upload error:', uploadError);
      }
    }

    // Manage publishedAt automatically when status changes to published
    if (updateData.status === 'published') {
      updateData.publishedAt = new Date();
    }
    updateData.updatedAt = new Date();

    const course = await CourseModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const course = await CourseModel.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= LIVE CLASS MANAGEMENT =============

const getAllLiveClasses = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, category, subject, grade } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    const liveClasses = await LiveClassModel.find(query)
      .populate('createdBy', 'name email')
      .populate('instructor.instructorId', 'name email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LiveClassModel.countDocuments(query);

    res.json({
      success: true,
      data: liveClasses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getLiveClassById = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const liveClass = await LiveClassModel.findById(id)
      .populate('createdBy', 'name email')
      .populate('instructor.instructorId', 'name email')
      .populate('enrolledStudents.student', 'name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const createLiveClass = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();

    if (process.env.NODE_ENV !== 'production') {
      console.log('📝 Creating live class with data:', req.body);
      console.log('📎 File uploaded:', req.file ? 'Yes' : 'No');
    }

    // Get user information for instructor field
    const user = await UserModel.findById(req.user.id).select('name email');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Parse numeric fields from FormData (they come as strings)
    const duration = parseInt(req.body.duration) || 60;
    const maxStudents = parseInt(req.body.maxStudents) || 50;

    const liveClassData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subject: req.body.subject,
      grade: req.body.grade,
      level: req.body.level || 'beginner',
      duration: duration,
      maxStudents: maxStudents,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      scheduledAt: req.body.scheduledAt,
      meetingLink: req.body.meetingLink,
      status: req.body.status || 'scheduled',
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      createdBy: req.user.id,
      // Add required instructor field
      instructor: {
        name: user.name || 'Admin',
        instructorId: req.user.id,
        bio: req.body.instructorBio || '',
        qualifications: req.body.instructorQualifications || [],
        experience: req.body.instructorExperience || ''
      },
      // Add timezone if not provided
      timezone: req.body.timezone || 'Asia/Kolkata'
    };

    // Handle file upload if present
    if (req.file) {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📤 Uploading thumbnail to Cloudinary...');
        }
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              resource_type: 'image', 
              folder: 'mathematico/liveclasses/thumbnails',
              public_id: `liveclass_${Date.now()}`,
              format: 'jpg',
              quality: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        liveClassData.thumbnail = imageResult.secure_url;
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Thumbnail uploaded:', imageResult.secure_url);
        }
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError);
        // Continue with default thumbnail
      }
    }

    // If no thumbnail provided, use a default placeholder
    if (!liveClassData.thumbnail) {
      liveClassData.thumbnail = 'https://res.cloudinary.com/dqy2ts9h6/image/upload/v1732276800/mathematico/default-liveclass-thumbnail.jpg';
      if (process.env.NODE_ENV !== 'production') {
        console.log('📷 Using default thumbnail');
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('💾 Saving live class to database...');
    }
    const liveClass = await LiveClassModel.create(liveClassData);
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Live class created successfully:', liveClass._id);
    }

    res.status(201).json({
      success: true,
      message: 'Live class created successfully',
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Create live class error:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to create live class',
        error: error.message,
        validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }
};

const updateLiveClass = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const updateData = req.body;

    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Handle file upload if present
    if (req.file) {
      try {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              resource_type: 'image', 
              folder: 'mathematico/liveclasses/thumbnails',
              public_id: `liveclass_${Date.now()}`,
              format: 'jpg',
              quality: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        updateData.thumbnail = imageResult.secure_url;
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
    }

    const liveClass = await LiveClassModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    res.json({
      success: true,
      message: 'Live class updated successfully',
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateLiveClassStatus = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'LiveClass model unavailable' 
      });
    }

    // Ensure DB is connected (serverless-safe)
    try {
      console.log('🔗 Attempting to connect to database...');
      await connectDB();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['scheduled', 'live', 'completed', 'cancelled', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (scheduled, live, completed, cancelled, archived) is required'
      });
    }

    // Prepare update data
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };
    
    // Set startedAt when status changes to 'live'
    if (status === 'live') {
      updateData.startedAt = new Date();
    }
    
    // Set completedAt when status changes to 'completed'
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const liveClass = await LiveClassModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    res.json({
      success: true,
      message: `Live class ${status} successfully`,
      data: liveClass,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update live class status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live class status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const deleteLiveClass = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();
    const { id } = req.params;

    const liveClass = await LiveClassModel.findByIdAndDelete(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found'
      });
    }

    res.json({
      success: true,
      message: 'Live class deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= PAYMENT MANAGEMENT =============

const getAllPayments = async (req, res) => {
  try {
    // If you have a PaymentModel, use it; else return empty but without the removed message
    let PaymentModel;
    try { PaymentModel = require('../models/Payment'); } catch (_) {}

    await connectDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (PaymentModel) {
      const payments = await PaymentModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      const total = await PaymentModel.countDocuments({});
      return res.json({
        success: true,
        data: payments,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        timestamp: new Date().toISOString(),
        message: 'Payments retrieved successfully'
      });
    }

    // Graceful fallback if no model
    res.json({
      success: true,
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      timestamp: new Date().toISOString(),
      message: 'No payments found'
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    let PaymentModelLocal;
    try { PaymentModelLocal = require('../models/Payment'); } catch (_) {}

    if (!PaymentModelLocal) {
      return res.status(503).json({
        success: false,
        message: 'Payment model unavailable',
        timestamp: new Date().toISOString(),
      });
    }

    await connectDB();
    const { id } = req.params;

    const payment = await PaymentModelLocal.findById(id).lean();
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      data: payment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    let PaymentModel;
    try { PaymentModel = require('../models/Payment'); } catch (_) {}

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Payment status is required'
      });
    }

    await connectDB();

    if (PaymentModel) {
      const payment = await PaymentModel.findByIdAndUpdate(
        id,
        { status, updatedAt: new Date() },
        { new: true }
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      return res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: payment,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: 'Payment status updated (no model configured)',
      data: { id, status },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= FILE UPLOAD =============

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    const folder = req.body?.folder || 'mathematico/admin/uploads';
    const result = await uploadFileToCloud(req.file, folder, 'cloudinary');

    return res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        service: result.service
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ============= ADMIN INFO =============

const getAdminInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        adminName: 'Admin User',
        email: process.env.ADMIN_EMAIL || 'dc2006089@gmail.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        database: 'enabled',
        features: {
          userManagement: false,
          bookManagement: false,
          courseManagement: false,
          liveClassManagement: false,
          paymentManagement: false
        },
        message: 'Database functionality is now enabled. Full admin management available.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin info',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  // Dashboard
  getDashboard,
  
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  
  // Book Management
  getAllBooks: withTimeout(getAllBooks),
  getBookById,
  createBook: withTimeout(createBook),
  updateBook: withTimeout(updateBook),
  deleteBook: withTimeout(deleteBook),
  updateBookStatus: withTimeout(updateBookStatus),
  
  // Course Management
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus: withTimeout(updateCourseStatus),
  uploadCourseThumbnail,
  toggleCoursePublish,
  
  // Live Class Management
  getAllLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus: withTimeout(updateLiveClassStatus),
  
  // Payment Management
  getAllPayments,
  getPaymentById,
  updatePaymentStatus: withTimeout(updatePaymentStatus),
  
  // File Upload
  uploadFile: withTimeout(uploadFile),
  
  // Statistics
  getBookStats: (req, res) => res.json({ success: true, data: { total: 0, published: 0, draft: 0 } }),
  getCourseStats: (req, res) => res.json({ success: true, data: { total: 0, published: 0, draft: 0 } }),
  getLiveClassStats: (req, res) => res.json({ success: true, data: { total: 0, upcoming: 0, completed: 0 } }),
  
  // Settings
  getSettings: async (req, res) => {
    try {
      let SettingsModel;
      try { SettingsModel = require('../models/Settings'); } catch (_) {}
      await connectDB();
      if (SettingsModel) {
        let settings = await SettingsModel.findOne({}) || await SettingsModel.create({});
        return res.json({ success: true, data: settings, message: 'Settings retrieved successfully' });
      }
      return res.json({ success: true, data: {}, message: 'No settings found' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get settings', error: error.message, timestamp: new Date().toISOString() });
    }
  },
  updateSettings: async (req, res) => {
    try {
      let SettingsModel;
      try { SettingsModel = require('../models/Settings'); } catch (_) {}
      await connectDB();
      if (SettingsModel) {
        const update = req.body || {};
        const settings = await SettingsModel.findOneAndUpdate({}, update, { upsert: true, new: true });
        return res.json({ success: true, message: 'Settings updated successfully', data: settings });
      }
      return res.json({ success: true, message: 'Settings saved (no model configured)', data: req.body });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message, timestamp: new Date().toISOString() });
    }
  },
  
  // Admin Info
  getAdminInfo: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          adminName: 'Admin User',
          email: process.env.ADMIN_EMAIL || 'c2006089@gmail.com',
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          database: 'enabled',
          features: {
            userManagement: true,
            bookManagement: true,
            courseManagement: true,
            liveClassManagement: true,
            paymentManagement: true
          },
          message: 'Database functionality is now enabled. Full admin management available.'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting admin info:', error);
      res.status(500).json({ success: false, message: 'Failed to get admin info', timestamp: new Date().toISOString() });
    }
  }
};