// Simple Admin Controller - Handles requests from admin users
const { pool } = require('../database');

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
 * Get all books - Simple version
 */
const getBooks = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Simple query without complex pagination
    const selectQuery = `
      SELECT id, title, author, description, category, pages, isbn, 
             coverImage, pdfUrl, status, isPublished, createdAt, updatedAt
      FROM books 
      ORDER BY createdAt DESC
    `;
    
    const [books] = await connection.execute(selectQuery);
    connection.release();
    
    res.json({
      success: true,
      data: books,
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
 * Get book by ID
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: 'Book retrieved successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create a new book with file uploads
 */
const createBook = async (req, res) => {
  try {
    const { title, author, description, category, pages, isbn, status = 'draft' } = req.body;
    
    // Validate required fields
    if (!title || !author || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, description, and category are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if files were uploaded
    if (!req.files || (!req.files.pdf && !req.files.coverImage)) {
      return res.status(400).json({
        success: false,
        message: 'PDF file and cover image are required',
        timestamp: new Date().toISOString()
      });
    }
    
    const connection = await pool.getConnection();
    
    // Prepare file paths
    const pdfPath = req.files.pdf ? `/uploads/pdfs/${req.files.pdf[0].filename}` : null;
    const coverPath = req.files.coverImage ? `/uploads/covers/${req.files.coverImage[0].filename}` : null;
    
    // Insert book into database
    const insertQuery = `
      INSERT INTO books (title, author, description, category, pages, isbn, 
                        coverImage, pdfUrl, status, isPublished, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const [result] = await connection.execute(insertQuery, [
      title,
      author,
      description,
      category,
      pages ? parseInt(pages) : null,
      isbn || null,
      coverPath,
      pdfPath,
      status,
      status === 'published'
    ]);
    
    const bookId = result.insertId;
    
    // Get the created book
    const [bookRows] = await connection.execute(
      'SELECT * FROM books WHERE id = ?',
      [bookId]
    );
    
    connection.release();
    
    res.status(201).json({
      success: true,
      data: bookRows[0],
      message: 'Book created successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get all users - Simple version
 */
const getUsers = async (req, res) => {
  try {
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
 * Get all courses - Simple version
 */
const getCourses = async (req, res) => {
  try {
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

module.exports = {
  getDashboard,
  getUsers,
  getCourses,
  getBooks,
  getBookById,
  createBook
};
