/**
 * Student Course Access Middleware
 * 
 * This middleware provides comprehensive access control for course-related resources.
 * It ensures students can only access content they have purchased or are enrolled in.
 */

const Course = require('../models/Course');
const User = require('../models/User');
const securityLogger = require('../utils/securityLogger');

/**
 * Middleware to verify course ownership
 * @param {string} courseIdParam - Parameter name containing course ID (default: 'courseId')
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
function requireCourseOwnership(courseIdParam = 'courseId', options = {}) {
  const {
    allowAdmin = true,
    allowInstructor = false,
    checkEnrollment = true,
    checkPublication = true
  } = options;
  
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        securityLogger.logSecurityEvent({
          eventType: 'COURSE_ACCESS_DENIED',
          userId: 'anonymous',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'UNAUTHENTICATED',
          courseId: req.params[courseIdParam]
        });
        
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access course content',
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
      
      // Get course details
      const course = await Course.findById(courseId)
        .select('_id title price enrolledStudents isPublished instructor')
        .populate('instructor', '_id name email');
      
      if (!course) {
        securityLogger.logSecurityEvent({
          eventType: 'COURSE_ACCESS_DENIED',
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
      
      // Check if course is published (unless admin)
      if (checkPublication && !course.isPublished) {
        // Get user details to check admin status
        const user = await User.findById(userId).select('role isAdmin');
        const isAdmin = allowAdmin && (user && (user.isAdmin || user.role === 'admin'));
        
        if (!isAdmin) {
          securityLogger.logSecurityEvent({
            eventType: 'COURSE_ACCESS_DENIED',
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
            error: 'COURSE_NOT_AVAILABLE',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Get user details for role checking
      const user = await User.findById(userId).select('role isAdmin');
      const isAdmin = allowAdmin && (user && (user.isAdmin || user.role === 'admin'));
      const isInstructor = allowInstructor && course.instructor && 
        course.instructor._id.toString() === userId;
      
      // Check enrollment (skip for admin/instructor based on options)
      let isEnrolled = false;
      if (checkEnrollment && !isAdmin && !isInstructor) {
        isEnrolled = course.enrolledStudents && 
          course.enrolledStudents.some(enrollment => 
            enrollment.student && enrollment.student.toString() === userId
          );
      }
      
      // Determine access
      const hasAccess = isAdmin || isInstructor || (checkEnrollment ? isEnrolled : true);
      
      if (!hasAccess) {
        securityLogger.logSecurityEvent({
          eventType: 'COURSE_ACCESS_DENIED',
          userId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          reason: 'NOT_ENROLLED',
          courseId,
          isEnrolled,
          isAdmin,
          isInstructor
        });
        
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to access this content',
          error: 'COURSE_ACCESS_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      // Log successful access
      securityLogger.logSecurityEvent({
        eventType: 'COURSE_ACCESS_GRANTED',
        userId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        courseId,
        isEnrolled,
        isAdmin,
        isInstructor
      });
      
      // Add course access info to request for downstream use
      req.courseAccess = {
        courseId,
        isEnrolled,
        isAdmin,
        isInstructor,
        accessGranted: true,
        course: {
          id: course._id,
          title: course.title,
          instructor: course.instructor
        }
      };
      
      next();
      
    } catch (error) {
      console.error('Course access middleware error:', error);
      securityLogger.logSecurityEvent({
        eventType: 'COURSE_ACCESS_ERROR',
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
 * Middleware to check if user is enrolled in specific courses
 * @param {string[]} courseIds - Array of course IDs to check
 * @returns {Function} Express middleware function
 */
function requireCourseEnrollment(courseIds) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      const userId = req.user.id;
      const courses = await Course.find({
        '_id': { $in: courseIds },
        'enrolledStudents.student': userId
      }).select('_id title');
      
      const enrolledCourseIds = courses.map(course => course._id.toString());
      const missingCourses = courseIds.filter(id => !enrolledCourseIds.includes(id));
      
      if (missingCourses.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in all required courses',
          error: 'MISSING_ENROLLMENTS',
          data: {
            missingCourses,
            enrolledCourses: enrolledCourseIds
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Add enrollment info to request
      req.enrollmentInfo = {
        userId,
        enrolledCourseIds,
        courses: courses.map(course => ({
          id: course._id,
          title: course.title
        }))
      };
      
      next();
      
    } catch (error) {
      console.error('Course enrollment middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying course enrollment',
        error: 'ENROLLMENT_VERIFICATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to get user's enrolled courses
 * @returns {Function} Express middleware function
 */
function getUserEnrollments() {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      const userId = req.user.id;
      const courses = await Course.find({
        'enrolledStudents.student': userId,
        isPublished: true
      })
      .select('_id title description price thumbnail enrolledStudents')
      .populate('instructor', 'name email');
      
      // Format enrollment data
      const enrollments = courses.map(course => {
        const enrollment = course.enrolledStudents.find(
          e => e.student && e.student.toString() === userId
        );
        
        return {
          courseId: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
          enrolledAt: enrollment ? enrollment.enrolledAt : null,
          progress: enrollment ? enrollment.progress || 0 : 0,
          completedAt: enrollment ? enrollment.completedAt : null
        };
      });
      
      // Add enrollments to request for downstream use
      req.userEnrollments = enrollments;
      
      next();
      
    } catch (error) {
      console.error('Get user enrollments middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving course enrollments',
        error: 'ENROLLMENTS_RETRIEVAL_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Middleware to check if user can purchase a course
 * @param {string} courseIdParam - Parameter name containing course ID
 * @returns {Function} Express middleware function
 */
function canPurchaseCourse(courseIdParam = 'courseId') {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to purchase courses',
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
      
      // Get course details
      const course = await Course.findById(courseId)
        .select('_id title price isPublished enrolledStudents');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          error: 'COURSE_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if course is published
      if (!course.isPublished) {
        return res.status(400).json({
          success: false,
          message: 'Course is not available for purchase',
          error: 'COURSE_NOT_AVAILABLE',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if user is already enrolled
      const isEnrolled = course.enrolledStudents && 
        course.enrolledStudents.some(enrollment => 
          enrollment.student && enrollment.student.toString() === userId
        );
      
      if (isEnrolled) {
        return res.status(400).json({
          success: false,
          message: 'You are already enrolled in this course',
          error: 'ALREADY_ENROLLED',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if course is free
      if (!course.price || course.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'This course is free. Please enroll directly.',
          error: 'FREE_COURSE',
          timestamp: new Date().toISOString()
        });
      }
      
      // Add purchase info to request
      req.purchaseInfo = {
        courseId: course._id,
        title: course.title,
        price: course.price,
        userId,
        canPurchase: true
      };
      
      next();
      
    } catch (error) {
      console.error('Can purchase course middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking purchase eligibility',
        error: 'PURCHASE_CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  };
}

module.exports = {
  requireCourseOwnership,
  requireCourseEnrollment,
  getUserEnrollments,
  canPurchaseCourse
};
