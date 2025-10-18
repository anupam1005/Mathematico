// Student Controller - Handles student operations with MongoDB
const connectDB = require('../config/database');

// Import models
let CourseModel, BookModel, LiveClassModel;
try {
  CourseModel = require('../models/Course');
  BookModel = require('../models/Book');
  LiveClassModel = require('../models/LiveClass');
} catch (error) {
  console.warn('⚠️ Student models not available:', error && error.message ? error.message : error);
}

/**
 * Get student dashboard
 */
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Student dashboard - database disabled');
    
    const dashboardData = {
      enrolledCourses: 0,
      completedCourses: 0,
      totalBooks: 0,
      upcomingLiveClasses: 0,
      progress: 0
    };
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student profile
 */
const getProfile = async (req, res) => {
  try {
    console.log('👤 Student profile - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Student profile not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update student profile
 */
const updateProfile = async (req, res) => {
  return res.status(501).json({
          success: false,
    error: 'Not Implemented',
    message: 'Profile update is not available. Database functionality has been removed.',
          timestamp: new Date().toISOString()
        });
};

/**
 * Get all available courses
 */
const getEnrolledCourses = async (req, res) => {
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
 * Enroll in course
 */
const enrollInCourse = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const studentId = req.user.id;

    const course = await CourseModel.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Use the model's enrollStudent method
    await course.enrollStudent(studentId);

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to enroll in course',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all available books
 */
const getStudentBooks = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ success: false, message: 'Book model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const books = await BookModel.find({ 
      status: 'published',
      isAvailable: true 
    })
      .select('-pdfFile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BookModel.countDocuments({ status: 'published', isAvailable: true });

    res.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
 * Get all available live classes
 */
const getStudentLiveClasses = async (req, res) => {
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
 * Join live class
 */
const joinLiveClass = async (req, res) => {
  return res.status(501).json({
        success: false,
    error: 'Not Implemented',
    message: 'Live class joining is not available. Database functionality has been removed.',
      timestamp: new Date().toISOString()
    });
};

/**
 * Get student progress
 */
const getProgress = async (req, res) => {
  try {
    console.log('📈 Student progress - database disabled');
    
    res.json({
      success: true,
      data: {
        overallProgress: 0,
        courseProgress: [],
        completedLessons: 0,
        totalLessons: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student certificates
 */
const getCertificates = async (req, res) => {
  try {
    console.log('🏆 Student certificates - database disabled');
    
    res.json({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student certificates',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getEnrolledCourses,
  enrollInCourse,
  getStudentBooks,
  getStudentLiveClasses,
  joinLiveClass,
  getProgress,
  getCertificates,
  // Aliases for route compatibility
  getCourses: getEnrolledCourses,
  getCourseById: (req, res) => res.status(404).json({ success: false, message: 'Course not found' }),
  getBooks: getStudentBooks,
  getBookById: (req, res) => res.status(404).json({ success: false, message: 'Book not found' }),
  purchaseBook: (req, res) => res.status(501).json({ success: false, message: 'Purchase unavailable' }),
  getLiveClasses: getStudentLiveClasses,
  getLiveClassById: (req, res) => res.status(404).json({ success: false, message: 'Live class not found' }),
  enrollInLiveClass: (req, res) => res.status(501).json({ success: false, message: 'Enrollment unavailable' }),
  getCourseProgress: (req, res) => res.json({ success: true, data: { progress: 0 } }),
  updateCourseProgress: (req, res) => res.json({ success: true, message: 'Progress updated' }),
  getNotifications: (req, res) => res.json({ success: true, data: [] }),
  markNotificationAsRead: (req, res) => res.json({ success: true }),
  getMyCourses: getEnrolledCourses,
  getMyBooks: getStudentBooks,
  getMyLiveClasses: getStudentLiveClasses,
  getBookStats: (req, res) => res.json({ success: true, data: { total: 0, purchased: 0 } })
};