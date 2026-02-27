/**
 * Secure PDF Access Control Middleware
 * 
 * This middleware implements secure PDF access control when ENABLE_SECURE_PDF is enabled.
 * It ensures that only authenticated users with proper course ownership can access PDFs.
 */

const { isSecurePdfEnabled } = require('../utils/featureFlags');
const { strictAuthenticateToken } = require('./strictJwtAuth');
const Course = require('../models/Course');
const User = require('../models/User');
const securityLogger = require('../utils/securityLogger');

/**
 * Middleware to verify course access for PDF downloads
 * @param {string} courseIdParam - Parameter name containing course ID (default: 'courseId')
 * @returns {Function} Express middleware function
 */
function verifyCourseAccess(courseIdParam = 'courseId') {
  return async (req, res, next) => {
    // Skip all checks if secure PDF is disabled
    if (!isSecurePdfEnabled()) {
      return next();
    }
    
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        securityLogger.logSecurityEvent({
          eventType: 'PDF_ACCESS_DENIED',
          userId: 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'UNAUTHENTICATED',
          courseId: req.params[courseIdParam]
        });
        
        return res.status(401).json({
          success: false,
          message: 'Authentication required for PDF access',
          error: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      const courseId = req.params[courseIdParam];
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required',
          error: 'COURSE_ID_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      const userId = req.user.id;
      
      // Verify course exists
      const course = await Course.findById(courseId).select('_id title price enrolledStudents isPublished');
      if (!course) {
        securityLogger.logSecurityEvent({
          eventType: 'PDF_ACCESS_DENIED',
          userId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'COURSE_NOT_FOUND',
          courseId
        });
        
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          error: 'COURSE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if course is published
      if (!course.isPublished) {
        securityLogger.logSecurityEvent({
          eventType: 'PDF_ACCESS_DENIED',
          userId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'COURSE_NOT_PUBLISHED',
          courseId
        });
        
        return res.status(403).json({
          success: false,
          message: 'Course is not available',
          error: 'COURSE_NOT_PUBLISHED',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if user is enrolled in the course
      const isEnrolled = course.enrolledStudents && 
        course.enrolledStudents.some(enrollment => 
          enrollment.student && enrollment.student.toString() === userId
        );
      
      // Also check if user is admin or course instructor
      const user = await User.findById(userId).select('role isAdmin');
      const isAdmin = user && (user.isAdmin || user.role === 'admin');
      
      if (!isEnrolled && !isAdmin) {
        securityLogger.logSecurityEvent({
          eventType: 'PDF_ACCESS_DENIED',
          userId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'NOT_ENROLLED',
          courseId,
          isEnrolled,
          isAdmin
        });
        
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to access PDFs',
          error: 'COURSE_ACCESS_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      // User has access - log successful access
      securityLogger.logSecurityEvent({
        eventType: 'PDF_ACCESS_GRANTED',
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        courseId,
        isEnrolled,
        isAdmin
      });
      
      // Add course info to request for downstream use
      req.courseAccess = {
        courseId,
        isEnrolled,
        isAdmin,
        accessGranted: true
      };
      
      next();
      
    } catch (error) {
      console.error('Secure PDF middleware error:', error);
      securityLogger.logSecurityEvent({
        eventType: 'PDF_ACCESS_ERROR',
        userId: req.user?.id || 'unknown',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        error: error.message,
        courseId: req.params[courseIdParam]
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error verifying course access',
        error: 'ACCESS_VERIFICATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to check if secure PDF is enabled
 * Returns 503 if disabled, with clear error message
 */
function requireSecurePdf() {
  return (req, res, next) => {
    if (!isSecurePdfEnabled()) {
      return res.status(503).json({
        success: false,
        message: 'Secure PDF access is not enabled',
        error: 'FEATURE_DISABLED',
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * Generate signed URL for secure PDF access
 * @param {string} pdfUrl - Original Cloudinary PDF URL
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {number} expiresIn - Expiration time in seconds (default: 600 = 10 minutes)
 * @returns {string} Signed URL or original URL if feature disabled
 */
function generateSignedPdfUrl(pdfUrl, userId, courseId, expiresIn = 600) {
  if (!isSecurePdfEnabled()) {
    return pdfUrl; // Return original URL if feature disabled
  }
  
  if (!pdfUrl || !userId || !courseId) {
    throw new Error('PDF URL, user ID, and course ID are required for signed URL generation');
  }
  
  // Create a simple signed token (in production, consider using JWT or similar)
  const crypto = require('crypto');
  const timestamp = Date.now();
  const expires = timestamp + (expiresIn * 1000);
  
  const payload = `${pdfUrl}|${userId}|${courseId}|${expires}`;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
    .update(payload)
    .digest('hex');
  
  // Return URL with signature as query parameters
  const baseUrl = pdfUrl.split('?')[0]; // Remove existing query params
  return `${baseUrl}?secure=1&userId=${userId}&courseId=${courseId}&expires=${expires}&signature=${signature}`;
}

/**
 * Verify signed PDF URL
 * @param {Object} req - Express request object
 * @returns {boolean} Whether the signature is valid
 */
function verifySignedPdfUrl(req) {
  if (!isSecurePdfEnabled()) {
    return true; // Skip verification if feature disabled
  }
  
  const { secure, userId, courseId, expires, signature } = req.query;
  
  if (!secure || !userId || !courseId || !expires || !signature) {
    return false;
  }
  
  // Check expiration
  if (Date.now() > parseInt(expires)) {
    return false;
  }
  
  // Verify signature
  const crypto = require('crypto');
  const pdfUrl = req.originalUrl.split('?')[0]; // Get base URL
  const payload = `${pdfUrl}|${userId}|${courseId}|${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

module.exports = {
  verifyCourseAccess,
  requireSecurePdf,
  generateSignedPdfUrl,
  verifySignedPdfUrl
};
