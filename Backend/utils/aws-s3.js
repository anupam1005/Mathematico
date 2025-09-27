const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mathematico-uploads';

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - S3 object key
 * @param {string} contentType - MIME type
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Upload result
 */
async function uploadToS3(fileBuffer, key, contentType, metadata = {}) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: metadata,
      ACL: 'public-read' // Make files publicly accessible
    };

    const result = await s3.upload(params).promise();
    console.log('✅ File uploaded to S3:', result.Location);
    return result;
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw error;
  }
}

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} Delete result
 */
async function deleteFromS3(key) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    const result = await s3.deleteObject(params).promise();
    console.log('✅ File deleted from S3:', key);
    return result;
  } catch (error) {
    console.error('S3 delete failed:', error);
    throw error;
  }
}

/**
 * Generate presigned URL for file upload
 * @param {string} key - S3 object key
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} Presigned URL
 */
async function generatePresignedUrl(key, contentType, expiresIn = 3600) {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: expiresIn
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    return url;
  } catch (error) {
    console.error('Presigned URL generation failed:', error);
    throw error;
  }
}

/**
 * Get file URL from S3
 * @param {string} key - S3 object key
 * @returns {string} File URL
 */
function getFileUrl(key) {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of file objects
 * @param {string} folder - S3 folder prefix
 * @returns {Promise<Array>} Upload results
 */
async function uploadMultipleFilesToS3(files, folder = 'mathematico') {
  try {
    const uploadPromises = files.map((file, index) => {
      const key = `${folder}/${Date.now()}-${index}-${file.originalname}`;
      return uploadToS3(file.buffer, key, file.mimetype, {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple file upload to S3 failed:', error);
    throw error;
  }
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  generatePresignedUrl,
  getFileUrl,
  uploadMultipleFilesToS3,
  s3,
  BUCKET_NAME
};
