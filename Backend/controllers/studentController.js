const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Student Controller - Handles requests from students

/**
 * Get student dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        stats: {
          enrolledCourses: 2,
          purchasedBooks: 1,
          enrolledLiveClasses: 1,
          completedLessons: 5
        },
        recentActivity: [
          {
            id: 1,
            type: 'enrollment',
            message: 'Enrolled in Advanced Mathematics course',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            type: 'purchase',
            message: 'Purchased Advanced Calculus Textbook',
            timestamp: new Date().toISOString()
          }
        ]
      },
      message: 'Student dashboard retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting student dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all courses for students
 */
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
      },
      message: 'No courses available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get course by ID for students
 */
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    res.json({
      success: false,
      message: 'Course not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting course by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course',
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
    const courseId = req.params.id;
    const { paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        courseId: parseInt(courseId),
        amount: amount || 99.99,
        status: 'completed',
        enrolledAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Course enrolled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all books for students
 */
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const result = await Book.getAll(page, limit, category, search);
    
    // Add student-specific fields
    const booksWithStudentData = result.data.map(book => ({
      ...book,
      isPurchased: false,
      canPreview: true,
      previewPages: 5
    }));
    
    res.json({
      success: true,
      data: booksWithStudentData,
      pagination: result.pagination,
      message: 'Books retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get book by ID for students
 */
const getBookById = async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    const book = await Book.getById(bookId);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add student-specific fields
    const bookWithStudentData = {
      ...book,
      isPurchased: false,
      canPreview: true,
      previewPages: 5,
      totalPages: book.pages || 0
    };
    
    res.json({
      success: true,
      data: bookWithStudentData,
      message: 'Book details retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting book by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Purchase book
 */
const purchaseBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        bookId: parseInt(bookId),
        amount: amount || 49.99,
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Book purchased successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error purchasing book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get live classes for students
 */
const getLiveClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        totalPages: 0
      },
      message: 'No live classes available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get live class by ID for students
 */
const getLiveClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    
    res.json({
      success: false,
      message: 'Live class not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting live class by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Enroll in live class
 */
const enrollInLiveClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const { paymentMethod, amount } = req.body;
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        liveClassId: parseInt(classId),
        amount: amount || 29.99,
        status: 'completed',
        enrolledAt: new Date().toISOString(),
        meetingLink: 'https://meet.example.com/advanced-math'
      },
      message: 'Live class enrolled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error enrolling in live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get course progress
 */
const getCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    res.json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        progress: 25,
        completedLessons: 2,
        totalLessons: 8,
        lastAccessed: new Date().toISOString(),
        timeSpent: 120 // minutes
      },
      message: 'Course progress retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course progress',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update course progress
 */
const updateCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { lessonId, completed } = req.body;
    
    res.json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        lessonId: lessonId,
        completed: completed,
        progress: 30,
        updatedAt: new Date().toISOString()
      },
      message: 'Course progress updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course progress',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get notifications
 */
const getNotifications = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'New Course Available',
          message: 'Advanced Mathematics course is now available',
          type: 'course',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Live Class Reminder',
          message: 'Your live class starts in 1 hour',
          type: 'live_class',
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Notifications retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    res.json({
      success: true,
      data: {
        notificationId: parseInt(notificationId),
        isRead: true,
        readAt: new Date().toISOString()
      },
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student's enrolled courses
 */
const getMyCourses = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'No enrolled courses found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting my courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student's purchased books
 */
const getMyBooks = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'No purchased books found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting my books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchased books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student's enrolled live classes
 */
const getMyLiveClasses = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'No enrolled live classes found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting my live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get book statistics
 */
const getBookStats = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalBooks: 0,
        purchasedBooks: 0,
        availableBooks: 0
      },
      message: 'Book statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting book stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getDashboard,
  getCourses,
  getCourseById,
  enrollInCourse,
  getBooks,
  getBookById,
  purchaseBook,
  getLiveClasses,
  getLiveClassById,
  enrollInLiveClass,
  getCourseProgress,
  updateCourseProgress,
  getNotifications,
  markNotificationAsRead,
  getMyCourses,
  getMyBooks,
  getMyLiveClasses,
  getBookStats
};
