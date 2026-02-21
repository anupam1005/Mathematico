const express = require('express');
const router = express.Router();
const { strictAuthenticateToken } = require('../middleware/strictJwtAuth');

// Import student controller
const studentController = require('../controllers/studentController');
if (process.env.NODE_ENV !== 'production' && !global.controllersLoaded) {
  console.log('✅ StudentController loaded successfully');
  global.controllersLoaded = true;
}

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
router.use(strictAuthenticateToken);

// Student dashboard route
router.get('/dashboard', studentController.getDashboard);

// Student course routes
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseById);
router.post('/courses/:id/enroll', studentController.enrollInCourse);

// Student book routes  
router.get('/books', studentController.getBooks);
router.get('/books/stats', studentController.getBookStats);
router.get('/books/:id', studentController.getBookById);
router.post('/books/:id/purchase', studentController.purchaseBook);

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
      LiveClass.countDocuments({ status: { $in: ['scheduled', 'live'] } })
    ]);

    res.json({
      success: true,
      data: {
        total_courses: courses,
        total_books: books,
        total_live_classes: liveClasses,
        student_since: new Date().toISOString()
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
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/stats', getStudentStats);

module.exports = router;