// Admin Controller - Handles admin panel operations (No Database Version)

/**
 * Get dashboard statistics
 */
const getDashboard = async (req, res) => {
  try {
    console.log('📊 Admin dashboard - database disabled');
    
    const dashboardData = {
      totalUsers: 0,
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalRevenue: 0,
      courseStats: { total: 0, published: 0, draft: 0 },
      liveClassStats: { total: 0, upcoming: 0, completed: 0 }
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
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
    console.log('👥 Admin users - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
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
    console.log('👤 Admin user by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'User not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      timestamp: new Date().toISOString()
    });
  }
};

const createUser = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User creation is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const updateUser = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const deleteUser = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'User deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

// ============= BOOK MANAGEMENT =============

const getAllBooks = async (req, res) => {
  try {
    console.log('📚 Admin books - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching books:', error);
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
    console.log('📖 Admin book by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Book not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      timestamp: new Date().toISOString()
    });
  }
};

const createBook = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Book creation is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const updateBook = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Book update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const deleteBook = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Book deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

// ============= COURSE MANAGEMENT =============

const getAllCourses = async (req, res) => {
  try {
    console.log('🎓 Admin courses - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
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
    console.log('📖 Admin course by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Course not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      timestamp: new Date().toISOString()
    });
  }
};

const createCourse = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Course creation is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const updateCourse = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Course update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const deleteCourse = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Course deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

// ============= LIVE CLASS MANAGEMENT =============

const getAllLiveClasses = async (req, res) => {
  try {
    console.log('🎥 Admin live classes - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
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
    console.log('📺 Admin live class by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Live class not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live class',
      timestamp: new Date().toISOString()
    });
  }
};

const createLiveClass = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Live class creation is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const updateLiveClass = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Live class update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

const deleteLiveClass = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Live class deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

// ============= PAYMENT MANAGEMENT =============

const getAllPayments = async (req, res) => {
  try {
    console.log('💳 Admin payments - database disabled');
    
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
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
    console.log('💰 Admin payment by ID - database disabled');
    
    res.status(404).json({
      success: false,
      message: 'Payment not found',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= ADMIN INFO =============

const getAdminInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        adminName: 'Admin User',
        email: process.env.ADMIN_EMAIL || 'admin@mathematico.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        database: 'disabled',
        features: {
          userManagement: false,
          bookManagement: false,
          courseManagement: false,
          liveClassManagement: false,
          paymentManagement: false
        },
        message: 'Database functionality has been removed. Only authentication is available.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin info',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  // Dashboard
  getDashboard,
  
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  
  // Book Management
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  
  // Course Management
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  
  // Live Class Management
  getAllLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  
  // Payment Management
  getAllPayments,
  getPaymentById,
  
  // Admin Info
  getAdminInfo
};