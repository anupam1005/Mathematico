const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration with Railway credentials
const dbConfig = {
  host: process.env.DB_HOST || 'hopper.proxy.rlwy.net',
  port: parseInt(process.env.DB_PORT) || 46878,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'hSuamHEZBJuyqLSJkHUbAPTdIoyeTXIN',
  database: process.env.DB_DATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: {
    rejectUnauthorized: false
  }
};

// Lazy database connection
let pool;

const getPool = () => {
  if (!pool) {
    console.log('Database Config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      ssl: dbConfig.ssl ? 'enabled' : 'disabled'
    });
    
    // Create connection pool
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Test database connection
async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    console.log('✅ Database connected successfully');
    console.log('Database:', dbConfig.database);
    console.log('Host:', dbConfig.host);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Fallback in-memory data store
let fallbackBooks = [
  {
    id: 1,
    title: 'Advanced Calculus Textbook',
    author: 'Dr. John Smith',
    description: 'Comprehensive textbook covering advanced calculus topics',
    category: 'Mathematics',
    pages: 450,
    isbn: '978-1234567890',
    coverImage: '/placeholder.svg',
    pdfUrl: '/uploads/advanced-calculus.pdf',
    status: 'published',
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Linear Algebra Fundamentals',
    author: 'Prof. Jane Doe',
    description: 'Essential guide to linear algebra concepts and applications',
    category: 'Mathematics',
    pages: 320,
    isbn: '978-0987654321',
    coverImage: '/placeholder.svg',
    pdfUrl: '/uploads/linear-algebra.pdf',
    status: 'published',
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextFallbackId = 3;

// Create users table if it doesn't exist
async function createUsersTable() {
  try {
    const connection = await getPool().getConnection();
    
    const createTableQuery = `
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
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Users table created/verified successfully');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error creating users table:', error.message);
    return false;
  }
}

// Create books table if it doesn't exist
async function createBooksTable() {
  try {
    const connection = await getPool().getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        level VARCHAR(50),
        pages INT,
        isbn VARCHAR(20),
        cover_image_url VARCHAR(500),
        pdf_url VARCHAR(500),
        status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    
    // Add level column if it doesn't exist
    try {
      await connection.execute('ALTER TABLE books ADD COLUMN level VARCHAR(50)');
      console.log('✅ Added level column to books table');
    } catch (alterError) {
      // Column already exists, ignore error
      if (!alterError.message.includes('Duplicate column name')) {
        console.log('Level column already exists or other error:', alterError.message);
      }
    }
    
    // Add is_published column if it doesn't exist
    try {
      await connection.execute('ALTER TABLE books ADD COLUMN is_published BOOLEAN DEFAULT FALSE');
      console.log('✅ Added is_published column to books table');
    } catch (alterError) {
      // Column already exists, ignore error
      if (!alterError.message.includes('Duplicate column name')) {
        console.log('is_published column already exists or other error:', alterError.message);
      }
    }
    
    // Rename columns to match the expected schema
    try {
      await connection.execute('ALTER TABLE books CHANGE COLUMN coverImage cover_image_url VARCHAR(500)');
      console.log('✅ Renamed coverImage to cover_image_url');
    } catch (alterError) {
      if (!alterError.message.includes('Duplicate column name') && !alterError.message.includes('Unknown column')) {
        console.log('Column rename error:', alterError.message);
      }
    }
    
    try {
      await connection.execute('ALTER TABLE books CHANGE COLUMN pdfUrl pdf_url VARCHAR(500)');
      console.log('✅ Renamed pdfUrl to pdf_url');
    } catch (alterError) {
      if (!alterError.message.includes('Duplicate column name') && !alterError.message.includes('Unknown column')) {
        console.log('Column rename error:', alterError.message);
      }
    }
    
    // Update status column ENUM if needed
    try {
      await connection.execute('ALTER TABLE books MODIFY COLUMN status ENUM(\'draft\', \'active\', \'archived\') DEFAULT \'draft\'');
      console.log('✅ Updated books status column ENUM');
    } catch (alterError) {
      console.log('Status column ENUM update error:', alterError.message);
    }
    
    console.log('✅ Books table created/verified successfully');
    
    // Insert sample data if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM books');
    if (rows[0].count === 0) {
      const insertSampleData = `
        INSERT INTO books (title, author, description, category, level, pages, isbn, coverImage, pdfUrl, status, is_published) VALUES
        ('Advanced Calculus Textbook', 'Dr. John Smith', 'Comprehensive textbook covering advanced calculus topics', 'Mathematics', 'Advanced', 450, '978-1234567890', '/placeholder.svg', '/uploads/advanced-calculus.pdf', 'active', TRUE),
        ('Linear Algebra Fundamentals', 'Prof. Jane Doe', 'Essential guide to linear algebra concepts and applications', 'Mathematics', 'Intermediate', 320, '978-0987654321', '/placeholder.svg', '/uploads/linear-algebra.pdf', 'active', TRUE)
      `;
      
      await connection.execute(insertSampleData);
      console.log('✅ Sample books data inserted successfully');
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error creating books table:', error.message);
    return false;
  }
}

// Create courses table
async function createCoursesTable() {
  try {
    const connection = await getPool().getConnection();

    // Temporarily disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Drop all dependent tables first
    try {
      await connection.execute('DROP TABLE IF EXISTS enrollments');
      console.log('✅ Dropped enrollments table');
    } catch (dropError) {
      console.log('No enrollments table to drop');
    }

    try {
      await connection.execute('DROP TABLE IF EXISTS modules');
      console.log('✅ Dropped modules table');
    } catch (dropError) {
      console.log('No modules table to drop');
    }

    // Now drop and recreate courses table
    try {
      await connection.execute('DROP TABLE IF EXISTS courses');
      console.log('✅ Dropped existing courses table');
    } catch (dropError) {
      console.log('No existing courses table to drop');
    }

    const createTableQuery = `
      CREATE TABLE courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        level ENUM('Foundation', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Foundation',
        price DECIMAL(10,2) DEFAULT 0.00,
        original_price DECIMAL(10,2) DEFAULT 0.00,
        students INT DEFAULT 0,
        image_url VARCHAR(500),
        pdf_url VARCHAR(500),
        status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Created courses table with AUTO_INCREMENT');
    
    // Add is_published column if it doesn't exist
    try {
      await connection.execute('ALTER TABLE courses ADD COLUMN is_published BOOLEAN DEFAULT FALSE');
      console.log('✅ Added is_published column to courses table');
    } catch (alterError) {
      if (!alterError.message.includes('Duplicate column name') && !alterError.message.includes('Unknown column')) {
        console.log('is_published column already exists or other error:', alterError.message);
      }
    }

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Courses table created/verified successfully');

    // Insert sample data
    const insertSampleData = `
      INSERT INTO courses (title, description, category, level, price, status) VALUES
      ('Advanced Mathematics', 'Comprehensive course covering advanced mathematical concepts', 'Mathematics', 'Advanced', 99.99, 'active'),
      ('Basic Algebra', 'Introduction to algebraic concepts and problem solving', 'Mathematics', 'Foundation', 49.99, 'active')
    `;

    await connection.execute(insertSampleData);
    console.log('✅ Sample courses data inserted successfully');

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error creating courses table:', error.message);
    // Try to re-enable foreign key checks even if there was an error
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (fkError) {
      console.log('Could not re-enable foreign key checks:', fkError.message);
    }
    return false;
  }
}

// Create live_classes table
async function createLiveClassesTable() {
  try {
    const connection = await getPool().getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS live_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        level ENUM('Foundation', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Foundation',
        scheduled_at DATETIME,
        duration INT DEFAULT 60,
        max_students INT DEFAULT 50,
        meeting_link VARCHAR(500),
        image_url VARCHAR(500),
        status ENUM('draft', 'scheduled', 'live', 'completed', 'cancelled') DEFAULT 'draft',
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Live classes table created/verified successfully');
    
    // Add is_published column if it doesn't exist
    try {
      await connection.execute('ALTER TABLE live_classes ADD COLUMN is_published BOOLEAN DEFAULT FALSE');
      console.log('✅ Added is_published column to live_classes table');
    } catch (alterError) {
      if (!alterError.message.includes('Duplicate column name') && !alterError.message.includes('Unknown column')) {
        console.log('is_published column already exists or other error:', alterError.message);
      }
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error creating live_classes table:', error.message);
    return false;
  }
}

// Create enrollments table
async function createEnrollmentsTable() {
  try {
    const connection = await getPool().getConnection();

    // First, drop the enrollments table if it exists to avoid foreign key conflicts
    try {
      await connection.execute('DROP TABLE IF EXISTS enrollments');
      console.log('✅ Dropped existing enrollments table');
    } catch (dropError) {
      console.log('No existing enrollments table to drop');
    }

    // Temporarily disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const createTableQuery = `
      CREATE TABLE enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        course_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        amount DECIMAL(10,2) DEFAULT 0.00,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (user_id, course_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Created enrollments table with proper foreign keys');

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Enrollments table created/verified successfully');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error creating enrollments table:', error.message);
    // Try to re-enable foreign key checks even if there was an error
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (fkError) {
      console.log('Could not re-enable foreign key checks:', fkError.message);
    }
    return false;
  }
}

// Book operations
const Book = {
  // Get all books with pagination and filtering
  async getAll(page = 1, limit = 10, category = null, search = null) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      if (category) {
        whereClause += ' WHERE category LIKE ?';
        params.push(`%${category}%`);
      }
      
      if (search) {
        const searchCondition = 'title LIKE ? OR author LIKE ? OR description LIKE ?';
        if (whereClause) {
          whereClause += ` AND (${searchCondition})`;
        } else {
          whereClause = ` WHERE ${searchCondition}`;
        }
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM books${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM books 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await connection.execute(selectQuery, [...params, parseInt(limit), parseInt(offset)]);
      
      connection.release();
      
      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      // Fallback to in-memory data
      let filteredBooks = [...fallbackBooks];
      
      if (category) {
        filteredBooks = filteredBooks.filter(book => 
          book.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      if (search) {
        filteredBooks = filteredBooks.filter(book => 
          book.title.toLowerCase().includes(search.toLowerCase()) ||
          book.author.toLowerCase().includes(search.toLowerCase()) ||
          book.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
      
      return {
        data: paginatedBooks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredBooks.length,
          totalPages: Math.ceil(filteredBooks.length / parseInt(limit))
        }
      };
    }
  },

  // Get book by ID
  async getById(id) {
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      // Fallback to in-memory data
      const book = fallbackBooks.find(b => b.id === parseInt(id));
      return book || null;
    }
  },

  // Create new book
  async create(bookData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(bookData);
      const values = Object.values(bookData);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO books (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(query, values);
      
      // Get the created book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      // Fallback to in-memory data
      const newBook = {
        id: nextFallbackId++,
        ...bookData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      fallbackBooks.push(newBook);
      return newBook;
    }
  },

  // Update book
  async update(id, bookData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(bookData);
      const values = Object.values(bookData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE books SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      // Fallback to in-memory data
      const bookIndex = fallbackBooks.findIndex(b => b.id === parseInt(id));
      if (bookIndex === -1) {
        return null;
      }
      
      const updatedBook = {
        ...fallbackBooks[bookIndex],
        ...bookData,
        id: parseInt(id),
        updatedAt: new Date().toISOString()
      };
      
      fallbackBooks[bookIndex] = updatedBook;
      return updatedBook;
    }
  },

  // Delete book
  async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      // Get the book before deleting
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      // Delete the book
      await connection.execute('DELETE FROM books WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      // Fallback to in-memory data
      const bookIndex = fallbackBooks.findIndex(b => b.id === parseInt(id));
      if (bookIndex === -1) {
        return null;
      }
      
      const deletedBook = fallbackBooks.splice(bookIndex, 1)[0];
      return deletedBook;
    }
  },

  // Toggle publish status
  async togglePublish(id, isPublished) {
    try {
      const connection = await getPool().getConnection();
      
      const status = isPublished ? 'published' : 'draft';
      const query = 'UPDATE books SET is_published = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await connection.execute(query, [isPublished, status, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      // Fallback to in-memory data
      const bookIndex = fallbackBooks.findIndex(b => b.id === parseInt(id));
      if (bookIndex === -1) {
        return null;
      }
      
      const status = isPublished ? 'published' : 'draft';
      fallbackBooks[bookIndex].isPublished = isPublished;
      fallbackBooks[bookIndex].status = status;
      fallbackBooks[bookIndex].updatedAt = new Date().toISOString();
      
      return fallbackBooks[bookIndex];
    }
  }
};

module.exports = {
  get pool() { return getPool(); },
  testConnection,
  createUsersTable,
  createBooksTable,
  createCoursesTable,
  createLiveClassesTable,
  createEnrollmentsTable,
  Book
};
