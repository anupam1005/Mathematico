const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middlewares/auth');

// Apply auth middleware to all student routes
router.use(authenticateToken);

// Student course routes
router.get('/courses', studentController.getCourses);
router.get('/courses/:id', studentController.getCourseById);
router.post('/courses/:id/enroll', studentController.enrollInCourse);

// Student book routes  
router.get('/books', studentController.getBooks);
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

module.exports = router;
