const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} folder - Cloudinary folder
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
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
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
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary,
};