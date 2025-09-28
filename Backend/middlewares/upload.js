const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directories exist
const uploadDirs = {
  pdfs: 'uploads/pdfs',
  covers: 'uploads/covers',
  temp: 'uploads/temp'
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDirs.temp;
    
    if (file.fieldname === 'pdf') {
      uploadPath = uploadDirs.pdfs;
    } else if (file.fieldname === 'coverImage') {
      uploadPath = uploadDirs.covers;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for validation with enhanced security
const fileFilter = (req, file, cb) => {
  // Security: Check file extension against mimetype
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedPdfTypes = ['application/pdf'];
  
  // Security: Validate file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const allowedPdfExtensions = ['.pdf'];
  
  if (file.fieldname === 'pdf') {
    // Only allow PDF files with proper validation
    if (allowedPdfTypes.includes(file.mimetype) && allowedPdfExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for book content'), false);
    }
  } else if (file.fieldname === 'coverImage') {
    // Only allow specific image types with proper validation
    if (allowedImageTypes.includes(file.mimetype) && allowedImageExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for cover images'), false);
    }
  } else {
    cb(new Error('Invalid file field'), false);
  }
};

// Configure multer with enhanced security
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default, configurable
    files: 2, // Maximum 2 files (PDF + cover image)
    fieldSize: 1024 * 1024, // 1MB for field data
    fieldNameSize: 100 // Max field name length
  }
});

// Middleware for processing cover images
const processCoverImage = async (req, res, next) => {
  try {
    if (req.file && req.file.fieldname === 'coverImage') {
      const inputPath = req.file.path;
      const outputPath = inputPath.replace('temp', 'covers');
      
      // Process image with sharp (resize, optimize)
      await sharp(inputPath)
        .resize(400, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
      
      // Update file path
      req.file.path = outputPath;
      req.file.filename = path.basename(outputPath);
      
      // Remove temp file
      fs.unlinkSync(inputPath);
    }
    
    next();
  } catch (error) {
    console.error('Error processing cover image:', error);
    next(error);
  }
};

// Middleware for PDF validation and processing
const processPDF = async (req, res, next) => {
  try {
    if (req.file && req.file.fieldname === 'pdf') {
      // Additional PDF validation can be added here
      // For now, just ensure the file exists and is readable
      const stats = fs.statSync(req.file.path);
      if (stats.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // You could add PDF content validation here
      // For example, checking if it's a valid PDF using a library like pdf-parse
    }
    
    next();
  } catch (error) {
    console.error('Error processing PDF:', error);
    next(error);
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.',
        error: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 2 files allowed.',
        error: error.message
      });
    }
  }
  
  if (error.message.includes('Only PDF files are allowed') || 
      error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  processCoverImage,
  processPDF,
  handleUploadError,
  uploadDirs
};
