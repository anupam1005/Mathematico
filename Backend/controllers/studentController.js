const { Book } = require('../database');

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
    
    // Sample courses data for students
    const sampleCourses = [
      {
        id: 1,
        title: 'Advanced Mathematics',
        description: 'Comprehensive course covering advanced mathematical concepts',
        instructor: 'Dr. John Smith',
        price: 99.99,
        duration: '12 weeks',
        level: 'Advanced',
        category: 'Mathematics',
        thumbnail: '/placeholder.svg',
        rating: 4.8,
        studentsCount: 150,
        status: 'published',
        isEnrolled: false,
        progress: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Calculus Fundamentals',
        description: 'Learn the basics of calculus from scratch',
        instructor: 'Prof. Jane Doe',
        price: 79.99,
        duration: '8 weeks',
        level: 'Beginner',
        category: 'Mathematics',
        thumbnail: '/placeholder.svg',
        rating: 4.6,
        studentsCount: 200,
        status: 'published',
        isEnrolled: true,
        progress: 25,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: sampleCourses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sampleCourses.length,
        totalPages: Math.ceil(sampleCourses.length / parseInt(limit))
      },
      message: 'Courses retrieved successfully',
      timestamp: new Date().toISOString()
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
    
    // Sample course detail for students
    const course = {
      id: parseInt(courseId),
      title: 'Advanced Mathematics',
      description: 'Comprehensive course covering advanced mathematical concepts including differential equations, linear algebra, and complex analysis.',
      instructor: 'Dr. John Smith',
      price: 99.99,
      duration: '12 weeks',
      level: 'Advanced',
      category: 'Mathematics',
      thumbnail: '/placeholder.svg',
      rating: 4.8,
      studentsCount: 150,
      status: 'published',
      isEnrolled: false,
      progress: 0,
      modules: [
        {
          id: 1,
          title: 'Introduction to Advanced Mathematics',
          lessons: [
            { id: 1, title: 'Overview of Course', duration: '15 min', type: 'video', isCompleted: false },
            { id: 2, title: 'Mathematical Foundations', duration: '30 min', type: 'video', isCompleted: false }
          ]
        },
        {
          id: 2,
          title: 'Differential Equations',
          lessons: [
            { id: 3, title: 'First Order Equations', duration: '45 min', type: 'video', isCompleted: false },
            { id: 4, title: 'Second Order Equations', duration: '50 min', type: 'video', isCompleted: false }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: course,
      message: 'Course details retrieved successfully',
      timestamp: new Date().toISOString()
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
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        courseId: parseInt(courseId),
        amount: amount || 99.99,
        status: 'completed',
        enrolledAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Course enrolled successfully',
      timestamp: new Date().toISOString()
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
    
    const result = await Book.getAll(page, limit, category, search);
    
    // Add student-specific fields
    const booksWithStudentData = result.data.map(book => ({
      ...book,
      isPurchased: false,
      canPreview: true,
      previewPages: 5
    }));
    
    res.json({
      success: true,
      data: booksWithStudentData,
      pagination: result.pagination,
      message: 'Books retrieved successfully',
      timestamp: new Date().toISOString()
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
    const bookId = parseInt(req.params.id);
    
    const book = await Book.getById(bookId);
    
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
    
    res.json({
      success: true,
      data: bookWithStudentData,
      message: 'Book details retrieved successfully',
      timestamp: new Date().toISOString()
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
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        bookId: parseInt(bookId),
        amount: amount || 49.99,
        status: 'completed',
        purchasedAt: new Date().toISOString(),
        accessExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
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
};

/**
 * Get live classes for students
 */
const getLiveClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Sample live classes data for students
    const sampleLiveClasses = [
      {
        id: 1,
        title: 'Advanced Mathematics Live Session',
        description: 'Interactive live session on advanced mathematical concepts',
        instructor: 'Dr. John Smith',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 120,
        maxStudents: 50,
        currentStudents: 25,
        price: 29.99,
        status: 'upcoming',
        meetingLink: 'https://meet.example.com/advanced-math',
        thumbnail: '/placeholder.svg',
        isEnrolled: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Calculus Problem Solving',
        description: 'Live problem-solving session for calculus students',
        instructor: 'Prof. Jane Doe',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 90,
        maxStudents: 30,
        currentStudents: 18,
        price: 19.99,
        status: 'upcoming',
        meetingLink: 'https://meet.example.com/calculus-problems',
        thumbnail: '/placeholder.svg',
        isEnrolled: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: sampleLiveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sampleLiveClasses.length,
        totalPages: Math.ceil(sampleLiveClasses.length / parseInt(limit))
      },
      message: 'Live classes retrieved successfully',
      timestamp: new Date().toISOString()
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
    
    const liveClass = {
      id: parseInt(classId),
      title: 'Advanced Mathematics Live Session',
      description: 'Interactive live session on advanced mathematical concepts including differential equations and linear algebra.',
      instructor: 'Dr. John Smith',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 120,
      maxStudents: 50,
      currentStudents: 25,
      price: 29.99,
      status: 'upcoming',
      meetingLink: 'https://meet.example.com/advanced-math',
      thumbnail: '/placeholder.svg',
      isEnrolled: false,
      agenda: [
        { time: '0-30 min', topic: 'Introduction and Overview' },
        { time: '30-60 min', topic: 'Differential Equations' },
        { time: '60-90 min', topic: 'Linear Algebra' },
        { time: '90-120 min', topic: 'Q&A Session' }
      ],
      materials: [
        { name: 'Course Notes', url: '/uploads/advanced-math-notes.pdf' },
        { name: 'Practice Problems', url: '/uploads/practice-problems.pdf' }
      ],
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: liveClass,
      message: 'Live class details retrieved successfully',
      timestamp: new Date().toISOString()
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
    
    // Simulate payment processing
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      data: {
        paymentId: paymentId,
        liveClassId: parseInt(classId),
        amount: amount || 29.99,
        status: 'completed',
        enrolledAt: new Date().toISOString(),
        meetingLink: 'https://meet.example.com/advanced-math'
      },
      message: 'Live class enrolled successfully',
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
  markNotificationAsRead
};
