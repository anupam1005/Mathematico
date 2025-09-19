const express = require('express');
const router = express.Router();

// Import controllers
const mobileController = require('../../controllers/mobileController');

// Import middleware
const { authenticateToken, requireUser } = require('../../middlewares/auth');

// Mobile API routes for React Native app
// All routes require user authentication

// Courses endpoints
router.get('/courses', authenticateToken, requireUser, mobileController.getCourses);
router.get('/courses/:id', authenticateToken, requireUser, mobileController.getCourseById);
router.post('/courses/:id/enroll', authenticateToken, requireUser, mobileController.enrollInCourse);

// Books endpoints
router.get('/books', authenticateToken, requireUser, mobileController.getBooks);
router.get('/books/:id', authenticateToken, requireUser, mobileController.getBookById);
router.post('/books/:id/purchase', authenticateToken, requireUser, mobileController.purchaseBook);

// Live Classes endpoints
router.get('/live-classes', authenticateToken, requireUser, mobileController.getLiveClasses);
router.get('/live-classes/:id', authenticateToken, requireUser, mobileController.getLiveClassById);
router.post('/live-classes/:id/enroll', authenticateToken, requireUser, mobileController.enrollInLiveClass);

// User's enrolled content
router.get('/my-courses', authenticateToken, requireUser, mobileController.getMyCourses);
router.get('/my-books', authenticateToken, requireUser, mobileController.getMyBooks);
router.get('/my-live-classes', authenticateToken, requireUser, mobileController.getMyLiveClasses);

// Progress tracking
router.get('/progress/:courseId', authenticateToken, requireUser, mobileController.getCourseProgress);
router.put('/progress/:courseId', authenticateToken, requireUser, mobileController.updateCourseProgress);

// Notifications
router.get('/notifications', authenticateToken, requireUser, mobileController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, requireUser, mobileController.markNotificationAsRead);

module.exports = router;
