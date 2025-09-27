const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { uploadToCloudinary } = require('./cloudinary');
const { uploadToS3 } = require('./aws-s3');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'video/webm': '.webm'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

/**
 * Upload file to cloud storage (Cloudinary or S3)
 * @param {Object} file - Multer file object
 * @param {string} folder - Storage folder
 * @param {string} service - 'cloudinary' or 's3'
 * @returns {Promise<Object>} Upload result
 */
async function uploadFileToCloud(file, folder = 'mathematico', service = 'cloudinary') {
  try {
    if (service === 'cloudinary') {
      const result = await uploadToCloudinary(file.buffer, folder, getResourceType(file.mimetype));
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        service: 'cloudinary'
      };
    } else if (service === 's3') {
      const key = `${folder}/${Date.now()}-${file.originalname}`;
      const result = await uploadToS3(file.buffer, key, file.mimetype);
      return {
        success: true,
        url: result.Location,
        key: key,
        service: 's3'
      };
    } else {
      throw new Error('Invalid storage service');
    }
  } catch (error) {
    console.error('Cloud upload failed:', error);
    throw error;
  }
}

/**
 * Get resource type for Cloudinary
 * @param {string} mimetype - File MIME type
 * @returns {string} Resource type
 */
function getResourceType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw';
}

/**
 * Process single file upload
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function processFileUpload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Determine storage service based on environment
    const storageService = process.env.STORAGE_SERVICE || 'cloudinary';
    const folder = req.body.folder || 'mathematico';

    const result = await uploadFileToCloud(req.file, folder, storageService);

    res.json({
      success: true,
      data: {
        url: result.url,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        service: result.service,
        ...(result.publicId && { publicId: result.publicId }),
        ...(result.key && { key: result.key })
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
}

/**
 * Process multiple file uploads
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
async function processMultipleFileUpload(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const storageService = process.env.STORAGE_SERVICE || 'cloudinary';
    const folder = req.body.folder || 'mathematico';

    const uploadPromises = req.files.map(file => 
      uploadFileToCloud(file, folder, storageService)
    );

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results.map((result, index) => ({
        url: result.url,
        filename: req.files[index].originalname,
        size: req.files[index].size,
        mimetype: req.files[index].mimetype,
        service: result.service,
        ...(result.publicId && { publicId: result.publicId }),
        ...(result.key && { key: result.key })
      })),
      message: `${results.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Multiple file upload failed',
      error: error.message
    });
  }
}

/**
 * Error handler for file upload
 * @param {Error} error - Upload error
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function handleUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.'
      });
    }
  }

  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'File upload error',
    error: error.message
  });
}

module.exports = {
  upload,
  processFileUpload,
  processMultipleFileUpload,
  handleUploadError,
  uploadFileToCloud
};
