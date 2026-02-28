/**
 * Secure PDF Routes
 * 
 * These routes handle secure PDF access when ENABLE_SECURE_PDF is enabled.
 * They provide signed URL generation and direct PDF streaming with access control.
 */

const express = require('express');
const router = express.Router();
const { 
  verifyCourseAccess, 
  requireSecurePdf, 
  generateSignedPdfUrl,
  verifySignedPdfUrl 
} = require('../middleware/securePdf');
const { isSecurePdfEnabled } = require('../utils/featureFlags');
const Course = require('../models/Course');
const securityLogger = require('../utils/securityLogger');

// Public endpoints (no authentication required)
/**
 * GET /api/v1/secure-pdf/status
 * Check if secure PDF is enabled (public endpoint)
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    securePdfEnabled: isSecurePdfEnabled(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/secure-pdf/
 * Root endpoint with basic info (public endpoint)
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Secure PDF API',
    securePdfEnabled: isSecurePdfEnabled(),
    endpoints: {
      status: '/status',
      generateSignedUrl: '/generate-signed-url',
      verifyAccess: '/verify-access',
      coursePdfList: '/course/:courseId/list',
      coursePdfAccess: '/course/:courseId/pdf/:pdfId'
    },
    timestamp: new Date().toISOString()
  });
});

// Protected endpoints (authentication required)
/**
 * POST /api/v1/secure-pdf/generate-signed-url
 * Generate a signed URL for PDF access
 * Body: { pdfUrl, courseId, expiresIn? }
 */
router.post('/generate-signed-url', requireSecurePdf(), async (req, res) => {
  try {
    const { pdfUrl, courseId, expiresIn } = req.body;
    
    if (!pdfUrl || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'PDF URL and course ID are required',
        error: 'MISSING_PARAMETERS',
        timestamp: new Date().toISOString()
      });
    }
    
    // Verify user has access to the course
    const accessMiddleware = verifyCourseAccess();
    await new Promise((resolve, reject) => {
      accessMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Generate signed URL
    const signedUrl = generateSignedPdfUrl(
      pdfUrl,
      req.user.id,
      courseId,
      expiresIn || 600 // Default 10 minutes
    );
    
    securityLogger.logSecurityEvent({
      eventType: 'PDF_SIGNED_URL_GENERATED',
      userId: req.user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      courseId,
      pdfUrl,
      expiresIn: expiresIn || 600
    });
    
    res.json({
      success: true,
      message: 'Signed URL generated successfully',
      data: {
        signedUrl,
        expiresIn: expiresIn || 600,
        courseId
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating signed PDF URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/secure-pdf/course/:courseId/pdf/:pdfId
 * Stream PDF directly with access control
 * This endpoint serves as a proxy to protect the original PDF URL
 */
router.get('/course/:courseId/pdf/:pdfId', 
  requireSecurePdf(),
  verifyCourseAccess('courseId'),
  async (req, res) => {
    try {
      const { courseId, pdfId } = req.params;
      
      // Get course details to find the PDF
      const course = await Course.findById(courseId).select('pdfResources title');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          error: 'COURSE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
      
      // Find the specific PDF in course resources
      const pdfResource = course.pdfResources?.find(pdf => 
        pdf._id?.toString() === pdfId || pdf.publicId === pdfId
      );
      
      if (!pdfResource) {
        securityLogger.logSecurityEvent({
          eventType: 'PDF_ACCESS_DENIED',
          userId: req.user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'PDF_NOT_FOUND',
          courseId,
          pdfId
        });
        
        return res.status(404).json({
          success: false,
          message: 'PDF not found in course',
          error: 'PDF_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
      
      // If secure PDF is enabled, stream through our server
      if (isSecurePdfEnabled()) {
        // Use signed URL approach
        const signedUrl = generateSignedPdfUrl(
          pdfResource.secure_url || pdfResource.url,
          req.user.id,
          courseId,
          600 // 10 minutes
        );
        
        securityLogger.logSecurityEvent({
          eventType: 'PDF_ACCESS_GRANTED',
          userId: req.user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          courseId,
          pdfId,
          pdfTitle: pdfResource.title || 'Untitled PDF'
        });
        
        // Redirect to signed URL
        return res.redirect(302, signedUrl);
      } else {
        // Direct access when feature is disabled
        return res.redirect(302, pdfResource.secure_url || pdfResource.url);
      }
      
    } catch (error) {
      console.error('Error serving secure PDF:', error);
      securityLogger.logSecurityEvent({
        eventType: 'PDF_ACCESS_ERROR',
        userId: req.user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        error: error.message,
        courseId: req.params.courseId,
        pdfId: req.params.pdfId
      });
      
      res.status(500).json({
        success: false,
        message: 'Error accessing PDF',
        error: 'PDF_ACCESS_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/secure-pdf/verify-access
 * Verify if user has access to a course PDF (for frontend checks)
 * Query: courseId
 */
router.get('/verify-access', verifyCourseAccess(), (req, res) => {
  res.json({
    success: true,
    message: 'Access verified',
    data: {
      courseId: req.params.courseId,
      hasAccess: req.courseAccess?.accessGranted || false,
      isEnrolled: req.courseAccess?.isEnrolled || false,
      isAdmin: req.courseAccess?.isAdmin || false
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/secure-pdf/course/:courseId/list
 * List all available PDFs for a course (if user has access)
 */
router.get('/course/:courseId/list', 
  requireSecurePdf(),
  verifyCourseAccess('courseId'),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      
      const course = await Course.findById(courseId)
        .select('title pdfResources')
        .populate('pdfResources');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          error: 'COURSE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
      
      // Return PDF list without exposing direct URLs when secure mode is on
      const pdfList = (course.pdfResources || []).map(pdf => ({
        id: pdf._id,
        title: pdf.title || 'Untitled PDF',
        description: pdf.description || '',
        pages: pdf.pages || null,
        size: pdf.bytes || null,
        format: pdf.format || 'pdf',
        // Only include URL if secure mode is disabled
        url: isSecurePdfEnabled() ? null : (pdf.secure_url || pdf.url),
        requiresSignedUrl: isSecurePdfEnabled()
      }));
      
      res.json({
        success: true,
        message: 'PDF list retrieved successfully',
        data: {
          courseId,
          courseTitle: course.title,
          pdfs: pdfList,
          securePdfEnabled: isSecurePdfEnabled()
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error listing course PDFs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve PDF list',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;
