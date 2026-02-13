// Student Controller - Handles student operations with MongoDB
const connectDB = require('../config/database');

// Import models
let CourseModel, BookModel, LiveClassModel, UserModel;
try {
  CourseModel = require('../models/Course');
  BookModel = require('../models/Book');
  LiveClassModel = require('../models/LiveClass');
  UserModel = require('../models/User');
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Student models not available:', error && error.message ? error.message : error);
  }
}

/**
 * Get student dashboard
 */
const getDashboard = async (req, res) => {
  try {
    await connectDB();
    const studentId = req.user.id;

    // Get enrolled courses count
    const enrolledCoursesCount = await CourseModel.countDocuments({
      'enrolledStudents.student': studentId
    });

    // Get completed courses count
    const completedCoursesCount = await CourseModel.countDocuments({
      'enrolledStudents.student': studentId,
      'enrolledStudents.completed': true
    });

    // Get purchased books count
    const purchasedBooksCount = await BookModel.countDocuments({
      'purchasedBy.student': studentId
    });

    // Get upcoming live classes count
    const upcomingLiveClassesCount = await LiveClassModel.countDocuments({
      'enrolledStudents.student': studentId,
      startTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'live'] }
    });

    // Calculate overall progress
    const enrolledCourses = await CourseModel.find({
      'enrolledStudents.student': studentId
    }).select('enrolledStudents');

    let totalProgress = 0;
    let courseCount = 0;

    enrolledCourses.forEach(course => {
      const enrollment = course.enrolledStudents.find(
        e => e.student.toString() === studentId.toString()
      );
      if (enrollment) {
        totalProgress += enrollment.progress || 0;
        courseCount++;
      }
    });

    const averageProgress = courseCount > 0 ? totalProgress / courseCount : 0;

    // Get recent enrolled courses details
    const recentEnrolledCourses = await CourseModel.find({
      'enrolledStudents.student': studentId
    })
      .select('title description category thumbnail status')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get upcoming live classes details
    const upcomingLiveClasses = await LiveClassModel.find({
      'enrolledStudents.student': studentId,
      startTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'live'] }
    })
      .select('title description subject scheduledAt meetingLink status')
      .sort({ scheduledAt: 1 })
      .limit(5)
      .lean();

    // Get recent purchased books
    const recentPurchasedBooks = await BookModel.find({
      'purchasedBy.student': studentId
    })
      .select('title author category coverImage')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const dashboardData = {
      enrolledCourses: enrolledCoursesCount,
      completedCourses: completedCoursesCount,
      totalBooks: purchasedBooksCount,
      upcomingLiveClasses: upcomingLiveClassesCount,
      progress: Math.round(averageProgress),
      recentCourses: recentEnrolledCourses || [],
      upcomingClasses: upcomingLiveClasses || [],
      recentBooks: recentPurchasedBooks || []
    };
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student profile
 */
const getProfile = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();
    const studentId = req.user.id;

    const user = await UserModel.findById(studentId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        grade: user.grade,
        school: user.school,
        subjects: user.subjects,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      timestamp: new Date().toISOString(),
      message: 'Student profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update student profile
 */
const updateProfile = async (req, res) => {
  try {
    if (!UserModel) {
      return res.status(503).json({ success: false, message: 'User model unavailable' });
    }

    await connectDB();
    const studentId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isAdmin;
    delete updateData.refreshTokens;

    const user = await UserModel.findByIdAndUpdate(
      studentId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        grade: user.grade,
        school: user.school,
        subjects: user.subjects,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      timestamp: new Date().toISOString(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all available courses
 */
const getEnrolledCourses = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const courses = await CourseModel.find({ 
      status: 'published',
      isAvailable: true 
    })
      .select('-enrolledStudents -reviews')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CourseModel.countDocuments({ status: 'published', isAvailable: true });

    res.json({
      success: true,
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Enroll in course
 */
const enrollInCourse = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const studentId = req.user.id;

    const course = await CourseModel.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Use the model's enrollStudent method
    await course.enrollStudent(studentId);

    res.json({
      success: true,
      message: 'Successfully enrolled in course',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to enroll in course',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all available books
 */
const getStudentBooks = async (req, res) => {
  try {
    if (!BookModel) {
      return res.status(503).json({ success: false, message: 'Book model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const books = await BookModel.find({ 
      status: 'published',
      isAvailable: true 
    })
      .select('-pdfFile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BookModel.countDocuments({ status: 'published', isAvailable: true });

    res.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all available live classes
 */
const getStudentLiveClasses = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const liveClasses = await LiveClassModel.find({ 
      status: { $in: ['scheduled', 'live'] },
      isAvailable: true,
      startTime: { $gte: new Date() }
    })
      .select('-enrolledStudents -reviews')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await LiveClassModel.countDocuments({ 
      status: { $in: ['scheduled', 'live'] },
      isAvailable: true,
      startTime: { $gte: new Date() }
    });

    res.json({
      success: true,
      data: liveClasses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Join live class
 */
const joinLiveClass = async (req, res) => {
  try {
    if (!LiveClassModel) {
      return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
    }

    await connectDB();
    const { id } = req.params;
    const studentId = req.user.id;

    const liveClass = await LiveClassModel.findById(id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }

    if (['cancelled', 'archived'].includes(liveClass.status)) {
      return res.status(400).json({
        success: false,
        message: `Live class is ${liveClass.status}`,
        timestamp: new Date().toISOString()
      });
    }

    const enrollment = liveClass.enrolledStudents.find(
      entry => entry.student.toString() === studentId.toString()
    );

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must enroll in this live class before joining',
        timestamp: new Date().toISOString()
      });
    }

    if (!enrollment.joinedAt) {
      enrollment.joinedAt = new Date();
      await liveClass.save();
    }

    if (!liveClass.meetingLink) {
      return res.status(409).json({
        success: false,
        message: 'Live class meeting link not available',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        joinLink: liveClass.meetingLink,
        meetingId: liveClass.meetingId,
        meetingPassword: liveClass.meetingPassword,
        platform: liveClass.platform
      },
      message: 'Join link generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error joining live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student progress
 */
const getProgress = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const studentId = req.user.id;

    // Get all enrolled courses with progress
    const enrolledCourses = await CourseModel.find({
      'enrolledStudents.student': studentId
    }).select('title enrolledStudents totalLessons');

    let totalLessons = 0;
    let completedLessons = 0;
    const courseProgress = [];

    enrolledCourses.forEach(course => {
      const enrollment = course.enrolledStudents.find(
        e => e.student.toString() === studentId.toString()
      );
      
      if (enrollment) {
        totalLessons += course.totalLessons || 0;
        completedLessons += enrollment.completedLessons?.length || 0;
        
        courseProgress.push({
          courseId: course._id,
          courseTitle: course.title,
          progress: enrollment.progress || 0,
          completedLessons: enrollment.completedLessons?.length || 0,
          totalLessons: course.totalLessons || 0,
          completed: enrollment.completed || false,
          lastAccessed: enrollment.lastAccessed
        });
      }
    });

    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    res.json({
      success: true,
      data: {
        overallProgress: Math.round(overallProgress),
        courseProgress: courseProgress,
        completedLessons: completedLessons,
        totalLessons: totalLessons
      },
      timestamp: new Date().toISOString(),
      message: 'Student progress retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student certificates
 */
const getCertificates = async (req, res) => {
  try {
    if (!CourseModel) {
      return res.status(503).json({ success: false, message: 'Course model unavailable' });
    }

    await connectDB();
    const studentId = req.user.id;

    // Get completed courses with certificates
    const completedCourses = await CourseModel.find({
      'enrolledStudents.student': studentId,
      'enrolledStudents.completed': true,
      'enrolledStudents.certificateIssued': true
    }).select('title enrolledStudents certificateUrl');

    const certificates = completedCourses.map(course => {
      const enrollment = course.enrolledStudents.find(
        e => e.student.toString() === studentId.toString()
      );
      
      return {
        courseId: course._id,
        courseTitle: course.title,
        certificateUrl: enrollment?.certificateUrl,
        completedAt: enrollment?.completedAt,
        issuedAt: enrollment?.certificateIssuedAt
      };
    });

    res.json({
      success: true,
      data: certificates,
      timestamp: new Date().toISOString(),
      message: 'Student certificates retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student certificates',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getEnrolledCourses,
  enrollInCourse,
  getStudentBooks,
  getStudentLiveClasses,
  joinLiveClass,
  getProgress,
  getCertificates,
  // Aliases for route compatibility
  getCourses: getEnrolledCourses,
  getCourseById: async (req, res) => {
    try {
      if (!CourseModel) {
        return res.status(503).json({ success: false, message: 'Course model unavailable' });
      }

      await connectDB();
      const { id } = req.params;

      const course = await CourseModel.findById(id).select('-enrolledStudents -reviews');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: course,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  getBooks: getStudentBooks,
  getBookById: async (req, res) => {
    try {
      if (!BookModel) {
        return res.status(503).json({ success: false, message: 'Book model unavailable' });
      }

      await connectDB();
      const { id } = req.params;

      const book = await BookModel.findById(id).select('-pdfFile');
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: book,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  purchaseBook: async (req, res) => {
    try {
      if (!BookModel) {
        return res.status(503).json({ success: false, message: 'Book model unavailable' });
      }

      await connectDB();
      const { id } = req.params;
      const studentId = req.user.id;

      const book = await BookModel.findById(id);
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check if already purchased
      const alreadyPurchased = book.purchasedBy.some(
        purchase => purchase.student.toString() === studentId.toString()
      );

      if (alreadyPurchased) {
        return res.status(409).json({
          success: false,
          message: 'Book already purchased',
          timestamp: new Date().toISOString()
        });
      }

      // Add purchase record
      book.purchasedBy.push({
        student: studentId,
        purchasedAt: new Date()
      });

      await book.save();

      res.json({
        success: true,
        message: 'Book purchased successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error purchasing book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purchase book',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  getLiveClasses: getStudentLiveClasses,
  getLiveClassById: async (req, res) => {
    try {
      if (!LiveClassModel) {
        return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
      }

      await connectDB();
      const { id } = req.params;

      const liveClass = await LiveClassModel.findById(id).select('-enrolledStudents -reviews');
      
      if (!liveClass) {
        return res.status(404).json({
          success: false,
          message: 'Live class not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: liveClass,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching live class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch live class',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  enrollInLiveClass: async (req, res) => {
    try {
      if (!LiveClassModel) {
        return res.status(503).json({ success: false, message: 'LiveClass model unavailable' });
      }

      await connectDB();
      const { id } = req.params;
      const studentId = req.user.id;

      const liveClass = await LiveClassModel.findById(id);
      
      if (!liveClass) {
        return res.status(404).json({
          success: false,
          message: 'Live class not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check if already enrolled
      const alreadyEnrolled = liveClass.enrolledStudents.some(
        enrollment => enrollment.student.toString() === studentId.toString()
      );

      if (alreadyEnrolled) {
        return res.status(409).json({
          success: false,
          message: 'Already enrolled in this live class',
          timestamp: new Date().toISOString()
        });
      }

      // Check if class has reached maximum capacity
      if (liveClass.maxStudents && liveClass.enrolledStudents.length >= liveClass.maxStudents) {
        return res.status(400).json({
          success: false,
          message: 'Live class has reached maximum capacity',
          timestamp: new Date().toISOString()
        });
      }

      // Add enrollment
      liveClass.enrolledStudents.push({
        student: studentId,
        enrolledAt: new Date()
      });

      await liveClass.save();

      res.json({
        success: true,
        message: 'Successfully enrolled in live class',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error enrolling in live class:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll in live class',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  getCourseProgress: async (req, res) => {
    try {
      if (!CourseModel) {
        return res.status(503).json({ success: false, message: 'Course model unavailable' });
      }

      await connectDB();
      const { courseId } = req.params;
      const studentId = req.user.id;

      const course = await CourseModel.findById(courseId).select('enrolledStudents');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          timestamp: new Date().toISOString()
        });
      }

      const enrollment = course.enrolledStudents.find(
        e => e.student.toString() === studentId.toString()
      );

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Not enrolled in this course',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: {
          progress: enrollment.progress || 0,
          completedLessons: enrollment.completedLessons?.length || 0,
          lastAccessed: enrollment.lastAccessed
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching course progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch course progress',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  updateCourseProgress: async (req, res) => {
    try {
      if (!CourseModel) {
        return res.status(503).json({ success: false, message: 'Course model unavailable' });
      }

      await connectDB();
      const { courseId } = req.params;
      const { lessonId } = req.body;
      const studentId = req.user.id;

      const course = await CourseModel.findById(courseId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          timestamp: new Date().toISOString()
        });
      }

      // Use the model's method to update progress
      await course.updateStudentProgress(studentId, lessonId);

      res.json({
        success: true,
        message: 'Course progress updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating course progress:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course progress',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  getNotifications: async (req, res) => {
    try {
      // For now, return empty notifications array
      // This can be implemented later with a notifications collection
      res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
        message: 'Notifications retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  markNotificationAsRead: async (req, res) => {
    try {
      // For now, just return success
      // This can be implemented later with a notifications collection
      res.json({
        success: true,
        message: 'Notification marked as read',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },
  getMyCourses: getEnrolledCourses,
  getMyBooks: getStudentBooks,
  getMyLiveClasses: getStudentLiveClasses,
  getBookStats: async (req, res) => {
    try {
      if (!BookModel) {
        return res.status(503).json({ success: false, message: 'Book model unavailable' });
      }

      await connectDB();
      const studentId = req.user.id;

      const totalBooks = await BookModel.countDocuments({ status: 'published', isAvailable: true });
      const purchasedBooks = await BookModel.countDocuments({
        'purchasedBy.student': studentId
      });

      res.json({
        success: true,
        data: {
          total: totalBooks,
          purchased: purchasedBooks
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching book stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book stats',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};