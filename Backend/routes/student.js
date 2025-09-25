const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all student routes
router.use(authMiddleware);

// Student course routes
router.get('/courses', studentController.getAllCourses);
router.get('/courses/:id', studentController.getCourseById);
router.post('/courses/:id/enroll', studentController.enrollCourse);
router.get('/courses/enrolled', studentController.getEnrolledCourses);

// Student book routes  
router.get('/books', studentController.getAllBooks);
router.get('/books/:id', studentController.getBookById);
router.post('/books/:id/purchase', studentController.purchaseBook);
router.get('/books/purchased', studentController.getPurchasedBooks);

// Student live class routes
router.get('/live-classes', studentController.getAllLiveClasses);
router.get('/live-classes/:id', studentController.getLiveClassById);
router.post('/live-classes/:id/register', studentController.registerLiveClass);
router.get('/live-classes/registered', studentController.getRegisteredLiveClasses);

// Student profile and progress
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/progress', studentController.getProgress);

// Student payments and purchases
router.get('/payments', studentController.getPaymentHistory);
router.post('/payments', studentController.createPayment);

module.exports = router;
