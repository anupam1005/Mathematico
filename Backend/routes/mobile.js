const express = require('express');
const router = express.Router();

// Import authentication middleware
const { authenticateToken } = require('../middlewares/auth');

// Import MongoDB models
let Book, Course, LiveClass;
try {
  Book = require('../models/Book');
  Course = require('../models/Course');
  LiveClass = require('../models/LiveClass');
  console.log('✅ MongoDB models loaded for mobile routes');
} catch (error) {
  console.error('❌ MongoDB models failed to load:', error.message);
}

// Helper function to ensure database connection
const ensureDbConnection = async () => {
  const { ensureDatabaseConnection } = require('../utils/database');
  return await ensureDatabaseConnection();
};

// ============= BOOKS =============

const getAllBooks = async (req, res) => {
  try {
    // Check if models are available
    if (!Book) {
      // Return fallback data for serverless mode
      return res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Advanced Mathematics',
            description: 'Comprehensive guide to advanced mathematical concepts',
            author: 'Dr. John Smith',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x400',
            pdfUrl: 'https://example.com/book1.pdf',
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
            coverImageUrl: 'https://via.placeholder.com/300x400',
            pdfUrl: 'https://example.com/book2.pdf',
            pages: 180,
            isbn: '978-0987654321',
            status: 'published',
            is_featured: false,
            download_count: 89,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      // Return fallback data when database is not connected
      return res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Advanced Mathematics',
            description: 'Comprehensive guide to advanced mathematical concepts',
            author: 'Dr. John Smith',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x400',
            pdfUrl: 'https://example.com/book1.pdf',
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
            coverImageUrl: 'https://via.placeholder.com/300x400',
            pdfUrl: 'https://example.com/book2.pdf',
            pages: 180,
            isbn: '978-0987654321',
            status: 'published',
            is_featured: false,
            download_count: 89,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

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
    
    // Check if models are available
    if (!Book) {
      // Return fallback data for serverless mode
      const fallbackBooks = [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x400',
          pdfUrl: 'https://example.com/book1.pdf',
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
          coverImageUrl: 'https://via.placeholder.com/300x400',
          pdfUrl: 'https://example.com/book2.pdf',
          pages: 180,
          isbn: '978-0987654321',
          status: 'published',
          is_featured: false,
          download_count: 89,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const book = fallbackBooks.find(b => b._id === id);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.json({
        success: true,
        data: book,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      // Return fallback data when database is not connected
      const fallbackBooks = [
        {
          _id: '1',
          title: 'Advanced Mathematics',
          description: 'Comprehensive guide to advanced mathematical concepts',
          author: 'Dr. John Smith',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x400',
          pdfUrl: 'https://example.com/book1.pdf',
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
          coverImageUrl: 'https://via.placeholder.com/300x400',
          pdfUrl: 'https://example.com/book2.pdf',
          pages: 180,
          isbn: '978-0987654321',
          status: 'published',
          is_featured: false,
          download_count: 89,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const book = fallbackBooks.find(b => b._id === id);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.json({
        success: true,
        data: book,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

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
    // Check if models are available
    if (!Course) {
      // Return fallback data for serverless mode
      return res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Linear Algebra Course',
            description: 'Master linear algebra concepts and applications',
            instructor: 'Dr. Sarah Johnson',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            duration: '8 weeks',
            level: 'Intermediate',
            price: 99.99,
            status: 'published',
            is_featured: true,
            enrollment_count: 245,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Statistics Fundamentals',
            description: 'Learn statistical analysis and probability',
            instructor: 'Prof. Michael Brown',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            duration: '6 weeks',
            level: 'Beginner',
            price: 79.99,
            status: 'published',
            is_featured: false,
            enrollment_count: 189,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      // Return fallback data when database is not connected
      return res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Linear Algebra Course',
            description: 'Master linear algebra concepts and applications',
            instructor: 'Dr. Sarah Johnson',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            duration: '8 weeks',
            level: 'Intermediate',
            price: 99.99,
            status: 'published',
            is_featured: true,
            enrollment_count: 245,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Statistics Fundamentals',
            description: 'Learn statistical analysis and probability',
            instructor: 'Prof. Michael Brown',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            duration: '6 weeks',
            level: 'Beginner',
            price: 79.99,
            status: 'published',
            is_featured: false,
            enrollment_count: 189,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

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
    
    // Check if models are available
    if (!Course) {
      // Return fallback data for serverless mode
      const fallbackCourses = [
        {
          _id: '1',
          title: 'Linear Algebra Course',
          description: 'Master linear algebra concepts and applications',
          instructor: 'Dr. Sarah Johnson',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          duration: '8 weeks',
          level: 'Intermediate',
          price: 99.99,
          status: 'published',
          is_featured: true,
          enrollment_count: 245,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Statistics Fundamentals',
          description: 'Learn statistical analysis and probability',
          instructor: 'Prof. Michael Brown',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          duration: '6 weeks',
          level: 'Beginner',
          price: 79.99,
          status: 'published',
          is_featured: false,
          enrollment_count: 189,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const course = fallbackCourses.find(c => c._id === id);
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
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      // Return fallback data when database is not connected
      const fallbackCourses = [
        {
          _id: '1',
          title: 'Linear Algebra Course',
          description: 'Master linear algebra concepts and applications',
          instructor: 'Dr. Sarah Johnson',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          duration: '8 weeks',
          level: 'Intermediate',
          price: 99.99,
          status: 'published',
          is_featured: true,
          enrollment_count: 245,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Statistics Fundamentals',
          description: 'Learn statistical analysis and probability',
          instructor: 'Prof. Michael Brown',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          duration: '6 weeks',
          level: 'Beginner',
          price: 79.99,
          status: 'published',
          is_featured: false,
          enrollment_count: 189,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const course = fallbackCourses.find(c => c._id === id);
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
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

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
    // Check if models are available
    if (!LiveClass) {
      // Return fallback data for serverless mode
      return res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Advanced Calculus Live Session',
            description: 'Interactive live session on advanced calculus topics',
            instructor: 'Dr. Emily Davis',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            duration: 90,
            maxStudents: 50,
            currentStudents: 23,
            status: 'upcoming',
            is_featured: true,
            price: 29.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Geometry Problem Solving',
            description: 'Live problem-solving session for geometry',
            instructor: 'Prof. Robert Wilson',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            duration: 60,
            maxStudents: 30,
            currentStudents: 15,
            status: 'upcoming',
            is_featured: false,
            price: 19.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      // Return fallback data when database is not connected
      return res.json({
        success: true,
        data: [
          {
            _id: '1',
            title: 'Advanced Calculus Live Session',
            description: 'Interactive live session on advanced calculus topics',
            instructor: 'Dr. Emily Davis',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            duration: 90,
            maxStudents: 50,
            currentStudents: 23,
            status: 'upcoming',
            is_featured: true,
            price: 29.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            _id: '2',
            title: 'Geometry Problem Solving',
            description: 'Live problem-solving session for geometry',
            instructor: 'Prof. Robert Wilson',
            category: 'Mathematics',
            coverImageUrl: 'https://via.placeholder.com/300x200',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            duration: 60,
            maxStudents: 30,
            currentStudents: 15,
            status: 'upcoming',
            is_featured: false,
            price: 19.99,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

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
    
    // Check if models are available
    if (!LiveClass) {
      // Return fallback data for serverless mode
      const fallbackLiveClasses = [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Davis',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 90,
          maxStudents: 50,
          currentStudents: 23,
          status: 'upcoming',
          is_featured: true,
          price: 29.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Linear Algebra Workshop',
          description: 'Comprehensive workshop on linear algebra fundamentals',
          instructor: 'Prof. Michael Chen',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          duration: 120,
          maxStudents: 30,
          currentStudents: 18,
          status: 'upcoming',
          is_featured: false,
          price: 39.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const liveClass = fallbackLiveClasses.find(lc => lc._id === id);
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
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Ensure database connection
    const isConnected = await ensureDbConnection();
    if (!isConnected) {
      // Return fallback data when database is not connected
      const fallbackLiveClasses = [
        {
          _id: '1',
          title: 'Advanced Calculus Live Session',
          description: 'Interactive live session on advanced calculus topics',
          instructor: 'Dr. Emily Davis',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 90,
          maxStudents: 50,
          currentStudents: 23,
          status: 'upcoming',
          is_featured: true,
          price: 29.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Linear Algebra Workshop',
          description: 'Comprehensive workshop on linear algebra fundamentals',
          instructor: 'Prof. Michael Chen',
          category: 'Mathematics',
          coverImageUrl: 'https://via.placeholder.com/300x200',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
          duration: 120,
          maxStudents: 30,
          currentStudents: 18,
          status: 'upcoming',
          is_featured: false,
          price: 39.99,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      const liveClass = fallbackLiveClasses.find(lc => lc._id === id);
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
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

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

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  console.log('📱 Mobile health check requested');
  res.json({
    success: true,
    message: 'Mobile API is healthy',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Public content routes (no authentication required for browsing)
router.get('/books', getAllBooks);
router.get('/books/:id', getBookById);
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);
router.get('/live-classes', getAllLiveClasses);
router.get('/live-classes/:id', getLiveClassById);
router.get('/search', searchContent);
router.get('/featured', getFeaturedContent);
router.get('/categories', getCategories);

// Root mobile endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile API is working ✅',
    endpoints: {
      books: '/books',
      courses: '/courses',
      liveClasses: '/live-classes',
      search: '/search',
      featured: '/featured',
      categories: '/categories',
      test: '/test',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Protected routes (authentication required)
// Add any user-specific routes here with authenticateToken middleware

module.exports = router;
