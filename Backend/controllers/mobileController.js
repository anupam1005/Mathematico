const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');

// Mobile Controller - Handles requests from React Native mobile app

/**
 * Get all courses for mobile app
 */
const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (search) filters.search = search;
    // Only show published courses to normal users
    filters.status = 'published';
    
    const result = await Course.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
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
    const { page = 1, limit = 10, category, search } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (search) filters.search = search;
    // Only show published books to normal users
    filters.status = 'published';
    
    const result = await Book.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
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
    const { page = 1, limit = 10, status, search } = req.query;
    const filters = {};
    
    // Only show published live classes (upcoming, live, completed) - not draft or cancelled
    if (status) {
      filters.status = status;
    } else {
      // By default, show only upcoming and live classes
      filters.statusIn = ['upcoming', 'live'];
    }
    
    if (search) filters.search = search;
    
    const result = await LiveClass.getAll(parseInt(page), parseInt(limit), filters);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
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

const getAppInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        version: '1.0.0',
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
  getAppInfo
};