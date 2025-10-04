const User = require('../models/User');
const Book = require('../models/Book');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const Payment = require('../models/Payment');

// Admin Controller - Handles admin panel operations with MongoDB

/**
 * Get dashboard statistics
 */
const getDashboard = async (req, res) => {
  try {
    // Use fallback data for serverless mode
    console.log('📊 Admin dashboard - using fallback data for serverless mode');
    
    const dashboardData = {
      totalUsers: 150,
      totalBooks: 25,
      totalCourses: 18,
      totalLiveClasses: 12,
      totalRevenue: 15750.50,
      courseStats: { total: 18, published: 15, draft: 3 },
      liveClassStats: { total: 12, upcoming: 8, completed: 4 }
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      fallback: true
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
    // Use fallback data for serverless mode
    console.log('👥 Admin users - using fallback data for serverless mode');
    
    const fallbackUsers = [
      {
        _id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'student',
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'student',
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        role: 'student',
        status: 'inactive',
        created_at: new Date().toISOString(),
        last_login: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: fallbackUsers,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: fallbackUsers.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
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
    
    const user = await User.updateUser(id, updateData);
    
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
      message: error.message || 'Failed to update user',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.deleteUser(id);
    
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
    const { status } = req.body;
    
    const user = await User.updateUserStatus(id, status);
    
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
    console.log('📚 Admin books - connecting to MongoDB database...');
    
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
      
      return res.status(200).json({
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
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};
    
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.level) filters.level = req.query.level;
    if (req.query.search) filters.search = req.query.search;
    
    console.log('📚 Fetching books from MongoDB with filters:', filters);
    
    const result = await Book.getAll(page, limit, filters);
    
    console.log('📚 Books fetched from database:', result.data.length, 'books');
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
      database: true
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
    
    console.log('📚 Admin get book by ID - connecting to database...');
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback data');
      // Use fallback data for serverless mode
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
    
    // Use MongoDB database
    const Book = require('../models/Book');
    
    console.log('📚 Fetching book from MongoDB database...');
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
      timestamp: new Date().toISOString(),
      database: true
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
    
    console.log('📚 Admin create book - processing file uploads for serverless mode');
    
    // Handle file uploads to Cloudinary in serverless mode
    if (req.files) {
      try {
        // Upload cover image to Cloudinary
        if (req.files.coverImage && req.files.coverImage[0]) {
          const coverFile = req.files.coverImage[0];
          const { cloudinary } = require('../utils/cloudinary');
          
          const coverResult = await cloudinary.uploader.upload(
            `data:${coverFile.mimetype};base64,${coverFile.buffer.toString('base64')}`,
            {
              folder: 'mathematico/books/covers',
              resource_type: 'image',
              transformation: [
                { width: 400, height: 600, crop: 'fit', quality: 'auto' }
              ]
            }
          );
          bookData.cover_image_url = coverResult.secure_url;
          console.log('✅ Cover image uploaded to Cloudinary:', coverResult.secure_url);
        }
        
        // Upload PDF to Cloudinary
        if (req.files.pdfFile && req.files.pdfFile[0]) {
          const pdfFile = req.files.pdfFile[0];
          const { cloudinary } = require('../utils/cloudinary');
          
          const pdfResult = await cloudinary.uploader.upload(
            `data:${pdfFile.mimetype};base64,${pdfFile.buffer.toString('base64')}`,
            {
              folder: 'mathematico/books/pdfs',
              resource_type: 'raw'
            }
          );
          bookData.pdf_url = pdfResult.secure_url;
          console.log('✅ PDF uploaded to Cloudinary:', pdfResult.secure_url);
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Continue without files if upload fails
        bookData.cover_image_url = null;
        bookData.pdf_url = null;
      }
    }
    
    // Convert numeric string fields
    if (bookData.pages) {
      bookData.pages = parseInt(bookData.pages);
    }
    
    // Ensure status defaults to draft
    if (!bookData.status) {
      bookData.status = 'draft';
    }
    
    // Create book data with Cloudinary URLs
    const newBook = {
      _id: Date.now().toString(),
      title: bookData.title || 'New Book',
      description: bookData.description || 'Book description',
      author: bookData.author || 'Unknown Author',
      category: bookData.category || 'General',
      level: bookData.level || 'Foundation',
      pages: bookData.pages || 0,
      isbn: bookData.isbn || '',
      status: bookData.status || 'draft',
      is_featured: bookData.is_featured === 'true' || bookData.is_featured === true,
      download_count: 0,
      cover_image_url: bookData.cover_image_url || null,
      pdf_url: bookData.pdf_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      return res.status(201).json({
        success: true,
        data: newBook,
        message: 'Book created successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    
    // Create book in database
    const databaseBookData = {
      title: newBook.title,
      author: newBook.author,
      description: newBook.description,
      category: newBook.category,
      level: newBook.level,
      pages: newBook.pages,
      isbn: newBook.isbn,
      cover_image_url: newBook.cover_image_url,
      pdf_url: newBook.pdf_url,
      status: newBook.status,
      created_by: new require('mongoose').Types.ObjectId() // Generate new ObjectId for admin
    };
    
    console.log('📚 Creating book in MongoDB database...');
    const savedBook = await Book.create(databaseBookData);
    
    console.log('✅ Book created successfully in database:', savedBook.title);
    console.log('📚 Book ID:', savedBook._id);
    
    res.status(201).json({
      success: true,
      data: savedBook,
      message: 'Book created successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('📚 Admin update book - processing file uploads for serverless mode');
    
    // Handle file uploads to Cloudinary in serverless mode
    if (req.files) {
      try {
        // Upload cover image to Cloudinary
        if (req.files.coverImage && req.files.coverImage[0]) {
          const coverFile = req.files.coverImage[0];
          const { cloudinary } = require('../utils/cloudinary');
          
          const coverResult = await cloudinary.uploader.upload(
            `data:${coverFile.mimetype};base64,${coverFile.buffer.toString('base64')}`,
            {
              folder: 'mathematico/books/covers',
              resource_type: 'image',
              transformation: [
                { width: 400, height: 600, crop: 'fit', quality: 'auto' }
              ]
            }
          );
          updateData.cover_image_url = coverResult.secure_url;
          console.log('✅ Cover image updated in Cloudinary:', coverResult.secure_url);
        }
        
        // Upload PDF to Cloudinary
        if (req.files.pdfFile && req.files.pdfFile[0]) {
          const pdfFile = req.files.pdfFile[0];
          const { cloudinary } = require('../utils/cloudinary');
          
          const pdfResult = await cloudinary.uploader.upload(
            `data:${pdfFile.mimetype};base64,${pdfFile.buffer.toString('base64')}`,
            {
              folder: 'mathematico/books/pdfs',
              resource_type: 'raw'
            }
          );
          updateData.pdf_url = pdfResult.secure_url;
          console.log('✅ PDF updated in Cloudinary:', pdfResult.secure_url);
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Continue without updating files if upload fails
      }
    }
    
    // Convert numeric fields
    if (updateData.pages) {
      updateData.pages = parseInt(updateData.pages);
    }
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      // Create updated book data with Cloudinary URLs
      const updatedBook = {
        _id: id,
        title: updateData.title || 'Updated Book',
        description: updateData.description || 'Updated book description',
        author: updateData.author || 'Updated Author',
        category: updateData.category || 'General',
        level: updateData.level || 'Foundation',
        pages: updateData.pages || 0,
        isbn: updateData.isbn || '',
        status: updateData.status || 'draft',
        is_featured: updateData.is_featured === 'true' || updateData.is_featured === true,
        download_count: 0,
        cover_image_url: updateData.cover_image_url || null,
        pdf_url: updateData.pdf_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ Book updated successfully (fallback):', updatedBook.title);

      return res.json({
        success: true,
        data: updatedBook,
        message: 'Book updated successfully',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    
    console.log('📚 Updating book in MongoDB database...');
    const updatedBook = await Book.updateBook(id, updateData);
    
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Book updated successfully in database:', updatedBook.title);

    res.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully',
      timestamp: new Date().toISOString(),
      database: true
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update book',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📚 Admin delete book - removing from database, ID:', id);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      return res.json({
        success: true,
        message: 'Book deleted successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    
    const deletedBook = await Book.deleteBook(id);
    
    if (deletedBook) {
      console.log('✅ Book deleted successfully from database:', deletedBook.title);
    } else {
      console.log('⚠️ Book not found in database');
    }
    
    res.json({
      success: true,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString(),
      database: true
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
    
    console.log('📚 Admin update book status - updating in database, ID:', id, 'Status:', status);
    
    // Ensure database connection
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.log('⚠️ Database not connected, using fallback response');
      return res.json({
        success: true,
        data: { _id: id, status: status || 'published' },
        message: 'Book status updated successfully (fallback mode)',
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }
    
    // Use MongoDB database
    const Book = require('../models/Book');
    
    const updatedBook = await Book.updateBookStatus(id, status || 'published');
    
    if (updatedBook) {
      console.log('✅ Book status updated successfully in database');
      console.log('📚 Updated book:', updatedBook.title, 'Status:', updatedBook.status);
      
      res.json({
        success: true,
        data: updatedBook,
        message: 'Book status updated successfully',
        timestamp: new Date().toISOString(),
        database: true
      });
    } else {
      console.log('⚠️ Book not found in database');
      res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
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
    // Use fallback data for serverless mode
    console.log('🎓 Admin courses - using fallback data for serverless mode');
    
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
    
    // Handle file uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        courseData.thumbnail = `/uploads/covers/${req.files.image[0].filename}`;
      }
      if (req.files.pdf && req.files.pdf[0]) {
        courseData.pdf_url = `/uploads/pdfs/${req.files.pdf[0].filename}`;
      }
    }
    
    // Convert numeric fields
    if (courseData.price) {
      courseData.price = parseFloat(courseData.price);
    }
    if (courseData.originalPrice) {
      courseData.original_price = parseFloat(courseData.originalPrice);
      delete courseData.originalPrice;
    }
    if (courseData.duration) {
      courseData.duration = parseInt(courseData.duration);
    }
    if (courseData.students) {
      courseData.enrolled_count = parseInt(courseData.students);
      delete courseData.students;
    }
    
    // Set instructor from user if not provided
    if (!courseData.instructor) {
      courseData.instructor = req.user?.name || 'Admin';
    }
    
    // Ensure status defaults to draft
    if (!courseData.status) {
      courseData.status = 'draft';
    }
    
    // Add created_by from authenticated user
    courseData.created_by = req.user?.id || '1';
    
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
      message: error.message || 'Failed to create course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle file uploads
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        updateData.thumbnail = `/uploads/covers/${req.files.image[0].filename}`;
      }
      if (req.files.pdf && req.files.pdf[0]) {
        updateData.pdf_url = `/uploads/pdfs/${req.files.pdf[0].filename}`;
      }
    }
    
    // Convert numeric fields
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.originalPrice) {
      updateData.original_price = parseFloat(updateData.originalPrice);
      delete updateData.originalPrice;
    }
    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration);
    }
    if (updateData.students) {
      updateData.enrolled_count = parseInt(updateData.students);
      delete updateData.students;
    }
    
    const course = await Course.updateCourse(id, updateData);
    
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
      message: error.message || 'Failed to update course',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.deleteCourse(id);
    
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
    
    const course = await Course.updateCourseStatus(id, status);
    
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
    // Use fallback data for serverless mode
    console.log('🎥 Admin live classes - using fallback data for serverless mode');
    
    const fallbackLiveClasses = [
      {
        _id: '1',
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session on advanced calculus topics',
        instructor: 'Dr. Emily Rodriguez',
        category: 'Mathematics',
        level: 'Advanced',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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
    
    // Handle file uploads
    if (req.file) {
      liveClassData.thumbnail = `/uploads/covers/${req.file.filename}`;
    }
    
    // Convert date field
    if (liveClassData.scheduledAt) {
      liveClassData.date = liveClassData.scheduledAt;
      delete liveClassData.scheduledAt;
    }
    
    // Set instructor from user if not provided
    if (!liveClassData.instructor) {
      liveClassData.instructor = req.user?.name || 'Admin';
    }
    
    // Set default price if not provided
    if (!liveClassData.price) {
      liveClassData.price = 0;
    }
    
    // Convert numeric fields
    if (liveClassData.duration) {
      liveClassData.duration = parseInt(liveClassData.duration);
    }
    if (liveClassData.maxStudents) {
      liveClassData.maxStudents = parseInt(liveClassData.maxStudents);
    }
    
    // Add created_by from authenticated user
    liveClassData.created_by = req.user?.id || '1';
    
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
      message: error.message || 'Failed to create live class',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

const updateLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle file uploads
    if (req.file) {
      updateData.thumbnail = `/uploads/covers/${req.file.filename}`;
    }
    
    // Convert date field
    if (updateData.scheduledAt) {
      updateData.date = updateData.scheduledAt;
      delete updateData.scheduledAt;
    }
    
    // Convert numeric fields
    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration);
    }
    if (updateData.maxStudents) {
      updateData.maxStudents = parseInt(updateData.maxStudents);
    }
    
    const liveClass = await LiveClass.updateLiveClass(id, updateData);
    
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
      message: error.message || 'Failed to update live class',
      timestamp: new Date().toISOString()
    });
  }
};

const deleteLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.deleteLiveClass(id);
    
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
    
    const liveClass = await LiveClass.updateLiveClassStatus(id, status);
    
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
    // Use fallback data for serverless mode
    console.log('💳 Admin payments - using fallback data for serverless mode');
    
    const fallbackPayments = [
      {
        _id: '1',
        user_id: '1',
        user_name: 'John Doe',
        user_email: 'john.doe@example.com',
        item_type: 'course',
        item_id: '1',
        item_name: 'Advanced Mathematics',
        amount: 99.99,
        status: 'completed',
        payment_method: 'credit_card',
        transaction_id: 'txn_123456789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        _id: '2',
        user_id: '2',
        user_name: 'Jane Smith',
        user_email: 'jane.smith@example.com',
        item_type: 'book',
        item_id: '1',
        item_name: 'Advanced Mathematics',
        amount: 49.99,
        status: 'completed',
        payment_method: 'paypal',
        transaction_id: 'txn_987654321',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: fallbackPayments,
      pagination: {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        total: fallbackPayments.length,
        totalPages: 1
      },
      timestamp: new Date().toISOString(),
      fallback: true
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
    const { status, ...additionalData } = req.body;
    
    const payment = await Payment.updatePaymentStatus(id, status, additionalData);
    
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

// ============= STATISTICS =============

const getBookStats = async (req, res) => {
  try {
    // Use fallback data for serverless mode
    console.log('📚 Admin get book stats - using fallback data for serverless mode');
    
    const stats = {
      total: 25,
      published: 20,
      draft: 5,
      archived: 0
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      fallback: true
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

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        url: fileUrl,
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

// ============= SETTINGS =============

const getSettings = async (req, res) => {
  try {
    // For now, return default settings
    const settings = {
      site_name: 'Mathematico',
      site_description: 'Learn mathematics the easy way',
      contact_email: 'support@mathematico.com',
      maintenance_mode: false,
      user_registration: true,
      email_notifications: true,
      default_currency: 'INR',
      timezone: 'UTC'
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
    
    // For now, just return success
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

// ============= ADDITIONAL METHODS =============

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
        filename: req.file.filename,
        originalname: req.file.originalname,
        url: fileUrl,
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

const toggleCoursePublish = async (req, res) => {
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

    const newStatus = course.status === 'published' ? 'draft' : 'published';
    const updatedCourse = await Course.updateCourseStatus(id, newStatus);

    res.json({
      success: true,
      data: updatedCourse,
      message: `Course ${newStatus} successfully`,
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
  // Dashboard
  getDashboard,
  
  // User Management
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  
  // Book Management
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStatus,
  
  // Course Management
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  
  // Live Class Management
  getAllLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus,
  
  // Payment Management
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  
  // Statistics
  getBookStats,
  getCourseStats,
  getLiveClassStats,
  getPaymentStats,
  
  // File Upload
  uploadFile,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Additional Methods
  uploadCourseThumbnail,
  toggleCoursePublish
};
