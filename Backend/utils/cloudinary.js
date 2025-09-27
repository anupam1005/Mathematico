const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} folder - Cloudinary folder path
 * @param {string} resourceType - 'image', 'video', or 'raw'
 * @returns {Promise<Object>} Upload result
 */
async function uploadToCloudinary(fileBuffer, folder = 'mathematico', resourceType = 'image') {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
          transformation: resourceType === 'image' ? [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
            { format: 'auto' }
          ] : undefined
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ File uploaded to Cloudinary:', result.public_id);
            resolve(result);
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw error;
  }
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image', 'video', or 'raw'
 * @returns {Promise<Object>} Delete result
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log('✅ File deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
    throw error;
  }
}

/**
 * Get optimized image URL
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
function getOptimizedUrl(publicId, options = {}) {
  const defaultOptions = {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto',
    format: 'auto'
  };
  
  return cloudinary.url(publicId, {
    ...defaultOptions,
    ...options
  });
}

/**
 * Upload multiple files
 * @param {Array} files - Array of file objects
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Array>} Upload results
 */
async function uploadMultipleFiles(files, folder = 'mathematico') {
  try {
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.buffer, folder, file.mimetype.startsWith('video/') ? 'video' : 'image')
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple file upload failed:', error);
    throw error;
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  uploadMultipleFiles,
  cloudinary
};
