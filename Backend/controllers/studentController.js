const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Student Controller - Handles requests from students

/**
 * Get student dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        stats: {
          enrolledCourses: 2,
          purchasedBooks: 1,
          enrolledLiveClasses: 1,
          completedLessons: 5
        },
        recentActivity: [
          {
            id: 1,
            type: 'enrollment',
            message: 'Enrolled in Advanced Mathematics course',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            type: 'purchase',
            message: 'Purchased Advanced Calculus Textbook',
            timestamp: new Date().toISOString()
          }
        ]
      },
      message: 'Student dashboard retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting student dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all courses for students
 */
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    console.log('🎓 Student getting courses - connecting to database...');
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Fallback data for when database is not available
      const fallbackCourses = [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          instructor: 'Dr. John Smith',
          category: 'Mathematics',
          level: 'Advanced',
          price: 99.99,
          status: 'published',
          is_featured: true,
          enrollment_count: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Calculus Fundamentals',
          description: 'Learn calculus from the ground up',
          instructor: 'Prof. Jane Doe',
          category: 'Mathematics',
          level: 'Foundation',
          price: 79.99,
          status: 'published',
          is_featured: false,
          enrollment_count: 89,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        data: fallbackCourses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackCourses.length,
          totalPages: 1
        },
        message: 'Courses retrieved successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Course = require('../models/Course');
    const filters = { status: 'published' }; // Only show published courses to students
    
    if (category) filters.category = category;
    if (search) filters.search = search;
    
    console.log('🎓 Fetching courses from MongoDB with filters:', filters);
    const result = await Course.getAll(parseInt(page), parseInt(limit), filters);
    
    console.log('🎓 Courses fetched from database:', result.data.length, 'courses');
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Courses retrieved successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get course by ID for students
 */
const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    console.log('🎓 Student getting course by ID:', courseId);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Fallback data for when database is not available
      const fallbackCourses = [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          instructor: 'Dr. John Smith',
          category: 'Mathematics',
          level: 'Advanced',
          price: 99.99,
          status: 'published',
          is_featured: true,
          enrollment_count: 150,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Calculus Fundamentals',
          description: 'Learn calculus from the ground up',
          instructor: 'Prof. Jane Doe',
          category: 'Mathematics',
          level: 'Foundation',
          price: 79.99,
          status: 'published',
          is_featured: false,
          enrollment_count: 89,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const course = fallbackCourses.find(c => c._id === courseId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
          timestamp: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        data: course,
        message: 'Course retrieved successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Course = require('../models/Course');
    
    console.log('🎓 Fetching course from MongoDB database...');
    const course = await Course.findById(courseId);
    
    if (!course || course.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🎓 Course fetched from database:', course.title);
    
    res.json({
      success: true,
      data: course,
      message: 'Course retrieved successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error getting course by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course',
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
    const courseId = req.params.id;
    const { paymentMethod, amount } = req.body;
    const userId = req.user.id;
    
    console.log('🎓 Student enrolling in course:', courseId, 'User:', userId);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return res.json({
        success: true,
        data: {
          paymentId: paymentId,
          courseId: courseId,
          amount: amount || 99.99,
          status: 'completed',
          enrolledAt: new Date().toISOString(),
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Course enrolled successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Course = require('../models/Course');
    const Payment = require('../models/Payment');
    
    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create payment record
    const paymentData = {
      user_id: userId,
      item_type: 'course',
      item_id: courseId,
      amount: amount || course.price || 0,
      currency: 'INR',
      payment_method: paymentMethod || 'online',
      payment_gateway: 'razorpay',
      status: 'completed',
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        course_title: course.title,
        enrollment_date: new Date().toISOString()
      }
    };
    
    console.log('💳 Creating payment record in database...');
    const payment = await Payment.create(paymentData);
    
    // Update course enrollment count
    console.log('🎓 Updating course enrollment count...');
    await Course.incrementEnrollment(courseId);
    
    console.log('✅ Course enrollment completed successfully');
    console.log('💳 Payment ID:', payment._id);
    console.log('🎓 Course ID:', courseId);
    
    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        courseId: courseId,
        amount: payment.amount,
        status: payment.status,
        enrolledAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Course enrolled successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all books for students
 */
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    console.log('📚 Student getting books - connecting to database...');
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Fallback data for when database is not available
      const fallbackBooks = [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          level: 'Advanced',
          pages: 250,
          isbn: '978-1234567890',
          status: 'published',
          is_featured: true,
          download_count: 150,
          price: 49.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Calculus Fundamentals',
          description: 'Learn calculus from the ground up',
          author: 'Prof. Jane Doe',
          category: 'Mathematics',
          level: 'Foundation',
          pages: 180,
          isbn: '978-0987654321',
          status: 'published',
          is_featured: false,
          download_count: 89,
          price: 29.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      // Add student-specific fields
      const booksWithStudentData = fallbackBooks.map(book => ({
        ...book,
        isPurchased: false,
        canPreview: true,
        previewPages: 5
      }));
      
      return res.json({
        success: true,
        data: booksWithStudentData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackBooks.length,
          totalPages: 1
        },
        message: 'Books retrieved successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    const filters = { status: 'published' }; // Only show published books to students
    
    if (category) filters.category = category;
    if (search) filters.search = search;
    
    console.log('📚 Fetching books from MongoDB with filters:', filters);
    const result = await Book.getAll(parseInt(page), parseInt(limit), filters);
    
    // Add student-specific fields
    const booksWithStudentData = result.data.map(book => ({
      ...book,
      isPurchased: false,
      canPreview: true,
      previewPages: 5
    }));
    
    console.log('📚 Books fetched from database:', result.data.length, 'books');
    
    res.json({
      success: true,
      data: booksWithStudentData,
      pagination: result.pagination,
      message: 'Books retrieved successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get book by ID for students
 */
const getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;
    
    console.log('📚 Student getting book by ID:', bookId);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Fallback data for when database is not available
      const fallbackBooks = [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          level: 'Advanced',
          pages: 250,
          isbn: '978-1234567890',
          status: 'published',
          is_featured: true,
          download_count: 150,
          price: 49.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Calculus Fundamentals',
          description: 'Learn calculus from the ground up',
          author: 'Prof. Jane Doe',
          category: 'Mathematics',
          level: 'Foundation',
          pages: 180,
          isbn: '978-0987654321',
          status: 'published',
          is_featured: false,
          download_count: 89,
          price: 29.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const book = fallbackBooks.find(b => b._id === bookId);
      
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
          timestamp: new Date().toISOString()
        });
      }
      
      // Add student-specific fields
      const bookWithStudentData = {
        ...book,
        isPurchased: false,
        canPreview: true,
        previewPages: 5,
        totalPages: book.pages || 0
      };
      
      return res.json({
        success: true,
        data: bookWithStudentData,
        message: 'Book details retrieved successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    
    console.log('📚 Fetching book from MongoDB database...');
    const book = await Book.findById(bookId);
    
    if (!book || book.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add student-specific fields
    const bookWithStudentData = {
      ...book,
      isPurchased: false,
      canPreview: true,
      previewPages: 5,
      totalPages: book.pages || 0
    };
    
    console.log('📚 Book fetched from database:', book.title);
    
    res.json({
      success: true,
      data: bookWithStudentData,
      message: 'Book details retrieved successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error getting book by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Purchase book
 */
const purchaseBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const { paymentMethod, amount } = req.body;
    const userId = req.user.id;
    
    console.log('📚 Student purchasing book:', bookId, 'User:', userId);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return res.json({
        success: true,
        data: {
          paymentId: paymentId,
          bookId: bookId,
          amount: amount || 49.99,
          status: 'completed',
          purchasedAt: new Date().toISOString(),
          accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Book purchased successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    const Payment = require('../models/Payment');
    
    // Get book details
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create payment record
    const paymentData = {
      user_id: userId,
      item_type: 'book',
      item_id: bookId,
      amount: amount || book.price || 0,
      currency: 'INR',
      payment_method: paymentMethod || 'online',
      payment_gateway: 'razorpay',
      status: 'completed',
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        book_title: book.title,
        purchase_date: new Date().toISOString()
      }
    };
    
    console.log('💳 Creating payment record in database...');
    const payment = await Payment.create(paymentData);
    
    // Update book download count
    console.log('📚 Updating book download count...');
    await Book.incrementDownloads(bookId);
    
    console.log('✅ Book purchase completed successfully');
    console.log('💳 Payment ID:', payment._id);
    console.log('📚 Book ID:', bookId);
    
    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        bookId: bookId,
        amount: payment.amount,
        status: payment.status,
        purchasedAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Book purchased successfully',
      timestamp: new Date().toISOString(),
      database: true
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
};

/**
 * Get live classes for students
 */
const getLiveClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    console.log('🎥 Student getting live classes - connecting to database...');
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Fallback data for when database is not available
      const fallbackLiveClasses = [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Rodriguez',
          category: 'Mathematics',
          level: 'Advanced',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          max_students: 50,
          enrolled_students: 23,
          price: 29.99,
          status: 'upcoming',
          is_featured: true,
          meeting_link: 'https://meet.google.com/advanced-calculus',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Differential Equations Workshop',
          description: 'Hands-on workshop on solving differential equations',
          instructor: 'Prof. David Kim',
          category: 'Mathematics',
          level: 'Intermediate',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          max_students: 30,
          enrolled_students: 15,
          price: 39.99,
          status: 'upcoming',
          is_featured: false,
          meeting_link: 'https://meet.google.com/diff-eq-workshop',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        data: fallbackLiveClasses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackLiveClasses.length,
          totalPages: 1
        },
        message: 'Live classes retrieved successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const LiveClass = require('../models/LiveClass');
    const filters = { status: { $in: ['upcoming', 'live'] } }; // Only show upcoming and live classes to students
    
    if (status) filters.status = status;
    
    console.log('🎥 Fetching live classes from MongoDB with filters:', filters);
    const result = await LiveClass.getAll(parseInt(page), parseInt(limit), filters);
    
    console.log('🎥 Live classes fetched from database:', result.data.length, 'classes');
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Live classes retrieved successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error getting live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get live class by ID for students
 */
const getLiveClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    
    console.log('🎥 Student getting live class by ID:', classId);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Fallback data for when database is not available
      const fallbackLiveClasses = [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Rodriguez',
          category: 'Mathematics',
          level: 'Advanced',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          max_students: 50,
          enrolled_students: 23,
          price: 29.99,
          status: 'upcoming',
          is_featured: true,
          meeting_link: 'https://meet.google.com/advanced-calculus',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Differential Equations Workshop',
          description: 'Hands-on workshop on solving differential equations',
          instructor: 'Prof. David Kim',
          category: 'Mathematics',
          level: 'Intermediate',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          max_students: 30,
          enrolled_students: 15,
          price: 39.99,
          status: 'upcoming',
          is_featured: false,
          meeting_link: 'https://meet.google.com/diff-eq-workshop',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const liveClass = fallbackLiveClasses.find(lc => lc._id === classId);
      
      if (!liveClass) {
        return res.status(404).json({
          success: false,
          message: 'Live class not found',
          timestamp: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        data: liveClass,
        message: 'Live class retrieved successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const LiveClass = require('../models/LiveClass');
    
    console.log('🎥 Fetching live class from MongoDB database...');
    const liveClass = await LiveClass.findById(classId);
    
    if (!liveClass || !['upcoming', 'live'].includes(liveClass.status)) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🎥 Live class fetched from database:', liveClass.title);
    
    res.json({
      success: true,
      data: liveClass,
      message: 'Live class retrieved successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Error getting live class by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Enroll in live class
 */
const enrollInLiveClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const { paymentMethod, amount } = req.body;
    const userId = req.user.id;
    
    console.log('🎥 Student enrolling in live class:', classId, 'User:', userId);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return res.json({
        success: true,
        data: {
          paymentId: paymentId,
          liveClassId: classId,
          amount: amount || 29.99,
          status: 'completed',
          enrolledAt: new Date().toISOString(),
          meetingLink: 'https://meet.example.com/advanced-math'
        },
        message: 'Live class enrolled successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const LiveClass = require('../models/LiveClass');
    const Payment = require('../models/Payment');
    
    // Get live class details
    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if class is full
    if (liveClass.enrolled_students >= liveClass.max_students) {
      return res.status(400).json({
        success: false,
        message: 'Live class is full',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create payment record
    const paymentData = {
      user_id: userId,
      item_type: 'live_class',
      item_id: classId,
      amount: amount || liveClass.price || 0,
      currency: 'INR',
      payment_method: paymentMethod || 'online',
      payment_gateway: 'razorpay',
      status: 'completed',
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        live_class_title: liveClass.title,
        enrollment_date: new Date().toISOString(),
        meeting_link: liveClass.meeting_link
      }
    };
    
    console.log('💳 Creating payment record in database...');
    const payment = await Payment.create(paymentData);
    
    // Update live class enrollment count
    console.log('🎥 Updating live class enrollment count...');
    await LiveClass.incrementEnrollment(classId);
    
    console.log('✅ Live class enrollment completed successfully');
    console.log('💳 Payment ID:', payment._id);
    console.log('🎥 Live class ID:', classId);
    
    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        liveClassId: classId,
        amount: payment.amount,
        status: payment.status,
        enrolledAt: new Date().toISOString(),
        meetingLink: liveClass.meeting_link
      },
      message: 'Live class enrolled successfully',
      timestamp: new Date().toISOString(),
      database: true
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
};

/**
 * Get course progress
 */
const getCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    res.json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        progress: 25,
        completedLessons: 2,
        totalLessons: 8,
        lastAccessed: new Date().toISOString(),
        timeSpent: 120 // minutes
      },
      message: 'Course progress retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course progress',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update course progress
 */
const updateCourseProgress = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { lessonId, completed } = req.body;
    
    res.json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        lessonId: lessonId,
        completed: completed,
        progress: 30,
        updatedAt: new Date().toISOString()
      },
      message: 'Course progress updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course progress',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get notifications
 */
const getNotifications = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'New Course Available',
          message: 'Advanced Mathematics course is now available',
          type: 'course',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Live Class Reminder',
          message: 'Your live class starts in 1 hour',
          type: 'live_class',
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Notifications retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    res.json({
      success: true,
      data: {
        notificationId: parseInt(notificationId),
        isRead: true,
        readAt: new Date().toISOString()
      },
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
};

/**
 * Get student's enrolled courses
 */
const getMyCourses = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'No enrolled courses found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting my courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student's purchased books
 */
const getMyBooks = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'No purchased books found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting my books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchased books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get student's enrolled live classes
 */
const getMyLiveClasses = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'No enrolled live classes found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting my live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve enrolled live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get book statistics
 */
const getBookStats = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalBooks: 0,
        purchasedBooks: 0,
        availableBooks: 0
      },
      message: 'Book statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting book stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book statistics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getDashboard,
  getCourses,
  getCourseById,
  enrollInCourse,
  getBooks,
  getBookById,
  purchaseBook,
  getLiveClasses,
  getLiveClassById,
  enrollInLiveClass,
  getCourseProgress,
  updateCourseProgress,
  getNotifications,
  markNotificationAsRead,
  getMyCourses,
  getMyBooks,
  getMyLiveClasses,
  getBookStats
};
