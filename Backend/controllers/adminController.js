// Admin Controller - Handles requests from admin users
const { pool } = require('../database');

/**
 * Get admin dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const user = req.user;
    
    // Get real stats from database
    const [userStats] = await pool.execute(
      'SELECT COUNT(*) as totalUsers, COUNT(CASE WHEN is_active = 1 THEN 1 END) as activeUsers FROM users'
    );
    
    const [courseStats] = await pool.execute(
      'SELECT COUNT(*) as totalCourses FROM courses'
    );
    
    const [bookStats] = await pool.execute(
      'SELECT COUNT(*) as totalBooks FROM books'
    );
    
    const [revenueStats] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as totalRevenue FROM enrollments WHERE payment_status = "completed"'
    );
    
    // Get recent users
    const [recentUsers] = await pool.execute(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    
    // Get recent courses
    const [recentCourses] = await pool.execute(
      'SELECT id, title, category, created_at FROM courses ORDER BY created_at DESC LIMIT 5'
    );
    
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
          totalUsers: userStats[0]?.totalUsers || 0,
          totalStudents: userStats[0]?.activeUsers || 0,
          totalCourses: courseStats[0]?.totalCourses || 0,
          totalBooks: bookStats[0]?.totalBooks || 0,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          activeBatches: 0, // Placeholder
          totalModules: 0, // Placeholder
          totalLessons: 0 // Placeholder
        },
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        })),
        recentCourses: recentCourses.map(course => ({
          id: course.id,
          title: course.title,
          category: course.category,
          createdAt: course.created_at
        }))
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
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = '1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role && role !== 'all') {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // Get users with pagination
    const [users] = await pool.execute(
      `SELECT id, name, email, role, is_active as isActive, created_at as createdAt, last_login as lastLogin 
       FROM users 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.role === 'admin',
        isActive: user.isActive === 1,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
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
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Sample data for demonstration
    const sampleCourses = [
      {
        id: '1',
        title: 'Complete Mathematics Course',
        description: 'A comprehensive mathematics course covering all major topics from basic algebra to advanced calculus.',
        category: 'Mathematics',
        level: 'Advanced',
        price: 199.99,
        status: 'active',
        students: 456,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Statistics and Data Analysis',
        description: 'Learn statistical methods and data analysis techniques with practical applications.',
        category: 'Statistics',
        level: 'Intermediate',
        price: 149.99,
        status: 'active',
        students: 312,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Geometry Fundamentals',
        description: 'Master the fundamentals of geometry with interactive lessons and practical exercises.',
        category: 'Mathematics',
        level: 'Foundation',
        price: 99.99,
        status: 'active',
        students: 278,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Advanced Calculus',
        description: 'Deep dive into advanced calculus concepts including multivariable calculus and differential equations.',
        category: 'Mathematics',
        level: 'Advanced',
        price: 249.99,
        status: 'active',
        students: 189,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Linear Algebra Mastery',
        description: 'Comprehensive course on linear algebra with applications in computer science and engineering.',
        category: 'Mathematics',
        level: 'Intermediate',
        price: 179.99,
        status: 'active',
        students: 234,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter courses based on search and status
    let filteredCourses = sampleCourses;
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
      );
    }
    
    if (status && status !== 'all') {
      filteredCourses = filteredCourses.filter(course => course.status === status);
    }
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedCourses = filteredCourses.slice(offset, offset + parseInt(limit));
    const total = filteredCourses.length;
    
    res.json({
      success: true,
      data: paginatedCourses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
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
    
    // Sample data for demonstration
    const sampleBooks = [
      {
        id: '1',
        title: 'Advanced Mathematics',
        author: 'Dr. Sarah Wilson',
        description: 'Comprehensive guide to advanced mathematical concepts including calculus, linear algebra, and differential equations.',
        category: 'Mathematics',
        pages: 450,
        isbn: '978-1234567890',
        coverImage: 'https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=Advanced+Math',
        pdfUrl: 'https://example.com/advanced-math.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Basic Algebra Fundamentals',
        author: 'Prof. Robert Brown',
        description: 'Perfect introduction to algebra for beginners. Covers all fundamental concepts with clear explanations and examples.',
        category: 'Mathematics',
        pages: 280,
        isbn: '978-1234567891',
        coverImage: 'https://via.placeholder.com/300x400/10B981/FFFFFF?text=Basic+Algebra',
        pdfUrl: 'https://example.com/basic-algebra.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Statistics and Probability',
        author: 'Dr. Emily Davis',
        description: 'Complete guide to statistics and probability theory with practical applications and real-world examples.',
        category: 'Statistics',
        pages: 320,
        isbn: '978-1234567892',
        coverImage: 'https://via.placeholder.com/300x400/F59E0B/FFFFFF?text=Statistics',
        pdfUrl: 'https://example.com/statistics.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Geometry Mastery',
        author: 'Prof. Michael Chen',
        description: 'Comprehensive geometry textbook covering plane geometry, solid geometry, and coordinate geometry.',
        category: 'Mathematics',
        pages: 380,
        isbn: '978-1234567893',
        coverImage: 'https://via.placeholder.com/300x400/EF4444/FFFFFF?text=Geometry',
        pdfUrl: 'https://example.com/geometry.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Trigonometry Essentials',
        author: 'Dr. Lisa Anderson',
        description: 'Essential trigonometry concepts with step-by-step solutions and practice problems.',
        category: 'Mathematics',
        pages: 250,
        isbn: '978-1234567894',
        coverImage: 'https://via.placeholder.com/300x400/8B5CF6/FFFFFF?text=Trigonometry',
        pdfUrl: 'https://example.com/trigonometry.pdf',
        status: 'active',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Filter books based on search and category
    let filteredBooks = sampleBooks;
    
    if (category) {
      filteredBooks = filteredBooks.filter(book => book.category === category);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBooks = filteredBooks.slice(offset, offset + parseInt(limit));
    const total = filteredBooks.length;
    
    res.json({
      success: true,
      data: paginatedBooks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
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
                        cover_image, pdfUrl, status, isPublished, createdAt, updatedAt)
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
 * Update a book
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, category, pages, isbn, status } = req.body;
    
    const connection = await pool.getConnection();
    
    // Check if book exists
    const [existingBook] = await connection.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );
    
    if (existingBook.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Prepare update data
    const updateFields = [];
    const updateValues = [];
    
    if (title) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (author) {
      updateFields.push('author = ?');
      updateValues.push(author);
    }
    if (description) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (pages) {
      updateFields.push('pages = ?');
      updateValues.push(parseInt(pages));
    }
    if (isbn) {
      updateFields.push('isbn = ?');
      updateValues.push(isbn);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
      updateFields.push('isPublished = ?');
      updateValues.push(status === 'published');
    }
    
    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);
    
    const updateQuery = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await connection.execute(updateQuery, updateValues);
    
    // Get updated book
    const [updatedBook] = await connection.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    res.json({
      success: true,
      data: updatedBook[0],
      message: 'Book updated successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete a book
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    
    // Check if book exists
    const [existingBook] = await connection.execute(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );
    
    if (existingBook.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Book not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const book = existingBook[0];
    
    // Delete book from database
    await connection.execute('DELETE FROM books WHERE id = ?', [id]);
    
    connection.release();
    
    // TODO: Delete associated files from filesystem
    // This would require additional file cleanup logic
    
    res.json({
      success: true,
      message: 'Book deleted successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Additional missing functions

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.execute(
      'SELECT id, name, email, role, is_active as isActive, created_at as createdAt, last_login as lastLogin FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }
    
    const user = users[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.role === 'admin',
        isActive: user.isActive === 1,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isAdmin, isActive } = req.body;
    
    const role = isAdmin ? 'admin' : 'user';
    const activeStatus = isActive ? 1 : 0;
    
    await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, role, activeStatus, id]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const activeStatus = isActive ? 1 : 0;
    
    await pool.execute(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [activeStatus, id]
    );
    
    res.json({
      success: true,
      message: 'User status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
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
    
    const [courses] = await pool.execute(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );
    
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: courses[0],
      message: 'Course retrieved successfully',
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
 * Create course
 */
const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    
    const [result] = await pool.execute(
      `INSERT INTO courses (title, description, category, level, price, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [courseData.title, courseData.description, courseData.category, courseData.level, courseData.price, courseData.status || 'draft']
    );
    
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Course created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update course
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseData = req.body;
    
    await pool.execute(
      `UPDATE courses SET title = ?, description = ?, category = ?, level = ?, price = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [courseData.title, courseData.description, courseData.category, courseData.level, courseData.price, courseData.status, id]
    );
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete course
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Course deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update course status
 */
const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.execute(
      'UPDATE courses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    res.json({
      success: true,
      message: 'Course status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update book status
 */
const updateBookStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isPublished } = req.body;
    
    await pool.execute(
      'UPDATE books SET status = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, isPublished ? 1 : 0, id]
    );
    
    res.json({
      success: true,
      message: 'Book status updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating book status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Placeholder functions for missing endpoints
const getLiveClasses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Sample data for demonstration
    const sampleLiveClasses = [
      {
        id: '1',
        title: 'Advanced Calculus Live Session',
        description: 'Interactive live session covering advanced calculus topics with real-time Q&A.',
        category: 'Mathematics',
        level: 'Advanced',
        duration: 90,
        maxStudents: 50,
        price: 29.99,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/calc-session-1',
        thumbnailUrl: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Calculus+Live',
        status: 'scheduled',
        enrolledStudents: 23,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Statistics Workshop',
        description: 'Hands-on statistics workshop with practical examples and data analysis.',
        category: 'Statistics',
        level: 'Intermediate',
        duration: 120,
        maxStudents: 30,
        price: 24.99,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/stats-workshop-1',
        thumbnailUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Stats+Workshop',
        status: 'scheduled',
        enrolledStudents: 18,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Geometry Problem Solving',
        description: 'Live problem-solving session for geometry with step-by-step solutions.',
        category: 'Mathematics',
        level: 'Intermediate',
        duration: 60,
        maxStudents: 40,
        price: 19.99,
        scheduledAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/geometry-session-1',
        thumbnailUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Geometry+Live',
        status: 'scheduled',
        enrolledStudents: 25,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        title: 'Linear Algebra Masterclass',
        description: 'Comprehensive masterclass on linear algebra concepts and applications.',
        category: 'Mathematics',
        level: 'Advanced',
        duration: 150,
        maxStudents: 25,
        price: 39.99,
        scheduledAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/linear-algebra-masterclass',
        thumbnailUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Linear+Algebra',
        status: 'scheduled',
        enrolledStudents: 15,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Probability Theory Live',
        description: 'Live session on probability theory with real-world applications and examples.',
        category: 'Statistics',
        level: 'Intermediate',
        duration: 75,
        maxStudents: 35,
        price: 22.99,
        scheduledAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        meetingUrl: 'https://meet.example.com/probability-live',
        thumbnailUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Probability',
        status: 'scheduled',
        enrolledStudents: 20,
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter live classes based on search and status
    let filteredLiveClasses = sampleLiveClasses;
    
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredLiveClasses = filteredLiveClasses.filter(liveClass => 
        liveClass.title.toLowerCase().includes(searchTerm) ||
        liveClass.description.toLowerCase().includes(searchTerm)
      );
    }
    
    if (status && status !== 'all') {
      filteredLiveClasses = filteredLiveClasses.filter(liveClass => liveClass.status === status);
    }
    
    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedLiveClasses = filteredLiveClasses.slice(offset, offset + parseInt(limit));
    const total = filteredLiveClasses.length;
    
    res.json({
      success: true,
      data: paginatedLiveClasses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / parseInt(limit))
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

const getLiveClassById = async (req, res) => {
  res.json({ success: true, data: null, message: 'Live class endpoint not implemented yet' });
};

const createLiveClass = async (req, res) => {
  res.json({ success: true, message: 'Live class creation not implemented yet' });
};

const updateLiveClass = async (req, res) => {
  res.json({ success: true, message: 'Live class update not implemented yet' });
};

const deleteLiveClass = async (req, res) => {
  res.json({ success: true, message: 'Live class deletion not implemented yet' });
};

const updateLiveClassStatus = async (req, res) => {
  res.json({ success: true, message: 'Live class status update not implemented yet' });
};

const getEnrollments = async (req, res) => {
  res.json({ success: true, data: [], message: 'Enrollments endpoint not implemented yet' });
};

const getEnrollmentById = async (req, res) => {
  res.json({ success: true, data: null, message: 'Enrollment endpoint not implemented yet' });
};

const updateEnrollmentStatus = async (req, res) => {
  res.json({ success: true, message: 'Enrollment status update not implemented yet' });
};

const getAnalyticsOverview = async (req, res) => {
  res.json({ success: true, data: {}, message: 'Analytics overview not implemented yet' });
};

const getUserAnalytics = async (req, res) => {
  res.json({ success: true, data: {}, message: 'User analytics not implemented yet' });
};

const getCourseAnalytics = async (req, res) => {
  res.json({ success: true, data: {}, message: 'Course analytics not implemented yet' });
};

const getRevenueAnalytics = async (req, res) => {
  res.json({ success: true, data: {}, message: 'Revenue analytics not implemented yet' });
};

const getSettings = async (req, res) => {
  res.json({ 
    success: true, 
    data: {
      site_name: 'Mathematico',
      site_description: 'Learn Mathematics Online',
      contact_email: 'support@mathematico.com',
      maintenance_mode: false,
      allow_registration: true,
      require_email_verification: false,
      max_file_size: 10,
      supported_file_types: 'jpg,jpeg,png,pdf,doc,docx'
    },
    message: 'Settings retrieved successfully' 
  });
};

const updateSettings = async (req, res) => {
  res.json({ success: true, message: 'Settings updated successfully' });
};

const generateUserReport = async (req, res) => {
  res.json({ success: true, data: {}, message: 'User report not implemented yet' });
};

const generateCourseReport = async (req, res) => {
  res.json({ success: true, data: {}, message: 'Course report not implemented yet' });
};

const generateRevenueReport = async (req, res) => {
  res.json({ success: true, data: {}, message: 'Revenue report not implemented yet' });
};

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStatus,
  getLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  updateLiveClassStatus,
  getEnrollments,
  getEnrollmentById,
  updateEnrollmentStatus,
  getAnalyticsOverview,
  getUserAnalytics,
  getCourseAnalytics,
  getRevenueAnalytics,
  getSettings,
  updateSettings,
  generateUserReport,
  generateCourseReport,
  generateRevenueReport
};