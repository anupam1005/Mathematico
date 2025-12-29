// Mobile Controller - Handles requests from React Native mobile app with MongoDB
const connectDB = require('../config/database');

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
let BookModel, CourseModel, LiveClassModel;
try {
  BookModel = require('../models/Book');
  CourseModel = require('../models/Course');
  LiveClassModel = require('../models/LiveClass');
  console.log('✅ Mobile models loaded successfully');
} catch (error) {
  console.warn('⚠️ Mobile models not available:', error && error.message ? error.message : error);
}

/**
 * Get all courses for mobile app
 */
const getAllCourses = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    console.log('📱 Mobile: Fetching courses...');
    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, category, level, search } = req.query;

    // Build query object
    const query = { isAvailable: true };
    
    // Add status filter (default to published if not specified)
    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add level filter
    if (level) {
      query.level = level;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📱 Mobile: Querying courses with filters:', { 
      query,
      page, 
      limit, 
      skip 
    });

    const courses = await CourseModel.find(query)
      .select('-enrolledStudents -reviews -curriculum')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to get plain JavaScript objects without virtuals

    console.log('📱 Mobile: Found courses:', courses.length);

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
    console.error('❌ Mobile: Error fetching courses:', error);
    console.error('❌ Mobile: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all books for mobile app (only published books)
 */
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
    const category = req.query.category;
    const subject = req.query.subject;
    const grade = req.query.grade;

    // Build query - only show published and available books
    const query = {
      status: 'published',
      isAvailable: true
    };

    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    // Get books with pagination
    const books = await BookModel.find(query)
      .select('-pdfFile') // Don't include PDF file URL in list
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to get plain JavaScript objects without virtuals

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

/**
 * Get book by ID with secure PDF access
 */
const getBookById = async (req, res) => {
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

    // Get book details (without PDF URL)
    const book = await BookModel.findOne({
      _id: id,
      status: 'published',
      isAvailable: true
    }).select('-pdfFile');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found or not available'
      });
    }

    res.json({
      success: true,
      data: book,
      timestamp: new Date().toISOString()
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

/**
 * Get secure PDF viewer URL (read-only, no download)
 */
const getSecurePdfViewer = async (req, res) => {
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
    console.log('📖 Fetching PDF viewer for book:', id);

    // Get book with PDF URL - check both published and draft for debugging
    let book = await BookModel.findOne({
      _id: id,
      status: 'published',
      isAvailable: true
    }).select('title pdfFile status isAvailable');

    // If not found in published, try to find the book anyway for better error message
    if (!book) {
      book = await BookModel.findById(id).select('title pdfFile status isAvailable');
      if (book) {
        console.log('⚠️ Book found but not published:', { status: book.status, isAvailable: book.isAvailable });
        return res.status(403).json({
          success: false,
          message: `Book is not available (status: ${book.status}, available: ${book.isAvailable})`
        });
      }
    }

    if (!book) {
      console.log('❌ Book not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!book.pdfFile) {
      console.log('❌ PDF file not found for book:', id);
      return res.status(404).json({
        success: false,
        message: 'PDF file not available for this book'
      });
    }

    console.log('📄 Book PDF URL:', book.pdfFile);

    // Generate secure viewer URL with restrictions
    const secureViewerUrl = generateSecurePdfUrl(book.pdfFile, book.title);
    
    if (!secureViewerUrl) {
      console.log('❌ Failed to generate secure viewer URL');
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF viewer URL'
      });
    }

    console.log('✅ Secure viewer URL generated:', secureViewerUrl);

    res.json({
      success: true,
      data: {
        viewerUrl: secureViewerUrl,
        title: book.title,
        restrictions: {
          download: false,
          print: false,
          copy: false,
          screenshot: false
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting secure PDF viewer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PDF viewer',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Generate secure PDF URL with restrictions
 * Ensures PDFs are viewable in WebView with proper text rendering
 */
const generateSecurePdfUrl = (pdfUrl, title) => {
  if (!pdfUrl) {
    return null;
  }
  
  // For Cloudinary PDFs, ensure HTTPS and proper format for iframe embedding
  if (pdfUrl.includes('cloudinary.com')) {
    // Ensure HTTPS
    let secureUrl = pdfUrl.replace('http://', 'https://');
    
    // If URL doesn't have /upload/, it might already be a direct URL
    if (!secureUrl.includes('/upload/')) {
      return secureUrl;
    }
    
    // For Cloudinary, we can add flags but keep it simple for iframe embedding
    // The PDF should be directly accessible via HTTPS
    // Add format parameter to ensure PDF is served correctly
    if (!secureUrl.includes('/fl_')) {
      // Add flags for secure viewing (if needed)
      // Note: Cloudinary PDFs work best when served directly
      const parts = secureUrl.split('/upload/');
      if (parts.length === 2) {
        // Keep original format, just ensure HTTPS
        return secureUrl;
      }
    }
    
    return secureUrl;
  }
  
  // For other URLs, ensure HTTPS if possible
  if (pdfUrl.startsWith('http://')) {
    return pdfUrl.replace('http://', 'https://');
  }
  
  // Return as-is for other URL types
  return pdfUrl;
};

/**
 * Stream PDF with additional security headers
 */
const streamSecurePdf = async (req, res) => {
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

    // Get book with PDF URL
    const book = await BookModel.findOne({
      _id: id,
      status: 'published',
      isAvailable: true
    }).select('title pdfFile');

    if (!book || !book.pdfFile) {
      return res.status(404).json({
        success: false,
        message: 'Book or PDF not found'
      });
    }

    // Set security headers to prevent download and caching
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="' + book.title + '.pdf"',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    // For Cloudinary URLs, redirect to the secure URL
    if (book.pdfFile.includes('cloudinary.com')) {
      const secureUrl = generateSecurePdfUrl(book.pdfFile, book.title);
      return res.redirect(secureUrl);
    }

    // For other URLs, you might want to proxy the content
    res.status(501).json({
      success: false,
      message: 'PDF streaming not implemented for this URL type'
    });

  } catch (error) {
    console.error('Error streaming secure PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream PDF',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all live classes for mobile app
 */
const getAllLiveClasses = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    console.log('📱 Mobile: Fetching live classes...');
    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, category, level, search } = req.query;

    // Build query object
    const query = { isAvailable: true };
    
    // Add status filter (default to scheduled/live if not specified)
    if (status) {
      if (status === 'upcoming') {
        query.status = { $in: ['scheduled', 'live'] };
        query.startTime = { $gte: new Date() };
      } else {
        query.status = status;
      }
    } else {
      query.status = { $in: ['scheduled', 'live'] };
      query.startTime = { $gte: new Date() };
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Add level filter
    if (level) {
      query.level = level;
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { instructor: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📱 Mobile: Querying live classes with filters:', { 
      query,
      page, 
      limit, 
      skip 
    });

    const liveClasses = await LiveClassModel.find(query)
      .select('-enrolledStudents -reviews')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to get plain JavaScript objects without virtuals

    console.log('📱 Mobile: Found live classes:', liveClasses.length);

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
    console.error('❌ Mobile: Error fetching live classes:', error);
    console.error('❌ Mobile: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Start live class
 */
const startLiveClass = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    console.log('📱 Mobile: Starting live class...');
    await connectDB();

    const { id } = req.params;
    console.log('📱 Mobile: Live class ID:', id);

    const liveClass = await LiveClassModel.findById(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }

    // Use the model method to start the class
    await liveClass.startClass();

    console.log('📱 Mobile: Live class started successfully:', liveClass.title);

    res.json({
      success: true,
      message: 'Live class started successfully',
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Mobile: Error starting live class:', error);
    console.error('❌ Mobile: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to start live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * End live class
 */
const endLiveClass = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    console.log('📱 Mobile: Ending live class...');
    await connectDB();

    const { id } = req.params;
    console.log('📱 Mobile: Live class ID:', id);

    const liveClass = await LiveClassModel.findById(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }

    // Use the model method to end the class
    await liveClass.endClass();

    console.log('📱 Mobile: Live class ended successfully:', liveClass.title);

    res.json({
      success: true,
      message: 'Live class ended successfully',
      data: liveClass,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Mobile: Error ending live class:', error);
    console.error('❌ Mobile: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to end live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get featured content for mobile app
 */
const getFeaturedContent = async (req, res) => {
  try {
    // Return empty data since database is disabled
    console.log('📱 Mobile featured content endpoint - database disabled');
    res.json({
      success: true,
      data: {
        books: [],
        courses: [],
        liveClasses: []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get course by ID
 */
const getCourseById = async (req, res) => {
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
        error: dbError.message
      });
    }

    const { id } = req.params;

    // Get course details
    const course = await CourseModel.findOne({
      _id: id,
      status: 'published',
      isAvailable: true
    }).select('-enrolledStudents -reviews -curriculum').lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
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

/**
 * Get live class by ID
 */
const getLiveClassById = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'LiveClass model unavailable' 
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

    // Get live class details
    const liveClass = await LiveClassModel.findOne({
      _id: id,
      isAvailable: true
    }).select('-enrolledStudents -reviews').lean();

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found or not available'
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

/**
 * Get categories
 */
const getCategories = async (req, res) => {
  try {
    // Return empty categories since database is disabled
    console.log('📱 Mobile categories endpoint - database disabled');
    res.json({
      success: true,
      data: {
        books: [],
        courses: [],
        liveClasses: []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Search content
 */
const searchContent = async (req, res) => {
  try {
    const { query, type } = req.query;
    console.log('📱 Mobile search endpoint - database disabled');
    
    res.json({
      success: true,
      data: [],
      query: query,
      type: type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search content',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get mobile app info
 */
const getMobileInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        appName: 'Mathematico',
        version: '2.0.0',
        database: 'disabled',
        features: {
          books: false,
          courses: false,
          liveClasses: false,
          userRegistration: false,
          userProfiles: false
        },
        message: 'Database functionality has been removed. Only admin authentication is available.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting mobile info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mobile info',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllCourses: withTimeout(getAllCourses),
  getAllBooks: withTimeout(getAllBooks),
  getBookById: withTimeout(getBookById),
  getSecurePdfViewer: withTimeout(getSecurePdfViewer),
  streamSecurePdf: withTimeout(streamSecurePdf),
  getAllLiveClasses: withTimeout(getAllLiveClasses),
  getLiveClassById: withTimeout(getLiveClassById),
  startLiveClass: withTimeout(startLiveClass),
  endLiveClass: withTimeout(endLiveClass),
  getFeaturedContent: withTimeout(getFeaturedContent),
  getCourseById: withTimeout(getCourseById),
  getCategories: withTimeout(getCategories),
  search: withTimeout(searchContent),
  searchContent: withTimeout(searchContent),
  getAppInfo: withTimeout(getMobileInfo),
  getMobileInfo: withTimeout(getMobileInfo)
};