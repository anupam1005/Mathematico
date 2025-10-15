// Mobile Controller - Handles requests from React Native mobile app (No Database Version)

/**
 * Get all courses for mobile app
 */
const getAllCourses = async (req, res) => {
  try {
    // Return empty data since database is disabled
    console.log('📱 Mobile courses endpoint - database disabled');
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString()
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

/**
 * Get all books for mobile app
 */
const getAllBooks = async (req, res) => {
  try {
    // Return empty data since database is disabled
    console.log('📱 Mobile books endpoint - database disabled');
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString()
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

/**
 * Get all live classes for mobile app
 */
const getAllLiveClasses = async (req, res) => {
  try {
    // Return empty data since database is disabled
    console.log('📱 Mobile live classes endpoint - database disabled');
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: 0,
        totalPages: 0
      },
      timestamp: new Date().toISOString()
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

/**
 * Get featured content for mobile app
 */
const getFeaturedContent = async (req, res) => {
  try {
    // Return empty data since database is disabled
    console.log('📱 Mobile featured content endpoint - database disabled');
    res.json({
      success: true,
      data: {
        books: [],
        courses: [],
        liveClasses: []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching featured content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get course by ID
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📱 Mobile course by ID endpoint - database disabled');
    
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

/**
 * Get book by ID
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📱 Mobile book by ID endpoint - database disabled');
    
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

/**
 * Get live class by ID
 */
const getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📱 Mobile live class by ID endpoint - database disabled');
    
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

/**
 * Get categories
 */
const getCategories = async (req, res) => {
  try {
    // Return empty categories since database is disabled
    console.log('📱 Mobile categories endpoint - database disabled');
    res.json({
      success: true,
      data: {
        books: [],
        courses: [],
        liveClasses: []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Search content
 */
const searchContent = async (req, res) => {
  try {
    const { query, type } = req.query;
    console.log('📱 Mobile search endpoint - database disabled');
    
    res.json({
      success: true,
      data: [],
      query: query,
      type: type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search content',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get mobile app info
 */
const getMobileInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        appName: 'Mathematico',
        version: '2.0.0',
        database: 'disabled',
        features: {
          books: false,
          courses: false,
          liveClasses: false,
          userRegistration: false,
          userProfiles: false
        },
        message: 'Database functionality has been removed. Only admin authentication is available.'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting mobile info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mobile info',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllCourses,
  getAllBooks,
  getAllLiveClasses,
  getFeaturedContent,
  getCourseById,
  getBookById,
  getLiveClassById,
  getCategories,
  searchContent,
  getMobileInfo
};