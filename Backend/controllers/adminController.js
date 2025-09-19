// Admin Controller - Handles requests from admin users

/**
 * Get admin dashboard
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
          totalUsers: 150,
          totalCourses: 25,
          totalBooks: 40,
          totalRevenue: 12500.50,
          activeUsers: 120,
          newUsersToday: 5
        },
        recentActivity: [
          {
            id: 1,
            type: 'user_registration',
            message: 'New user registered: john@example.com',
            timestamp: new Date().toISOString()
          },
          {
            id: 2,
            type: 'course_created',
            message: 'New course created: Advanced Mathematics',
            timestamp: new Date().toISOString()
          }
        ]
      },
      message: 'Admin dashboard retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    // Sample users data for admin
    const sampleUsers = [
      {
        id: '2669690d-535a-4a9c-9ea6-173d14523b1f',
        name: 'Test Student',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: sampleUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sampleUsers.length,
        totalPages: Math.ceil(sampleUsers.length / parseInt(limit))
      },
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all courses
 */
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Sample courses data for admin
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
        status: 'published',
        studentsCount: 150,
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
        status: 'published',
        studentsCount: 200,
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
 * Get all books
 */
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    // Sample books data for admin
    const sampleBooks = [
      {
        id: 1,
        title: 'Advanced Calculus Textbook',
        author: 'Dr. John Smith',
        description: 'Comprehensive textbook covering advanced calculus topics',
        price: 49.99,
        category: 'Mathematics',
        pages: 450,
        isbn: '978-1234567890',
        status: 'published',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Linear Algebra Fundamentals',
        author: 'Prof. Jane Doe',
        description: 'Essential guide to linear algebra concepts and applications',
        price: 39.99,
        category: 'Mathematics',
        pages: 320,
        isbn: '978-0987654321',
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: sampleBooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sampleBooks.length,
        totalPages: Math.ceil(sampleBooks.length / parseInt(limit))
      },
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

module.exports = {
  getDashboard,
  getUsers,
  getCourses,
  getBooks
};