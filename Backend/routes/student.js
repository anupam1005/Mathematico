const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');

<<<<<<< HEAD
// Import student controller
const studentController = require('../controllers/studentController');
console.log('✅ StudentController loaded successfully');

// Root endpoint (public info)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student API',
    authRequired: true,
    endpoints: {
      dashboard: '/dashboard',
      profile: '/profile',
      courses: '/courses',
      books: '/books',
      liveClasses: '/live-classes',
      stats: '/stats'
    },
    timestamp: new Date().toISOString()
  });
});

// Apply auth middleware to all protected student routes
router.use(authenticateToken);

// Student dashboard route
router.get('/dashboard', studentController.getDashboard);

=======
// Import student controller with fallback
let studentController;
try {
  studentController = require('../controllers/studentController');
  console.log('✅ StudentController loaded successfully');
} catch (error) {
  console.warn('⚠️ StudentController not available, using fallback handlers');
  studentController = {
    getCourses: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    getCourseById: (req, res) => res.status(404).json({ success: false, message: 'Course not found (fallback)' }),
    enrollInCourse: (req, res) => res.status(503).json({ success: false, message: 'Enroll unavailable (fallback)' }),
    getBooks: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    getBookById: (req, res) => res.status(404).json({ success: false, message: 'Book not found (fallback)' }),
    purchaseBook: (req, res) => res.status(503).json({ success: false, message: 'Purchase unavailable (fallback)' }),
    getLiveClasses: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    getLiveClassById: (req, res) => res.status(404).json({ success: false, message: 'Live class not found (fallback)' }),
    enrollInLiveClass: (req, res) => res.status(503).json({ success: false, message: 'Enroll unavailable (fallback)' }),
    getCourseProgress: (req, res) => res.json({ success: true, data: { progress: 0 }, source: 'fallback' }),
    updateCourseProgress: (req, res) => res.json({ success: true, message: 'Progress updated (fallback)' }),
    getNotifications: (req, res) => res.json({ success: true, data: [], source: 'fallback' }),
    markNotificationAsRead: (req, res) => res.json({ success: true })
  };
}

// Apply auth middleware to all student routes
router.use(authenticateToken);

>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
// Student course routes
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseById);
router.post('/courses/:id/enroll', studentController.enrollInCourse);

// Student book routes  
router.get('/books', studentController.getBooks);
router.get('/books/:id', studentController.getBookById);
router.post('/books/:id/purchase', studentController.purchaseBook);
router.get('/books/stats', studentController.getBookStats);

// Student live class routes
router.get('/live-classes', studentController.getLiveClasses);
router.get('/live-classes/:id', studentController.getLiveClassById);
router.post('/live-classes/:id/enroll', studentController.enrollInLiveClass);

// Student progress routes
router.get('/progress/:courseId', studentController.getCourseProgress);
router.put('/progress/:courseId', studentController.updateCourseProgress);

// Student notifications
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationAsRead);

// Student personal data endpoints
router.get('/my-courses', studentController.getMyCourses);
router.get('/my-books', studentController.getMyBooks);
router.get('/my-live-classes', studentController.getMyLiveClasses);

// ============= STUDENT PROFILE MANAGEMENT =============

/**
 * Get current student profile
 */
const getStudentProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    // Database connection handled by controllers
    // Database connection handled by controllers

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      },
      message: 'Student profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update student profile
 */
const updateStudentProfile = async (req, res) => {
  try {
    const User = require('../models/User');
    // Database connection handled by controllers
    // Database connection handled by controllers

    const { name, email } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await User.updateUser(req.user.id, updateData);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        updated_at: user.updatedAt
      },
      message: 'Student profile updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student statistics
 */
const getStudentStats = async (req, res) => {
  try {
    const Book = require('../models/Book');
    const Course = require('../models/Course');
    const LiveClass = require('../models/LiveClass');
    // Database connection handled by controllers
    // Database connection handled by controllers

    // Get student's enrolled courses, purchased books, and live classes
    const [courses, books, liveClasses] = await Promise.all([
      Course.countDocuments({ status: 'published' }),
      Book.countDocuments({ status: 'published' }),
      LiveClass.countDocuments({ status: { $in: ['upcoming', 'live'] } })
    ]);

    res.json({
      success: true,
      data: {
        total_courses: courses,
        total_books: books,
        total_live_classes: liveClasses,
        student_since: req.user.created_at || new Date().toISOString()
      },
      message: 'Student statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Student profile management routes
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/stats', getStudentStats);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Student routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;