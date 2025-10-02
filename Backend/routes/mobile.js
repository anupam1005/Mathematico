const express = require('express');
const router = express.Router();

// Import MongoDB models
let Book, Course, LiveClass;
try {
  Book = require('../models/Book-mongodb');
  Course = require('../models/Course-mongodb');
  LiveClass = require('../models/LiveClass-mongodb');
  console.log('✅ MongoDB models loaded for mobile routes');
} catch (error) {
  console.error('❌ MongoDB models failed to load:', error.message);
}

// ============= BOOKS =============

const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    filters.status = 'published'; // Only show published books to normal users
    
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
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }

    // Increment download count
    await Book.incrementDownloads(id);

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

// ============= COURSES =============

const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    filters.status = 'published'; // Only show published courses to normal users
    
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
    console.error('Get mobile course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= LIVE CLASSES =============

const getAllLiveClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const filters = {};
    if (status) {
      filters.status = status;
    } else {
      filters.statusIn = ['upcoming', 'live']; // Only show upcoming and live classes to normal users
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

// ============= SEARCH =============

const searchContent = async (req, res) => {
  try {
    const { q: query, type, page = 1, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        timestamp: new Date().toISOString()
      });
    }

    const results = {
      books: [],
      courses: [],
      liveClasses: []
    };

    // Search books
    if (!type || type === 'books') {
      try {
        const bookResult = await Book.getAll(parseInt(page), parseInt(limit), {
          search: query,
          status: 'published'
        });
        results.books = bookResult.data;
      } catch (error) {
        console.error('Book search error:', error);
      }
    }

    // Search courses
    if (!type || type === 'courses') {
      try {
        const courseResult = await Course.getAll(parseInt(page), parseInt(limit), {
          search: query,
          status: 'published'
        });
        results.courses = courseResult.data;
      } catch (error) {
        console.error('Course search error:', error);
      }
    }

    // Search live classes
    if (!type || type === 'live-classes') {
      try {
        const liveClassResult = await LiveClass.getAll(parseInt(page), parseInt(limit), {
          search: query,
          statusIn: ['upcoming', 'live']
        });
        results.liveClasses = liveClassResult.data;
      } catch (error) {
        console.error('Live class search error:', error);
      }
    }

    res.json({
      success: true,
      data: results,
      query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search content',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= FEATURED CONTENT =============

const getFeaturedContent = async (req, res) => {
  try {
    const [featuredBooks, featuredCourses, featuredLiveClasses] = await Promise.allSettled([
      Book.getAll(1, 5, { is_featured: true, status: 'published' }).catch(() => ({ data: [] })),
      Course.getAll(1, 5, { is_featured: true, status: 'published' }).catch(() => ({ data: [] })),
      LiveClass.getAll(1, 5, { is_featured: true, statusIn: ['upcoming', 'live'] }).catch(() => ({ data: [] }))
    ]);

    const featuredContent = {
      books: featuredBooks.status === 'fulfilled' ? featuredBooks.value.data : [],
      courses: featuredCourses.status === 'fulfilled' ? featuredCourses.value.data : [],
      liveClasses: featuredLiveClasses.status === 'fulfilled' ? featuredLiveClasses.value.data : []
    };

    res.json({
      success: true,
      data: featuredContent,
      timestamp: new Date().toISOString()
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

// ============= CATEGORIES =============

const getCategories = async (req, res) => {
  try {
    const [bookCategories, courseCategories, liveClassCategories] = await Promise.allSettled([
      Book.distinct('category').catch(() => []),
      Course.distinct('category').catch(() => []),
      LiveClass.distinct('category').catch(() => [])
    ]);

    const categories = {
      books: bookCategories.status === 'fulfilled' ? bookCategories.value.filter(Boolean) : [],
      courses: courseCategories.status === 'fulfilled' ? courseCategories.value.filter(Boolean) : [],
      liveClasses: liveClassCategories.status === 'fulfilled' ? liveClassCategories.value.filter(Boolean) : []
    };

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      timestamp: new Date().toISOString()
    });
  }
};

// ============= ROUTES =============

// Books
router.get('/books', getAllBooks);
router.get('/books/:id', getBookById);

// Courses
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);

// Live Classes
router.get('/live-classes', getAllLiveClasses);
router.get('/live-classes/:id', getLiveClassById);

// Search
router.get('/search', searchContent);

// Featured content
router.get('/featured', getFeaturedContent);

// Categories
router.get('/categories', getCategories);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is healthy',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
