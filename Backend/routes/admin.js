const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = file.mimetype.startsWith('image/') 
      ? path.join(__dirname, '../uploads/covers')
      : path.join(__dirname, '../uploads/pdfs');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Validate file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedDocTypes = ['application/pdf'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP images and PDF documents are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

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
router.post('/books', upload.fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 }
]), adminController.createBook);
router.put('/books/:id', upload.fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 }
]), adminController.updateBook);
router.delete('/books/:id', adminController.deleteBook);
router.put('/books/:id/status', adminController.updateBookStatus);

// Course management routes
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', upload.single('thumbnail'), adminController.createCourse);
router.put('/courses/:id', upload.single('thumbnail'), adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.put('/courses/:id/status', adminController.updateCourseStatus);

// Live class management routes
router.get('/live-classes', adminController.getAllLiveClasses);
router.get('/live-classes/:id', adminController.getLiveClassById);
router.post('/live-classes', upload.single('thumbnail'), adminController.createLiveClass);
router.put('/live-classes/:id', upload.single('thumbnail'), adminController.updateLiveClass);
router.delete('/live-classes/:id', adminController.deleteLiveClass);
router.put('/live-classes/:id/status', adminController.updateLiveClassStatus);

// Payment management routes
router.get('/payments', adminController.getAllPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.put('/payments/:id/status', adminController.updatePaymentStatus);
router.get('/payments/stats', adminController.getPaymentStats);

// File upload route
router.post('/upload', upload.single('file'), adminController.uploadFile);

// Statistics routes
router.get('/stats/overview', adminController.getOverviewStats);
router.get('/stats/books', adminController.getBookStats);
router.get('/stats/courses', adminController.getCourseStats);
router.get('/stats/live-classes', adminController.getLiveClassStats);

// Settings routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
