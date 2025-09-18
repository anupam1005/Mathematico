import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { adminController } from '../controllers/admin.controller';
import { BookController } from '../controllers/book.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📁 Multer destination called for:', file.fieldname);
    const uploadPath = 'uploads/';
    console.log('Upload path:', uploadPath);
    
    // Ensure uploads directory exists
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), uploadPath);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory:', uploadsDir);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + '-' + file.originalname;
    console.log('📝 Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer fileFilter called for:', file.fieldname);
    console.log('File details:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.fieldname === 'coverImage' || file.fieldname === 'thumbnailImage') {
      if (file.mimetype.startsWith('image/')) {
        console.log('✅ Image file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('❌ Non-image file rejected:', file.originalname);
        cb(new Error('Only image files are allowed for images'));
      }
    } else if (file.fieldname === 'pdfFile') {
      if (file.mimetype === 'application/pdf') {
        console.log('✅ PDF file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('❌ Non-PDF file rejected:', file.originalname);
        cb(new Error('Only PDF files are allowed'));
      }
    } else {
      console.log('✅ Other file accepted:', file.fieldname);
      cb(null, true);
    }
  }
});

const router = Router();

// Error handling middleware for multer
const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Multer error occurred:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    field: error.field
  });
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
  } else if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  // For any other error, return 500
  return res.status(500).json({
    success: false,
    message: 'File upload error occurred',
    code: 'FILE_UPLOAD_ERROR'
  });
};

// Apply authentication and admin middleware to all admin routes
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardData);

// Course Routes
router.get('/courses', adminController.getAllCourses);
router.get('/courses/:id', adminController.getCourseById);
router.post('/courses', (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Route middleware - Before multer');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
}, upload.single('thumbnailImage'), (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Route middleware - After multer');
  console.log('Request file:', req.file);
  console.log('Request body after multer:', req.body);
  next();
}, handleMulterError, adminController.createCourse);
router.put('/courses/:id', (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Route middleware - Before multer (UPDATE)');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
}, upload.single('thumbnailImage'), (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Route middleware - After multer (UPDATE)');
  console.log('Request file:', req.file);
  console.log('Request body after multer:', req.body);
  next();
}, handleMulterError, adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.patch('/courses/:id/publish', adminController.publishCourse);

// Book Routes (admin) - Using BookController for consistency
router.get('/books', BookController.getAllBooks);
router.get('/books/:id', BookController.getBookByIdAdmin);
router.post('/books', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), handleMulterError, BookController.createBook);
router.put('/books/:id', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), handleMulterError, BookController.updateBook);
router.delete('/books/:id', BookController.deleteBook);
router.patch('/books/:id/publish', BookController.togglePublishStatus);
router.get('/books/stats/overview', BookController.getBookStats);

// Live Class Routes (admin)
router.get('/live-classes', adminController.getAllLiveClasses);
router.get('/live-classes/:id', adminController.getLiveClassById);
router.post('/live-classes', upload.single('thumbnailImage'), handleMulterError, adminController.createLiveClass);
router.put('/live-classes/:id', upload.single('thumbnailImage'), handleMulterError, adminController.updateLiveClass);
router.delete('/live-classes/:id', adminController.deleteLiveClass);
router.patch('/live-classes/:id/publish', adminController.toggleLiveClassPublishStatus);
router.patch('/live-classes/:id/start', adminController.startLiveClass);
router.patch('/live-classes/:id/end', adminController.endLiveClass);

// User Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Module Routes
router.post('/modules', adminController.createModule);
router.put('/modules/:id', adminController.updateModule);
router.delete('/modules/:id', adminController.deleteModule);

// Settings Routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
