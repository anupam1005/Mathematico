const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
  port: process.env.DB_PORT || 46878,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'hSuamHEZBJuyqLSJkHUbAPTdIoyeTXIN',
  database: process.env.DB_DATABASE || 'railway',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

let dbInitialized = false;

// Initialize database
async function initializeDatabase() {
  if (dbInitialized) return true;
  
  try {
    console.log('Initializing database...');
    
    // Create tables if they don't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255) NULL,
        avatar_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        last_login DATETIME,
        login_attempts INT DEFAULT 0,
        lock_until DATETIME NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        role ENUM('user', 'admin', 'instructor') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`email\` (\`email\`),
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_is_active\` (\`is_active\`),
        INDEX \`idx_users_email_verified\` (\`email_verified\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        pages INT,
        isbn VARCHAR(20),
        cover_image VARCHAR(255),
        pdf_url VARCHAR(255),
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_books_status\` (\`status\`),
        INDEX \`idx_books_category\` (\`category\`),
        INDEX \`idx_books_is_published\` (\`is_published\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        category VARCHAR(100),
        level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
        price DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
        is_published BOOLEAN DEFAULT FALSE,
        students INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_courses_status\` (\`status\`),
        INDEX \`idx_courses_category\` (\`category\`),
        INDEX \`idx_courses_is_published\` (\`is_published\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS live_classes (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
        duration INT DEFAULT 60,
        max_students INT DEFAULT 50,
        price DECIMAL(10,2) DEFAULT 0.00,
        scheduled_at DATETIME,
        meeting_url VARCHAR(255),
        thumbnail_url VARCHAR(255),
        status ENUM('scheduled', 'live', 'completed', 'cancelled') DEFAULT 'scheduled',
        enrolled_students INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_live_classes_status\` (\`status\`),
        INDEX \`idx_live_classes_category\` (\`category\`),
        INDEX \`idx_live_classes_scheduled_at\` (\`scheduled_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        course_id VARCHAR(36),
        live_class_id VARCHAR(36),
        payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        amount DECIMAL(10,2) DEFAULT 0.00,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (live_class_id) REFERENCES live_classes(id) ON DELETE CASCADE,
        INDEX \`idx_enrollments_user_id\` (\`user_id\`),
        INDEX \`idx_enrollments_course_id\` (\`course_id\`),
        INDEX \`idx_enrollments_live_class_id\` (\`live_class_id\`),
        INDEX \`idx_enrollments_payment_status\` (\`payment_status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables created/verified successfully');
    dbInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    dbInitialized = false;
    return false;
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mathematico Backend API - Empty Database Version',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is healthy',
    timestamp: new Date().toISOString()
  });
});

// Auth login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if it's the hardcoded admin user
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
      const userPayload = {
        id: 1,
        email: email,
        name: 'Admin User',
        isAdmin: true,
        is_admin: true,
        role: 'admin',
        email_verified: true,
        is_active: true
      };
      
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
      const refreshToken = jwt.sign({ id: userPayload.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          tokens: {
            accessToken: token,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin dashboard endpoint
app.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    await initializeDatabase();
    
    let stats = {
      totalUsers: 0,
      totalBooks: 0,
      totalCourses: 0,
      totalLiveClasses: 0,
      totalRevenue: 0
    };

    if (dbInitialized) {
      try {
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [bookCount] = await pool.execute('SELECT COUNT(*) as count FROM books');
        const [courseCount] = await pool.execute('SELECT COUNT(*) as count FROM courses');
        const [liveClassCount] = await pool.execute('SELECT COUNT(*) as count FROM live_classes');
        
        stats = {
          totalUsers: userCount[0].count,
          totalBooks: bookCount[0].count,
          totalCourses: courseCount[0].count,
          totalLiveClasses: liveClassCount[0].count,
          totalRevenue: 0
        };
      } catch (dbError) {
        console.error('Database stats error:', dbError);
      }
    }

    res.json({
      success: true,
      data: {
        stats: stats,
        recentActivity: []
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
});

// Admin books endpoint
app.get('/api/v1/admin/books', async (req, res) => {
  try {
    await initializeDatabase();
    
    let books = [];

    if (dbInitialized) {
      try {
        const [booksResult] = await pool.execute(
          'SELECT * FROM books ORDER BY created_at DESC'
        );
        books = booksResult;
        
        // If no books in database, provide sample data
        if (books.length === 0) {
          books = [
            {
              id: 1,
              title: 'Advanced Mathematics',
              author: 'Dr. John Smith',
              description: 'Comprehensive guide to advanced mathematical concepts',
              category: 'Mathematics',
              pages: 450,
              isbn: '978-1234567890',
              status: 'published',
              is_published: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              title: 'Physics Fundamentals',
              author: 'Prof. Jane Doe',
              description: 'Essential physics concepts for beginners',
              category: 'Physics',
              pages: 300,
              isbn: '978-1234567891',
              status: 'draft',
              is_published: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 3,
              title: 'Chemistry Basics',
              author: 'Dr. Mike Johnson',
              description: 'Introduction to chemical principles',
              category: 'Chemistry',
              pages: 250,
              isbn: '978-1234567892',
              status: 'published',
              is_published: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
        }
      } catch (dbError) {
        console.error('Database admin books error:', dbError);
        // Fallback to sample data if database fails
        books = [
          {
            id: 1,
            title: 'Advanced Mathematics',
            author: 'Dr. John Smith',
            description: 'Comprehensive guide to advanced mathematical concepts',
            category: 'Mathematics',
            pages: 450,
            isbn: '978-1234567890',
            status: 'published',
            is_published: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Physics Fundamentals',
            author: 'Prof. Jane Doe',
            description: 'Essential physics concepts for beginners',
            category: 'Physics',
            pages: 300,
            isbn: '978-1234567891',
            status: 'draft',
            is_published: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 3,
            title: 'Chemistry Basics',
            author: 'Dr. Mike Johnson',
            description: 'Introduction to chemical principles',
            category: 'Chemistry',
            pages: 250,
            isbn: '978-1234567892',
            status: 'published',
            is_published: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
    } else {
      // Fallback to sample data if database not initialized
      books = [
        {
          id: 1,
          title: 'Advanced Mathematics',
          author: 'Dr. John Smith',
          description: 'Comprehensive guide to advanced mathematical concepts',
          category: 'Mathematics',
          pages: 450,
          isbn: '978-1234567890',
          status: 'published',
          is_published: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Physics Fundamentals',
          author: 'Prof. Jane Doe',
          description: 'Essential physics concepts for beginners',
          category: 'Physics',
          pages: 300,
          isbn: '978-1234567891',
          status: 'draft',
          is_published: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Chemistry Basics',
          author: 'Dr. Mike Johnson',
          description: 'Introduction to chemical principles',
          category: 'Chemistry',
          pages: 250,
          isbn: '978-1234567892',
          status: 'published',
          is_published: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    res.json({
      success: true,
      data: books,
      message: 'Admin books retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin books',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create book endpoint
app.post('/api/v1/admin/books', async (req, res) => {
  try {
    await initializeDatabase();
    const { title, author, description, category, pages, isbn, status = 'draft' } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Title and author are required',
        timestamp: new Date().toISOString()
      });
    }

    if (dbInitialized) {
      try {
        const [result] = await pool.execute(
          'INSERT INTO books (title, author, description, category, pages, isbn, status, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [title, author, description, category, pages, isbn, status, status === 'published' ? 1 : 0]
        );
        
        const newBook = {
          id: result.insertId,
          title,
          author,
          description,
          category,
          pages,
          isbn,
          status,
          is_published: status === 'published' ? 1 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        res.json({
          success: true,
          data: newBook,
          message: 'Book created successfully',
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database create book error:', dbError);
        res.status(500).json({
          success: false,
          message: 'Failed to create book',
          error: dbError.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update book endpoint
app.put('/api/v1/admin/books/:id', async (req, res) => {
  try {
    await initializeDatabase();
    const { id } = req.params;
    const { title, author, description, category, pages, isbn, status } = req.body;
    
    if (dbInitialized) {
      try {
        const [result] = await pool.execute(
          'UPDATE books SET title = ?, author = ?, description = ?, category = ?, pages = ?, isbn = ?, status = ?, is_published = ?, updated_at = NOW() WHERE id = ?',
          [title, author, description, category, pages, isbn, status, status === 'published' ? 1 : 0, id]
        );
        
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Book not found',
            timestamp: new Date().toISOString()
          });
        }

        const [updatedBook] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
        
        res.json({
          success: true,
          data: updatedBook[0],
          message: 'Book updated successfully',
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database update book error:', dbError);
        res.status(500).json({
          success: false,
          message: 'Failed to update book',
          error: dbError.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Delete book endpoint
app.delete('/api/v1/admin/books/:id', async (req, res) => {
  try {
    await initializeDatabase();
    const { id } = req.params;
    
    if (dbInitialized) {
      try {
        const [result] = await pool.execute('DELETE FROM books WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Book not found',
            timestamp: new Date().toISOString()
          });
        }

        res.json({
          success: true,
          message: 'Book deleted successfully',
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database delete book error:', dbError);
        res.status(500).json({
          success: false,
          message: 'Failed to delete book',
          error: dbError.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Toggle book publish status endpoint
app.put('/api/v1/admin/books/:id/toggle-publish', async (req, res) => {
  try {
    await initializeDatabase();
    const { id } = req.params;
    const { isPublished } = req.body;
    
    if (dbInitialized) {
      try {
        const [result] = await pool.execute(
          'UPDATE books SET is_published = ?, status = ?, updated_at = NOW() WHERE id = ?',
          [isPublished ? 1 : 0, isPublished ? 'published' : 'draft', id]
        );
        
        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            message: 'Book not found',
            timestamp: new Date().toISOString()
          });
        }

        const [updatedBook] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
        
        res.json({
          success: true,
          data: updatedBook[0],
          message: `Book ${isPublished ? 'published' : 'unpublished'} successfully`,
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('Database toggle publish error:', dbError);
        res.status(500).json({
          success: false,
          message: 'Failed to toggle book status',
          error: dbError.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Database not available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error toggling book status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle book status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin courses endpoint
app.get('/api/v1/admin/courses', async (req, res) => {
  try {
    await initializeDatabase();
    
    let courses = [];

    if (dbInitialized) {
      try {
        const [coursesResult] = await pool.execute(
          'SELECT * FROM courses ORDER BY created_at DESC'
        );
        courses = coursesResult;
      } catch (dbError) {
        console.error('Database admin courses error:', dbError);
      }
    }

    res.json({
      success: true,
      data: courses,
      message: 'Admin courses retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin courses',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin live classes endpoint
app.get('/api/v1/admin/live-classes', async (req, res) => {
  try {
    await initializeDatabase();
    
    let liveClasses = [];

    if (dbInitialized) {
      try {
        const [liveClassesResult] = await pool.execute(
          'SELECT * FROM live_classes ORDER BY created_at DESC'
        );
        liveClasses = liveClassesResult;
      } catch (dbError) {
        console.error('Database admin live classes error:', dbError);
      }
    }

    res.json({
      success: true,
      data: liveClasses,
      message: 'Admin live classes retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting admin live classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin live classes',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// User books endpoint
app.get('/api/v1/books', async (req, res) => {
  try {
    await initializeDatabase();
    
    let books = [];

    if (dbInitialized) {
      try {
        const [booksResult] = await pool.execute(
          'SELECT * FROM books WHERE is_published = 1 ORDER BY created_at DESC'
        );
        books = booksResult;
      } catch (dbError) {
        console.error('Database user books error:', dbError);
      }
    }

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
});

// User courses endpoint
app.get('/api/v1/courses', async (req, res) => {
  try {
    await initializeDatabase();
    
    let courses = [];

    if (dbInitialized) {
      try {
        const [coursesResult] = await pool.execute(
          'SELECT * FROM courses WHERE is_published = 1 ORDER BY created_at DESC'
        );
        courses = coursesResult;
      } catch (dbError) {
        console.error('Database user courses error:', dbError);
      }
    }

    res.json({
      success: true,
      data: courses,
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
});

// User live classes endpoint
app.get('/api/v1/live-classes', async (req, res) => {
  try {
    await initializeDatabase();
    
    let liveClasses = [];

    if (dbInitialized) {
      try {
        const [liveClassesResult] = await pool.execute(
          'SELECT * FROM live_classes WHERE status IN ("scheduled", "live") ORDER BY created_at DESC'
        );
        liveClasses = liveClassesResult;
      } catch (dbError) {
        console.error('Database user live classes error:', dbError);
      }
    }

    res.json({
      success: true,
      data: liveClasses,
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
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
