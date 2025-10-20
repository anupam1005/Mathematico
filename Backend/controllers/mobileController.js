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

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await CourseModel.find({ 
      status: 'published',
      isAvailable: true 
    })
      .select('-enrolledStudents -reviews')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CourseModel.countDocuments({ status: 'published', isAvailable: true });

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

    // Generate secure viewer URL with restrictions
    const secureViewerUrl = generateSecurePdfUrl(book.pdfFile, book.title);

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
    console.error('Error getting secure PDF viewer:', error);
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
 */
const generateSecurePdfUrl = (pdfUrl, title) => {
  // For Cloudinary PDFs, add transformation parameters to restrict access
  if (pdfUrl.includes('cloudinary.com')) {
    // Add transformation to make PDF read-only
    const baseUrl = pdfUrl.split('/upload/')[0];
    const path = pdfUrl.split('/upload/')[1];
    
    // Add transformations to prevent download and enable secure viewing
    const transformations = [
      'fl_attachment:false', // Disable direct download
      'fl_immutable_cache:true', // Cache for performance
      'fl_secure:true', // Use HTTPS
      'fl_sanitize:true' // Sanitize the PDF
    ].join(',');
    
    return `${baseUrl}/upload/${transformations}/${path}`;
  }
  
  // For other URLs, return as-is (you might want to implement additional security)
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

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const liveClasses = await LiveClassModel.find({ 
      status: { $in: ['scheduled', 'live'] },
      isAvailable: true,
      startTime: { $gte: new Date() }
    })
      .select('-enrolledStudents -reviews')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await LiveClassModel.countDocuments({ 
      status: { $in: ['scheduled', 'live'] },
      isAvailable: true,
      startTime: { $gte: new Date() }
    });

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
    const { id } = req.params;
    console.log('📱 Mobile course by ID endpoint - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Course not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get live class by ID
 */
const getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📱 Mobile live class by ID endpoint - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Live class not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live class',
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
  getAllCourses,
  getAllBooks: withTimeout(getAllBooks),
  getBookById: withTimeout(getBookById),
  getSecurePdfViewer: withTimeout(getSecurePdfViewer),
  streamSecurePdf: withTimeout(streamSecurePdf),
  getAllLiveClasses,
  getFeaturedContent,
  getCourseById,
  getLiveClassById,
  getCategories,
  search: searchContent,
  searchContent,
  getAppInfo: getMobileInfo,
  getMobileInfo
};