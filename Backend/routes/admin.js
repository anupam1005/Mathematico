const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage for serverless mode
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for PDFs
  fileFilter: (req, file, cb) => {
    // Allow images for cover images
    if (file.fieldname === 'coverImage' || file.fieldname === 'image') {
      const allowedImageTypes = /jpeg|jpg|png|webp/;
      const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedImageTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      }
      return cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed for cover images!'));
    }
    // Allow PDFs for book files
    if (file.fieldname === 'pdfFile' || file.fieldname === 'pdf') {
      const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf';
      const isPdfMime = file.mimetype === 'application/pdf';
      if (isPdf && isPdfMime) {
        return cb(null, true);
      }
      return cb(new Error('Only PDF files are allowed for book content!'));
    }
    cb(null, true);
  }
});

// Import admin controller with MongoDB - NO FALLBACKS
const adminController = require('../controllers/adminController');
console.log('✅ MongoDB AdminController loaded successfully');

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Remove serverless fallback interference - let actual admin operations work

// Root admin endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API - Access granted',
    user: req.user,
    timestamp: new Date().toISOString(),
    endpoints: {
      dashboard: '/dashboard',
      users: '/users',
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      payments: '/payments'
    }
  });
});

// Dashboard routes
router.get('/dashboard', adminController.getDashboard);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.updateUserStatus);

// Book management routes
router.get('/books', adminController.getAllBooks);
router.get('/books/:id', adminController.getBookById);
router.post('/books', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]), adminController.createBook);
router.put('/books/:id', upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]), adminController.updateBook);
router.delete('/books/:id', adminController.deleteBook);
router.put('/books/:id/status', adminController.updateBookStatus);

// Course management routes
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), adminController.createCourse);
router.put('/courses/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.put('/courses/:id/status', adminController.updateCourseStatus);
router.post('/courses/upload-thumbnail', upload.single('image'), adminController.uploadCourseThumbnail);
router.patch('/courses/:id/toggle-publish', adminController.toggleCoursePublish);

// Live class management routes
router.get('/live-classes', adminController.getAllLiveClasses);
router.get('/live-classes/:id', adminController.getLiveClassById);
router.post('/live-classes', upload.single('image'), adminController.createLiveClass);
router.put('/live-classes/:id', upload.single('image'), adminController.updateLiveClass);
router.delete('/live-classes/:id', adminController.deleteLiveClass);
router.put('/live-classes/:id/status', adminController.updateLiveClassStatus);

// Payment management routes
router.get('/payments', adminController.getAllPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.put('/payments/:id/status', adminController.updatePaymentStatus);

// File upload route
router.post('/upload', adminController.uploadFile);

// Statistics routes
router.get('/stats/books', adminController.getBookStats);
router.get('/stats/courses', adminController.getCourseStats);
router.get('/stats/live-classes', adminController.getLiveClassStats);

// Settings routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'MongoDB Admin routes are working ✅',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
