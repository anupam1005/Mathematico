// Admin Controller - Handles admin panel operations with MongoDB
const connectDB = require('../config/database');
const cloudinary = require('cloudinary').v2;
<<<<<<< HEAD
const mongoose = require('mongoose');
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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
try {
  BookModel = require('../models/Book');
  UserModel = require('../models/User');
  CourseModel = require('../models/Course');
  LiveClassModel = require('../models/LiveClass');
  console.log('✅ Admin models loaded successfully');
} catch (error) {
  console.warn('⚠️ Admin models not available:', error && error.message ? error.message : error);
}

// Configure Cloudinary (with serverless-safe initialization)
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('✅ Cloudinary configured successfully');
} catch (error) {
  console.warn('⚠️ Cloudinary configuration failed:', error && error.message ? error.message : error);
}

/**
 * Get dashboard statistics
 */
const getDashboard = async (req, res) => {
  try {
<<<<<<< HEAD
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
      LiveClassModel ? LiveClassModel.countDocuments({ status: 'upcoming' }) : 0,
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
=======
    console.log('📊 Admin dashboard - database disabled');
    
    const dashboardData = {
      totalUsers: 0,
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalRevenue: 0,
      courseStats: { total: 0, published: 0, draft: 0 },
      liveClassStats: { total: 0, upcoming: 0, completed: 0 }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
<<<<<<< HEAD
      message: 'Dashboard data retrieved successfully'
=======
      message: 'Database functionality has been removed'
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
<<<<<<< HEAD
      error: error.message,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timestamp: new Date().toISOString()
    });
  }
};

// ============= USER MANAGEMENT =============

const getAllUsers = async (req, res) => {
  try {
<<<<<<< HEAD
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
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await UserModel.find(query)
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserModel.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      message: 'Users retrieved successfully'
=======
    console.log('👥 Admin users - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
<<<<<<< HEAD
      error: error.message,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timestamp: new Date().toISOString()
    });
  }
};

const getUserById = async (req, res) => {
  try {
<<<<<<< HEAD
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }
    await connectDB();
    const { id } = req.params;
    const user = await UserModel.findById(id).select('name email role status createdAt').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user, timestamp: new Date().toISOString() });
=======
    const { id } = req.params;
    console.log('👤 Admin user by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'User not found',
      timestamp: new Date().toISOString()
    });
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
<<<<<<< HEAD
      error: error.message,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timestamp: new Date().toISOString()
    });
  }
};

const createUser = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User creation is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const updateUser = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const deleteUser = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

// ============= BOOK MANAGEMENT =============

const getAllBooks = async (req, res) => {
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status (draft, published, etc.)

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    // Get books with pagination
<<<<<<< HEAD
    console.log('📚 Querying books with query:', JSON.stringify(query, null, 2));
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    const books = await BookModel.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BookModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
<<<<<<< HEAD
    
    console.log('📚 Found books:', books.length);
    console.log('📚 Total books in database:', total);
    console.log('📚 Database name:', mongoose.connection.db.databaseName);
    console.log('📚 Collection name:', BookModel.collection.name);
    
    // Check if collection exists and has documents
    const collectionStats = await mongoose.connection.db.collection(BookModel.collection.name).countDocuments();
    console.log('📚 Direct collection count:', collectionStats);
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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
    const { id } = req.params;
    console.log('📖 Admin book by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Book not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
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
<<<<<<< HEAD
      console.log('🔗 Attempting to connect to database...');
      await connectDB();
      console.log('✅ Database connection successful');
      console.log('📊 Database ready state:', mongoose.connection.readyState);
=======
      await connectDB();
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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

<<<<<<< HEAD
    // Validate category against enum values
    const validCategories = ['mathematics', 'physics', 'chemistry', 'biology', 'computer_science', 'engineering', 'science', 'general', 'reference', 'textbook'];
    const finalCategory = validCategories.includes(category) ? category : 'general';

    // No validation - admin can input anything they want
=======
    // Validate required fields
    if (!title || !description || !author || !category || !subject || !grade) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, author, category, subject, and grade are required'
      });
    }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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
            console.log('📸 Uploading cover image to Cloudinary...');
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
            console.log('✅ Cover image uploaded:', coverImageUrl);
          }

          // Upload PDF file
          if (req.files.pdfFile && req.files.pdfFile[0]) {
            console.log('📄 Uploading PDF to Cloudinary...');
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
            console.log('✅ PDF uploaded:', pdfFileUrl);
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
<<<<<<< HEAD
      title: title || 'Untitled Book',
      description: description || 'No description provided',
      author: author || 'Unknown Author',
      category: finalCategory, // Use validated category
      subject: subject || 'General',
      grade: grade || 'All Levels',
      pages: pages ? Math.max(1, parseInt(pages)) : 1, // Ensure at least 1 page
      price: price ? parseFloat(price) : undefined,
=======
      title,
      description,
      author,
      category,
      subject,
      grade,
      pages: pages ? parseInt(pages) : undefined,
      price: price ? parseFloat(price) : 0,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      currency,
      isFree: isFree === 'true' || isFree === true,
      isbn,
      edition,
      publisher,
      publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
      language,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
<<<<<<< HEAD
      coverImage: coverImageUrl || '',
      pdfFile: pdfFileUrl || '',
      status: 'draft', // Start as draft
      createdBy: req.user?.id, // Use admin ID from auth middleware
      isAvailable: true
    };

    console.log('📚 Creating book with data:', JSON.stringify(bookData, null, 2));
    console.log('📚 BookModel available:', !!BookModel);
    console.log('📚 Database connection status:', mongoose.connection.readyState);

    // Create book in database
    const book = await BookModel.create(bookData);
    console.log('✅ Book created successfully:', book._id);
=======
      coverImage: coverImageUrl,
      pdfFile: pdfFileUrl,
      status: 'draft', // Start as draft
      createdBy: req.user.id || 'admin-1', // Use admin ID
      isAvailable: true
    };

    // Create book in database
    const book = await BookModel.create(bookData);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateBookStatus = async (req, res) => {
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
    const { status } = req.body;

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (draft, published, archived) is required'
      });
    }

<<<<<<< HEAD
    // Prepare update data
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };
    
    // Set publishedAt when status changes to 'published'
    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    const book = await BookModel.findByIdAndUpdate(
      id,
      updateData,
=======
    const book = await BookModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
    const { status, category, subject, grade } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

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
      .populate('createdBy', 'name email')
      .populate('enrolledStudents.student', 'name email');

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

    const courseData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'draft'
    };

<<<<<<< HEAD
    // Handle instructor data
    if (req.body.instructorName) {
      courseData.instructor = {
        name: req.body.instructorName
      };
    }

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    // Handle file upload if present
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { 
              resource_type: 'image', 
              folder: 'mathematico/courses/thumbnails',
              public_id: `course_${Date.now()}`,
              format: 'jpg',
              quality: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.files.image[0].buffer);
        });
        courseData.thumbnail = imageResult.secure_url;
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
<<<<<<< HEAD
    } else if (req.body.thumbnail) {
      // Handle thumbnail URL if provided directly
      courseData.thumbnail = req.body.thumbnail;
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    }

    const course = await CourseModel.create(courseData);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const updateData = req.body;

    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;

    const course = await CourseModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

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

<<<<<<< HEAD
const updateCourseStatus = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'Course model unavailable' 
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

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (draft, published, archived) is required'
      });
    }

    // Prepare update data
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };
    
    // Set publishedAt when status changes to 'published'
    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    const course = await CourseModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: `Course ${status} successfully`,
      data: course,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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

<<<<<<< HEAD
    console.log('📝 Creating live class with data:', req.body);
    console.log('📎 File uploaded:', req.file ? 'Yes' : 'No');

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
=======
    const liveClassData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'scheduled'
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    };

    // Handle file upload if present
    if (req.file) {
      try {
<<<<<<< HEAD
        console.log('📤 Uploading thumbnail to Cloudinary...');
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
        console.log('✅ Thumbnail uploaded:', imageResult.secure_url);
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError);
        // Continue with default thumbnail
      }
    }

    // If no thumbnail provided, use a default placeholder
    if (!liveClassData.thumbnail) {
      liveClassData.thumbnail = 'https://res.cloudinary.com/dqy2ts9h6/image/upload/v1732276800/mathematico/default-liveclass-thumbnail.jpg';
      console.log('📷 Using default thumbnail');
    }

    console.log('💾 Saving live class to database...');
    const liveClass = await LiveClassModel.create(liveClassData);
    console.log('✅ Live class created successfully:', liveClass._id);
=======
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
    }

    const liveClass = await LiveClassModel.create(liveClassData);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

    res.status(201).json({
      success: true,
      message: 'Live class created successfully',
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
<<<<<<< HEAD
    console.error('❌ Create live class error:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
=======
    console.error('Create live class error:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    res.status(500).json({
      success: false,
      message: 'Failed to create live class',
      error: error.message,
<<<<<<< HEAD
      validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timestamp: new Date().toISOString()
    });
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

<<<<<<< HEAD
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

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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

<<<<<<< HEAD
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

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
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
=======
    console.log('💳 Admin payments - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
<<<<<<< HEAD
      error: error.message,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timestamp: new Date().toISOString()
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('💰 Admin payment by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Payment not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
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
        email: process.env.ADMIN_EMAIL || 'admin@mathematico.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        database: 'disabled',
        features: {
          userManagement: false,
          bookManagement: false,
          courseManagement: false,
          liveClassManagement: false,
          paymentManagement: false
        },
        message: 'Database functionality has been removed. Only authentication is available.'
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
  updateUserStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  
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
<<<<<<< HEAD
  updateCourseStatus: withTimeout(updateCourseStatus),
=======
  updateCourseStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  uploadCourseThumbnail: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  toggleCoursePublish: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  
  // Live Class Management
  getAllLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
<<<<<<< HEAD
  updateLiveClassStatus: withTimeout(updateLiveClassStatus),
=======
  updateLiveClassStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  
  // Payment Management
  getAllPayments,
  getPaymentById,
  updatePaymentStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  
  // File Upload
  uploadFile: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  
  // Statistics
  getBookStats: (req, res) => res.json({ success: true, data: { total: 0, published: 0, draft: 0 } }),
  getCourseStats: (req, res) => res.json({ success: true, data: { total: 0, published: 0, draft: 0 } }),
  getLiveClassStats: (req, res) => res.json({ success: true, data: { total: 0, upcoming: 0, completed: 0 } }),
  
  // Settings
<<<<<<< HEAD
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
      res.status(500).json({ success: false, message: 'Failed to get settings', error: error.message });
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
      res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
    }
  },
=======
  getSettings: (req, res) => res.json({ success: true, data: {} }),
  updateSettings: (req, res) => res.json({ success: true, message: 'Settings updated' }),
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  
  // Admin Info
  getAdminInfo
};