import { Router } from 'express';
import multer from 'multer';
import { LiveClassController } from '../controllers/liveClass.controller';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { requireEnrollment } from '../middleware/enrollment.middleware';

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
    try {
      console.log('🔍 Multer fileFilter called for:', file.fieldname);
      console.log('File details:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });
      
      if (file.fieldname === 'thumbnailImage') {
        if (file.mimetype.startsWith('image/')) {
          console.log('✅ Image file accepted:', file.originalname);
          cb(null, true);
        } else {
          console.log('❌ Non-image file rejected:', file.originalname);
          cb(new Error('Only image files are allowed for thumbnail image'));
        }
      } else {
        console.log('✅ Non-thumbnail file accepted:', file.fieldname);
        cb(null, true);
      }
    } catch (error) {
      console.error('❌ Error in multer fileFilter:', error);
      cb(error);
    }
  }
}).single('thumbnailImage');

// Error handling middleware for multer
const handleMulterError = (error: any, req: any, res: any, next: any) => {
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

const router = Router();

// Test endpoint (for debugging)
router.get('/test-db', LiveClassController.testDatabaseConnection);

// Student routes - require authentication and enrollment
router.get('/', authenticate, requireEnrollment, LiveClassController.getPublishedLiveClasses);
router.get('/:id', authenticate, requireEnrollment, LiveClassController.getLiveClassById);

// Admin routes (protected) - group them together
const adminRouter = Router();
adminRouter.use(authenticate, isAdmin);

adminRouter.get('/', LiveClassController.getAllLiveClasses);
adminRouter.get('/:id', LiveClassController.getLiveClassByIdAdmin);
adminRouter.post('/', (req, res, next) => {
  console.log('🔍 Route middleware - Before multer');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
}, upload, (req, res, next) => {
  console.log('🔍 Route middleware - After multer');
  console.log('Request file:', req.file);
  console.log('Request body after multer:', req.body);
  next();
}, handleMulterError, LiveClassController.createLiveClass);
adminRouter.put('/:id', upload, handleMulterError, LiveClassController.updateLiveClass);
adminRouter.delete('/:id', LiveClassController.deleteLiveClass);
adminRouter.patch('/:id/publish', LiveClassController.togglePublishStatus);
adminRouter.patch('/:id/start', LiveClassController.startLiveClass);
adminRouter.patch('/:id/end', LiveClassController.endLiveClass);
adminRouter.get('/stats/overview', LiveClassController.getLiveClassStats);

// Mount admin routes under /admin
router.use('/admin', adminRouter);

export default router;
