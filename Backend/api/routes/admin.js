const express = require('express');
const router = express.Router();

// Import controllers
const adminController = require('../../controllers/adminController-simple');

// Import middleware
const { authenticateToken, requireAdmin } = require('../../middlewares/authMiddleware');
const { upload, processCoverImage, processPDF, handleUploadError } = require('../../middlewares/upload');

// Test route (no auth required)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is working!',
    note: 'Authentication required for other endpoints',
    endpoints: {
      dashboard: 'GET /api/admin/dashboard',
      users: 'GET /api/admin/users',
      courses: 'GET /api/admin/courses',
      books: 'GET /api/admin/books'
    },
    timestamp: new Date().toISOString()
  });
});

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Admin dashboard
router.get('/dashboard', adminController.getDashboard);

// Users management
router.get('/users', adminController.getUsers);

// Courses management
router.get('/courses', adminController.getCourses);

// Books management
router.get('/books', adminController.getBooks);
router.get('/books/:id', adminController.getBookById);
router.post('/books', 
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  processCoverImage,
  processPDF,
  handleUploadError,
  adminController.createBook
);

module.exports = router;
