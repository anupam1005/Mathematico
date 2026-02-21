const express = require('express');
const router = express.Router();
const { strictAuthenticateToken, strictRequireAdmin } = require('../middleware/strictJwtAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage for serverless mode (Vercel)
const storage = multer.memoryStorage();

const getMaxUploadBytes = () => {
  const mbRaw = (process.env.UPLOAD_MAX_FILE_SIZE_MB || '50').toString().trim();
  const mb = Number(mbRaw);
  const safeMb = Number.isFinite(mb) && mb > 0 ? mb : 50;
  return Math.floor(safeMb * 1024 * 1024);
};

const upload = multer({
  storage: storage,
  limits: { 
    // Important: memoryStorage buffers the file in RAM; keep a sane default for serverless.
    // You can override via UPLOAD_MAX_FILE_SIZE_MB.
    fileSize: getMaxUploadBytes(),
    files: 2 // Maximum 2 files (cover + PDF)
  },
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

// Import admin controller with MongoDB - tolerate failures in serverless
let adminController = {};
try {
  adminController = require('../controllers/adminController');
  if (process.env.NODE_ENV !== 'production' && !global.controllersLoaded) {
    console.log('✅ MongoDB AdminController loaded successfully');
    global.controllersLoaded = true;
  }
} catch (error) {
  console.error('❌ Failed to load AdminController:', error && error.message ? error.message : error);
}

const missingHandler = (name) => (req, res) => {
  res.status(503).json({
    success: false,
    message: `Admin handler unavailable: ${name}`,
    timestamp: new Date().toISOString()
  });
};

const safeHandler = (handler, name) =>
  (typeof handler === 'function' ? handler : missingHandler(name));

// Public health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API is healthy',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Public admin info endpoint (no auth required) - MUST BE BEFORE MIDDLEWARE
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico Admin API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    authentication: {
      required: true,
      method: 'JWT Bearer Token',
      loginEndpoint: '/api/v1/auth/login',
      description: 'Use admin credentials to get access token'
    },
    endpoints: {
      dashboard: '/dashboard',
      users: '/users',
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      payments: '/payments'
    },
    instructions: {
      step1: 'Login at /api/v1/auth/login with admin credentials',
      step2: 'Use the returned accessToken in Authorization header',
      step3: 'Access protected endpoints with Bearer token'
    },
    note: 'Use your registered admin account credentials to login',
    curlExample: {
      login: `curl -X POST ${process.env.BACKEND_URL || process.env.VERCEL_URL || 'https://mathematico-backend-new.vercel.app'}/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'`,
      access: `curl -X GET ${process.env.BACKEND_URL || process.env.VERCEL_URL || 'https://mathematico-backend-new.vercel.app'}/api/v1/admin -H "Authorization: Bearer YOUR_TOKEN_HERE"`
    }
  });
});

// Apply auth middleware to all other admin routes
router.use(strictAuthenticateToken);
router.use(strictRequireAdmin);

// Root admin endpoint (requires authentication)
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
router.get('/dashboard', safeHandler(adminController.getDashboard, 'getDashboard'));

// User management routes
router.get('/users', safeHandler(adminController.getAllUsers, 'getAllUsers'));
router.get('/users/:id', safeHandler(adminController.getUserById, 'getUserById'));
router.post('/users', safeHandler(adminController.createUser, 'createUser'));
router.put('/users/:id', safeHandler(adminController.updateUser, 'updateUser'));
router.delete('/users/:id', safeHandler(adminController.deleteUser, 'deleteUser'));
router.put('/users/:id/status', safeHandler(adminController.updateUserStatus, 'updateUserStatus'));

// Book management routes
router.get('/books', safeHandler(adminController.getAllBooks, 'getAllBooks'));
router.get('/books/:id', safeHandler(adminController.getBookById, 'getBookById'));
router.post(
  '/books',
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]),
  safeHandler(adminController.createBook, 'createBook')
);
router.put(
  '/books/:id',
  upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]),
  safeHandler(adminController.updateBook, 'updateBook')
);
router.delete('/books/:id', safeHandler(adminController.deleteBook, 'deleteBook'));
router.put('/books/:id/status', safeHandler(adminController.updateBookStatus, 'updateBookStatus'));

// Course management routes
router.get('/courses', safeHandler(adminController.getAllCourses, 'getAllCourses'));
router.get('/courses/:id', safeHandler(adminController.getCourseById, 'getCourseById'));
router.post(
  '/courses',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]),
  safeHandler(adminController.createCourse, 'createCourse')
);
router.put(
  '/courses/:id',
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]),
  safeHandler(adminController.updateCourse, 'updateCourse')
);
router.delete('/courses/:id', safeHandler(adminController.deleteCourse, 'deleteCourse'));
router.put('/courses/:id/status', safeHandler(adminController.updateCourseStatus, 'updateCourseStatus'));
router.post(
  '/courses/upload-thumbnail',
  upload.single('image'),
  safeHandler(adminController.uploadCourseThumbnail, 'uploadCourseThumbnail')
);
router.patch(
  '/courses/:id/toggle-publish',
  safeHandler(adminController.toggleCoursePublish, 'toggleCoursePublish')
);

// Live class management routes
router.get('/live-classes', safeHandler(adminController.getAllLiveClasses, 'getAllLiveClasses'));
router.get('/live-classes/:id', safeHandler(adminController.getLiveClassById, 'getLiveClassById'));
router.post(
  '/live-classes',
  upload.single('image'),
  safeHandler(adminController.createLiveClass, 'createLiveClass')
);
router.put(
  '/live-classes/:id',
  upload.single('image'),
  safeHandler(adminController.updateLiveClass, 'updateLiveClass')
);
router.delete('/live-classes/:id', safeHandler(adminController.deleteLiveClass, 'deleteLiveClass'));
router.put(
  '/live-classes/:id/status',
  safeHandler(adminController.updateLiveClassStatus, 'updateLiveClassStatus')
);

// Payment management routes
router.get('/payments', safeHandler(adminController.getAllPayments, 'getAllPayments'));
router.get('/payments/:id', safeHandler(adminController.getPaymentById, 'getPaymentById'));
router.put('/payments/:id/status', safeHandler(adminController.updatePaymentStatus, 'updatePaymentStatus'));

// File upload route
router.post('/upload', safeHandler(adminController.uploadFile, 'uploadFile'));

// Statistics routes
router.get('/stats/books', safeHandler(adminController.getBookStats, 'getBookStats'));
router.get('/stats/courses', safeHandler(adminController.getCourseStats, 'getCourseStats'));
router.get('/stats/live-classes', safeHandler(adminController.getLiveClassStats, 'getLiveClassStats'));

// Settings routes
router.get('/settings', safeHandler(adminController.getSettings, 'getSettings'));
router.put('/settings', safeHandler(adminController.updateSettings, 'updateSettings'));

module.exports = router;
