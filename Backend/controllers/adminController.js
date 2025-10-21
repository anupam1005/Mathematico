// Admin Controller - Handles admin panel operations with MongoDB
const connectDB = require('../config/database');
const cloudinary = require('cloudinary').v2;

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
    console.log('📊 Admin dashboard - database disabled');
    
    const dashboardData = {
      totalUsers: 0,
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalRevenue: 0,
      courseStats: { total: 0, published: 0, draft: 0 },
      liveClassStats: { total: 0, upcoming: 0, completed: 0 }
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= USER MANAGEMENT =============

const getAllUsers = async (req, res) => {
  try {
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
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      timestamp: new Date().toISOString()
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👤 Admin user by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'User not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
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
    const books = await BookModel.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BookModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

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
      await connectDB();
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
      title: title || 'Untitled Book',
      description: description || 'No description provided',
      author: author || 'Unknown Author',
      category: category || 'general',
      subject: subject || 'General',
      grade: grade || 'All Levels',
      pages: pages ? parseInt(pages) : undefined,
      price: price ? parseFloat(price) : 0,
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
      createdBy: req.user?.id || null, // Use admin ID or null
      isAvailable: true
    };

    // Create book in database
    const book = await BookModel.create(bookData);

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

    const book = await BookModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
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

    const liveClassData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'scheduled'
    };

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
        liveClassData.thumbnail = imageResult.secure_url;
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
      }
    }

    const liveClass = await LiveClassModel.create(liveClassData);

    res.status(201).json({
      success: true,
      message: 'Live class created successfully',
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create live class',
      error: error.message,
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
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
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
  updateCourseStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  uploadCourseThumbnail: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  toggleCoursePublish: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  
  // Live Class Management
  getAllLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  
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
  getSettings: (req, res) => res.json({ success: true, data: {} }),
  updateSettings: (req, res) => res.json({ success: true, message: 'Settings updated' }),
  
  // Admin Info
  getAdminInfo
};