const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const User = require('../models/User');

// Mobile Controller - Handles requests from React Native mobile app

/**
 * Get all courses for mobile app
 */
const getAllCourses = async (req, res) => {
  try {
    // Always use fallback data for serverless mode
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
    
    console.log('📱 Mobile courses endpoint - using fallback data');
    res.json({
      success: true,
      data: fallbackCourses,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: fallbackCourses.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Get mobile courses error:', error);
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
    
    if (!course || course.status !== 'published') {
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
    console.error('Get mobile course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      timestamp: new Date().toISOString()
    });
  }
};

const getAllBooks = async (req, res) => {
  try {
    // Always use fallback data for serverless mode
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('📱 Mobile books endpoint - using fallback data');
    res.json({
      success: true,
      data: fallbackBooks,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: fallbackBooks.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Get mobile books error:', error);
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
    
    if (!book || book.status !== 'published') {
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
    console.error('Get mobile book error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      timestamp: new Date().toISOString()
    });
  }
};

const getAllLiveClasses = async (req, res) => {
  try {
    // Always use fallback data for serverless mode
    const fallbackLiveClasses = [
      {
        _id: '1',
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session on advanced calculus topics',
        instructor: 'Dr. Emily Rodriguez',
        category: 'Mathematics',
        level: 'Advanced',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        duration: 90,
        maxStudents: 50,
        meetingLink: 'https://meet.google.com/advanced-calculus',
        status: 'upcoming',
        is_featured: true,
        enrollment_count: 23,
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
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        duration: 120,
        maxStudents: 30,
        meetingLink: 'https://meet.google.com/diff-eq-workshop',
        status: 'upcoming',
        is_featured: false,
        enrollment_count: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('📱 Mobile live classes endpoint - using fallback data');
    res.json({
      success: true,
      data: fallbackLiveClasses,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: fallbackLiveClasses.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Get mobile live classes error:', error);
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
    console.error('Get mobile live class error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live class',
      timestamp: new Date().toISOString()
    });
  }
};

const search = async (req, res) => {
  try {
    const { q: query, type, page = 1, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    const results = {};
    const searchFilters = { search: query, status: 'published' };
    
    if (!type || type === 'courses') {
      const courses = await Course.getAll(parseInt(page), parseInt(limit), searchFilters);
      results.courses = courses;
    }
    
    if (!type || type === 'books') {
      const books = await Book.getAll(parseInt(page), parseInt(limit), searchFilters);
      results.books = books;
    }
    
    if (!type || type === 'live-classes') {
      const liveClasses = await LiveClass.getAll(parseInt(page), parseInt(limit), { search: query });
      results.liveClasses = liveClasses;
    }

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      timestamp: new Date().toISOString()
    });
  }
};

const getFeaturedContent = async (req, res) => {
  try {
    // Always use fallback data for serverless mode
    const fallbackFeatured = {
      books: [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          level: 'Advanced',
          is_featured: true,
          created_at: new Date().toISOString()
        }
      ],
      courses: [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          instructor: 'Dr. John Smith',
          category: 'Mathematics',
          level: 'Advanced',
          is_featured: true,
          created_at: new Date().toISOString()
        }
      ],
      liveClasses: [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Rodriguez',
          category: 'Mathematics',
          level: 'Advanced',
          scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_featured: true,
          created_at: new Date().toISOString()
        }
      ]
    };
    
    console.log('📱 Mobile featured content endpoint - using fallback data');
    res.json({
      success: true,
      data: fallbackFeatured,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  } catch (error) {
    console.error('Get featured content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured content',
      timestamp: new Date().toISOString()
    });
  }
};

const getAppInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        version: '2.0.0',
        name: 'Mathematico',
        description: 'Your ultimate mathematics learning companion',
        features: [
          'Interactive courses',
          'Digital books',
          'Live classes',
          'Progress tracking'
        ],
        supportEmail: 'support@mathematico.com',
        termsUrl: 'https://mathematico.com/terms',
        privacyUrl: 'https://mathematico.com/privacy'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get app info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch app info',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getAllBooks,
  getBookById,
  getAllLiveClasses,
  getLiveClassById,
  search,
  getFeaturedContent,
  getAppInfo
};