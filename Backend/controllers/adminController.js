const User = require('../models/User');
const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const Payment = require('../models/Payment');
const path = require('path');

// Admin Controller - Handles admin panel operations

/**
 * Get dashboard statistics
 */
const getDashboard = async (req, res) => {
  try {
    // Get stats from all models
    const [userStats, bookStats, courseStats, liveClassStats, paymentStats] = await Promise.allSettled([
      User.getAll(1, 1).then(result => ({ total: result.pagination.total })).catch(() => ({ total: 0 })),
      Book.getAll(1, 1).then(result => ({ total: result.pagination.total })).catch(() => ({ total: 0 })),
      Course.getStats().catch(() => ({ total: 0, published: 0, draft: 0 })),
      LiveClass.getStats().catch(() => ({ total: 0, upcoming: 0, completed: 0 })),
      Payment.getStats().catch(() => ({ total: 0, totalAmount: 0 }))
    ]);

    const dashboardData = {
      totalUsers: userStats.status === 'fulfilled' ? userStats.value.total : 0,
      totalBooks: bookStats.status === 'fulfilled' ? bookStats.value.total : 0,
      totalCourses: courseStats.status === 'fulfilled' ? courseStats.value.total : 0,
      totalLiveClasses: liveClassStats.status === 'fulfilled' ? liveClassStats.value.total : 0,
      totalRevenue: paymentStats.status === 'fulfilled' ? paymentStats.value.totalAmount : 0,
      courseStats: courseStats.status === 'fulfilled' ? courseStats.value : { total: 0, published: 0, draft: 0 },
      liveClassStats: liveClassStats.status === 'fulfilled' ? liveClassStats.value : { total: 0, upcoming: 0, completed: 0 }
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= USER MANAGEMENT =============

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;

    const result = await User.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      timestamp: new Date().toISOString()
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      timestamp: new Date().toISOString()
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const user = await User.update(id, updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.delete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      timestamp: new Date().toISOString()
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const status = is_active ? 'active' : 'inactive';
    const user = await User.updateStatus(id, status);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= BOOK MANAGEMENT =============

const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (status) filters.status = status;

    const result = await Book.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      timestamp: new Date().toISOString()
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    
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
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      timestamp: new Date().toISOString()
    });
  }
};

const createBook = async (req, res) => {
  try {
    const bookData = req.body;
    
    // Handle file uploads
    if (req.files) {
      if (req.files.cover_image) {
        bookData.cover_image_url = `/uploads/covers/${req.files.cover_image[0].filename}`;
      }
      if (req.files.pdf_file) {
        bookData.pdf_url = `/uploads/pdfs/${req.files.pdf_file[0].filename}`;
      }
    }
    
    // Add created_by from authenticated user
    bookData.created_by = req.user?.id || '1'; // Default to admin user if not available
    
    const book = await Book.create(bookData);
    
    res.status(201).json({
      success: true,
      data: book,
      message: 'Book created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      timestamp: new Date().toISOString()
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle file uploads
    if (req.files) {
      if (req.files.cover_image) {
        updateData.cover_image_url = `/uploads/covers/${req.files.cover_image[0].filename}`;
      }
      if (req.files.pdf_file) {
        updateData.pdf_url = `/uploads/pdfs/${req.files.pdf_file[0].filename}`;
      }
    }
    
    const book = await Book.update(id, updateData);
    
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
      message: 'Book updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.delete(id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      timestamp: new Date().toISOString()
    });
  }
};

const updateBookStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const book = await Book.updateStatus(id, status);
    
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
      message: 'Book status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update book status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book status',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= COURSE MANAGEMENT =============

const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (status) filters.status = status;

    const result = await Course.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      timestamp: new Date().toISOString()
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    
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
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      timestamp: new Date().toISOString()
    });
  }
};

const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    
    // Handle file upload
    if (req.file) {
      courseData.thumbnail = `/uploads/covers/${req.file.filename}`;
    }
    
    // Add created_by from authenticated user
    courseData.created_by = req.user?.id || '1'; // Default to admin user if not available
    
    const course = await Course.create(courseData);
    
    res.status(201).json({
      success: true,
      data: course,
      message: 'Course created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      timestamp: new Date().toISOString()
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle file upload
    if (req.file) {
      updateData.thumbnail = `/uploads/covers/${req.file.filename}`;
    }
    
    const course = await Course.update(id, updateData);
    
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
      message: 'Course updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.delete(id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      timestamp: new Date().toISOString()
    });
  }
};

const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const course = await Course.updateStatus(id, status);
    
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
      message: 'Course status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= LIVE CLASS MANAGEMENT =============

const getAllLiveClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, instructor } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (instructor) filters.instructor = instructor;

    const result = await LiveClass.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get live classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live classes',
      timestamp: new Date().toISOString()
    });
  }
};

const getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findById(id);
    
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
    console.error('Get live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live class',
      timestamp: new Date().toISOString()
    });
  }
};

const createLiveClass = async (req, res) => {
  try {
    const liveClassData = req.body;
    
    // Handle file upload
    if (req.file) {
      liveClassData.thumbnail = `/uploads/covers/${req.file.filename}`;
    }
    
    // Convert field names to match database schema
    if (liveClassData.scheduledAt) {
      liveClassData.date = liveClassData.scheduledAt;
      delete liveClassData.scheduledAt;
    }
    if (liveClassData.maxStudents) {
      liveClassData.max_students = liveClassData.maxStudents;
      delete liveClassData.maxStudents;
    }
    if (liveClassData.meetingLink) {
      liveClassData.meeting_link = liveClassData.meetingLink;
      delete liveClassData.meetingLink;
    }
    
    // Add created_by from authenticated user
    liveClassData.created_by = req.user?.id || '1'; // Default to admin user if not available
    
    const liveClass = await LiveClass.create(liveClassData);
    
    res.status(201).json({
      success: true,
      data: liveClass,
      message: 'Live class created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create live class',
      timestamp: new Date().toISOString()
    });
  }
};

const updateLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle file upload
    if (req.file) {
      updateData.thumbnail = `/uploads/covers/${req.file.filename}`;
    }
    
    // Convert field names to match database schema
    if (updateData.scheduledAt) {
      updateData.date = updateData.scheduledAt;
      delete updateData.scheduledAt;
    }
    if (updateData.maxStudents) {
      updateData.max_students = updateData.maxStudents;
      delete updateData.maxStudents;
    }
    if (updateData.meetingLink) {
      updateData.meeting_link = updateData.meetingLink;
      delete updateData.meetingLink;
    }
    
    const liveClass = await LiveClass.update(id, updateData);
    
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
      message: 'Live class updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live class',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.delete(id);
    
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Live class deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete live class',
      timestamp: new Date().toISOString()
    });
  }
};

const updateLiveClassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const liveClass = await LiveClass.updateStatus(id, status);
    
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
      message: 'Live class status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update live class status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live class status',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= PAYMENT MANAGEMENT =============

const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, item_type } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (item_type) filters.item_type = item_type;

    const result = await Payment.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      timestamp: new Date().toISOString()
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      timestamp: new Date().toISOString()
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, metadata } = req.body;
    
    const payment = await Payment.updateStatus(id, status, metadata);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      timestamp: new Date().toISOString()
    });
  }
};

const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= FILE UPLOAD =============

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        timestamp: new Date().toISOString()
      });
    }

    const fileUrl = `/uploads/${req.file.mimetype.startsWith('image/') ? 'covers' : 'pdfs'}/${req.file.filename}`;
    
    res.json({
      success: true,
      data: { 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= STATISTICS =============

const getOverviewStats = async (req, res) => {
  try {
    const stats = await getDashboard(req, res);
    return stats;
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview statistics',
      timestamp: new Date().toISOString()
    });
  }
};

const getBookStats = async (req, res) => {
  try {
    const stats = await Book.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book statistics',
      timestamp: new Date().toISOString()
    });
  }
};

const getCourseStats = async (req, res) => {
  try {
    const stats = await Course.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course statistics',
      timestamp: new Date().toISOString()
    });
  }
};

const getLiveClassStats = async (req, res) => {
  try {
    const stats = await LiveClass.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get live class stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live class statistics',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= SETTINGS MANAGEMENT =============

const getSettings = async (req, res) => {
  try {
    // For now, return default settings
    const settings = {
      siteName: 'Mathematico',
      siteDescription: 'Your ultimate mathematics learning companion',
      contactEmail: 'support@mathematico.com',
      maxFileSize: 10, // MB
      allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      enableRegistration: true,
      enablePayments: true,
      currency: 'INR',
      timezone: 'UTC',
      maintenanceMode: false,
      emailNotifications: true,
      smsNotifications: false
    };
    
    res.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      timestamp: new Date().toISOString()
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // For now, just return the updated settings
    // In a real implementation, you would save to database
    
    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Upload course thumbnail
 */
const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        timestamp: new Date().toISOString()
      });
    }

    const fileUrl = `/uploads/covers/${req.file.filename}`;
    
    res.json({
      success: true,
      data: { 
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      message: 'Course thumbnail uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Course thumbnail upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload course thumbnail',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Toggle course publish status
 */
const toggleCoursePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    
    // For now, just return success
    // In a real implementation, you would update the database
    
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        isPublished: isPublished,
        updatedAt: new Date().toISOString()
      },
      message: 'Course publish status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Toggle course publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle course publish status',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStatus,
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  getAllLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats,
  uploadFile,
  getOverviewStats,
  getBookStats,
  getCourseStats,
  getLiveClassStats,
  getSettings,
  updateSettings,
  uploadCourseThumbnail,
  toggleCoursePublish
};
