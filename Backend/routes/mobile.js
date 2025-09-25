const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');

// Public mobile routes (for student app)
router.get('/courses', mobileController.getAllCourses);
router.get('/courses/:id', mobileController.getCourseById);

router.get('/books', mobileController.getAllBooks);
router.get('/books/:id', mobileController.getBookById);

router.get('/live-classes', mobileController.getAllLiveClasses);
router.get('/live-classes/:id', mobileController.getLiveClassById);

// Search functionality
router.get('/search', mobileController.search);

// App info
router.get('/app-info', mobileController.getAppInfo);

module.exports = router;
