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

// Update database with INR currency and clean test data
async function updateDatabaseToINR() {
  let connection;
  
  try {
    console.log('🔗 Connecting to Railway database...');
    connection = await getPool().getConnection();
    console.log('✅ Connected to Railway database');

    // 1. Add currency columns if they don't exist
    console.log('📝 Adding currency columns...');
    
    try {
      await connection.execute('ALTER TABLE courses ADD COLUMN currency VARCHAR(3) DEFAULT "INR"');
      console.log('✅ Added currency column to courses table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Currency column already exists in courses table');
      } else {
        console.log('⚠️ Error adding currency to courses:', error.message);
      }
    }

    try {
      await connection.execute('ALTER TABLE books ADD COLUMN currency VARCHAR(3) DEFAULT "INR"');
      console.log('✅ Added currency column to books table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Currency column already exists in books table');
      } else {
        console.log('⚠️ Error adding currency to books:', error.message);
      }
    }

    try {
      await connection.execute('ALTER TABLE live_classes ADD COLUMN currency VARCHAR(3) DEFAULT "INR"');
      console.log('✅ Added currency column to live_classes table');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Currency column already exists in live_classes table');
      } else {
        console.log('⚠️ Error adding currency to live_classes:', error.message);
      }
    }

    // 2. Update existing records to use INR currency
    console.log('💰 Updating existing records to INR currency...');
    
    await connection.execute('UPDATE courses SET currency = "INR" WHERE currency IS NULL OR currency = "USD"');
    console.log('✅ Updated courses currency to INR');

    await connection.execute('UPDATE books SET currency = "INR" WHERE currency IS NULL OR currency = "USD"');
    console.log('✅ Updated books currency to INR');

    await connection.execute('UPDATE live_classes SET currency = "INR" WHERE currency IS NULL OR currency = "USD"');
    console.log('✅ Updated live_classes currency to INR');

    await connection.execute('UPDATE payments SET currency = "INR" WHERE currency IS NULL OR currency = "USD"');
    console.log('✅ Updated payments currency to INR');

    // 3. Clean up test data
    console.log('🧹 Cleaning up test data...');
    
    // Delete ALL books (clean slate)
    try {
      const [bookResult] = await connection.execute('DELETE FROM books');
      console.log(`✅ Deleted ALL ${bookResult.affectedRows} books`);
    } catch (error) {
      console.log('⚠️ Error deleting books:', error.message);
    }

    // Delete ALL courses (clean slate)
    try {
      const [courseResult] = await connection.execute('DELETE FROM courses');
      console.log(`✅ Deleted ALL ${courseResult.affectedRows} courses`);
    } catch (error) {
      console.log('⚠️ Error deleting courses:', error.message);
    }

    // Delete ALL live classes (clean slate)
    try {
      const [liveClassResult] = await connection.execute('DELETE FROM live_classes');
      console.log(`✅ Deleted ALL ${liveClassResult.affectedRows} live classes`);
    } catch (error) {
      console.log('⚠️ Error deleting live classes:', error.message);
    }

    // Delete ALL users except admin
    try {
      const [userResult] = await connection.execute('DELETE FROM users WHERE email != "dc2006089@gmail.com"');
      console.log(`✅ Deleted ALL ${userResult.affectedRows} users (except admin)`);
    } catch (error) {
      console.log('⚠️ Error deleting users:', error.message);
    }

    // Delete ALL payments (clean slate)
    try {
      const [paymentResult] = await connection.execute('DELETE FROM payments');
      console.log(`✅ Deleted ALL ${paymentResult.affectedRows} payments`);
    } catch (error) {
      console.log('⚠️ Error deleting payments:', error.message);
    }

    // 4. Update default currency in settings
    console.log('⚙️ Updating default currency in settings...');
    
    try {
      // First check if settings table exists
      const [tables] = await connection.execute("SHOW TABLES LIKE 'settings'");
      if (tables.length > 0) {
        await connection.execute(`
          INSERT INTO settings (key_name, value, description, category, data_type, created_at, updated_at) 
          VALUES ('default_currency', 'INR', 'Default currency for the platform', 'general', 'string', NOW(), NOW())
          ON DUPLICATE KEY UPDATE value = 'INR', updated_at = NOW()
        `);
        console.log('✅ Updated default currency setting');
      } else {
        console.log('ℹ️ Settings table does not exist, skipping currency setting update');
      }
    } catch (error) {
      console.log('⚠️ Error updating settings:', error.message);
    }

    // 5. Show final statistics
    console.log('📊 Final database statistics:');
    
    try {
      const [bookCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
      console.log(`📚 Books: ${bookCount[0].count}`);
    } catch (error) {
      console.log('📚 Books: Table not found');
    }

    try {
      const [courseCount] = await connection.execute('SELECT COUNT(*) as count FROM courses');
      console.log(`🎓 Courses: ${courseCount[0].count}`);
    } catch (error) {
      console.log('🎓 Courses: Table not found');
    }

    try {
      const [liveClassCount] = await connection.execute('SELECT COUNT(*) as count FROM live_classes');
      console.log(`📺 Live Classes: ${liveClassCount[0].count}`);
    } catch (error) {
      console.log('📺 Live Classes: Table not found');
    }

    try {
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users: ${userCount[0].count}`);
    } catch (error) {
      console.log('👥 Users: Table not found');
    }

    try {
      const [paymentCount] = await connection.execute('SELECT COUNT(*) as count FROM payments');
      console.log(`💳 Payments: ${paymentCount[0].count}`);
    } catch (error) {
      console.log('💳 Payments: Table not found');
    }

    console.log('🎉 Railway database update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating Railway database:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

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

// In-memory data store for production (empty)
let fallbackBooks = [];
let nextFallbackId = 1;

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
    
    // Database ready for production - no sample data
    
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

    // Database ready for production - no sample data

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
      
      // Ensure currency is set to INR if not provided
      if (!bookData.currency) {
        bookData.currency = 'INR';
      }
      
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
        currency: bookData.currency || 'INR',
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

// In-memory data store for courses (empty)
let fallbackCourses = [];

// In-memory data store for live classes (empty)
let fallbackLiveClasses = [];

// In-memory data store for users (admin only)
let fallbackUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "dc2006089@gmail.com",
    role: "admin",
    is_active: true,
    email_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Course operations
const Course = {
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
        const searchCondition = 'title LIKE ? OR description LIKE ?';
        if (whereClause) {
          whereClause += ` AND (${searchCondition})`;
        } else {
          whereClause = ` WHERE ${searchCondition}`;
        }
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM courses${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM courses 
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
      return {
        data: fallbackCourses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackCourses.length,
          totalPages: Math.ceil(fallbackCourses.length / parseInt(limit))
        }
      };
    }
  },

  async getById(id) {
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      const course = fallbackCourses.find(c => c.id === parseInt(id));
      return course || null;
    }
  },

  async create(courseData) {
    try {
      const connection = await getPool().getConnection();
      
      // Ensure currency is set to INR if not provided
      if (!courseData.currency) {
        courseData.currency = 'INR';
      }
      
      const fields = Object.keys(courseData);
      const values = Object.values(courseData);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO courses (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(query, values);
      
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const newCourse = {
        id: Date.now(),
        ...courseData,
        currency: courseData.currency || 'INR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      fallbackCourses.push(newCourse);
      return newCourse;
    }
  },

  async update(id, courseData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(courseData);
      const values = Object.values(courseData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE courses SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const courseIndex = fallbackCourses.findIndex(c => c.id === parseInt(id));
      if (courseIndex === -1) {
        return null;
      }
      
      const updatedCourse = {
        ...fallbackCourses[courseIndex],
        ...courseData,
        id: parseInt(id),
        updated_at: new Date().toISOString()
      };
      
      fallbackCourses[courseIndex] = updatedCourse;
      return updatedCourse;
    }
  },

  async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      await connection.execute('DELETE FROM courses WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const courseIndex = fallbackCourses.findIndex(c => c.id === parseInt(id));
      if (courseIndex === -1) {
        return null;
      }
      
      const deletedCourse = fallbackCourses.splice(courseIndex, 1)[0];
      return deletedCourse;
    }
  }
};

// LiveClass operations
const LiveClass = {
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
        const searchCondition = 'title LIKE ? OR description LIKE ?';
        if (whereClause) {
          whereClause += ` AND (${searchCondition})`;
        } else {
          whereClause = ` WHERE ${searchCondition}`;
        }
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM live_classes${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM live_classes 
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
      return {
        data: fallbackLiveClasses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackLiveClasses.length,
          totalPages: Math.ceil(fallbackLiveClasses.length / parseInt(limit))
        }
      };
    }
  },

  async getById(id) {
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      const liveClass = fallbackLiveClasses.find(lc => lc.id === parseInt(id));
      return liveClass || null;
    }
  },

  async create(liveClassData) {
    try {
      const connection = await getPool().getConnection();
      
      // Ensure currency is set to INR if not provided
      if (!liveClassData.currency) {
        liveClassData.currency = 'INR';
      }
      
      const fields = Object.keys(liveClassData);
      const values = Object.values(liveClassData);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO live_classes (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(query, values);
      
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const newLiveClass = {
        id: Date.now(),
        ...liveClassData,
        currency: liveClassData.currency || 'INR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      fallbackLiveClasses.push(newLiveClass);
      return newLiveClass;
    }
  },

  async update(id, liveClassData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(liveClassData);
      const values = Object.values(liveClassData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE live_classes SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const liveClassIndex = fallbackLiveClasses.findIndex(lc => lc.id === parseInt(id));
      if (liveClassIndex === -1) {
        return null;
      }
      
      const updatedLiveClass = {
        ...fallbackLiveClasses[liveClassIndex],
        ...liveClassData,
        id: parseInt(id),
        updated_at: new Date().toISOString()
      };
      
      fallbackLiveClasses[liveClassIndex] = updatedLiveClass;
      return updatedLiveClass;
    }
  },

  async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      await connection.execute('DELETE FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const liveClassIndex = fallbackLiveClasses.findIndex(lc => lc.id === parseInt(id));
      if (liveClassIndex === -1) {
        return null;
      }
      
      const deletedLiveClass = fallbackLiveClasses.splice(liveClassIndex, 1)[0];
      return deletedLiveClass;
    }
  },

  async updateStatus(id, status) {
    try {
      const connection = await getPool().getConnection();
      
      const query = 'UPDATE live_classes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await connection.execute(query, [status, id]);
      
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const liveClassIndex = fallbackLiveClasses.findIndex(lc => lc.id === parseInt(id));
      if (liveClassIndex === -1) {
        return null;
      }
      
      fallbackLiveClasses[liveClassIndex].status = status;
      fallbackLiveClasses[liveClassIndex].updated_at = new Date().toISOString();
      
      return fallbackLiveClasses[liveClassIndex];
    }
  }
};

// User operations
const User = {
  async getAll(page = 1, limit = 10, role = null, search = null) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      if (role) {
        whereClause += ' WHERE role = ?';
        params.push(role);
      }
      
      if (search) {
        const searchCondition = 'name LIKE ? OR email LIKE ?';
        if (whereClause) {
          whereClause += ` AND (${searchCondition})`;
        } else {
          whereClause = ` WHERE ${searchCondition}`;
        }
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM users${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM users 
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
      return {
        data: fallbackUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackUsers.length,
          totalPages: Math.ceil(fallbackUsers.length / parseInt(limit))
        }
      };
    }
  },

  async getById(id) {
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      const user = fallbackUsers.find(u => u.id === id.toString());
      return user || null;
    }
  },

  async create(userData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(userData);
      const values = Object.values(userData);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await connection.execute(query, values);
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      fallbackUsers.push(newUser);
      return newUser;
    }
  },

  async update(id, userData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(userData);
      const values = Object.values(userData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const userIndex = fallbackUsers.findIndex(u => u.id === id.toString());
      if (userIndex === -1) {
        return null;
      }
      
      const updatedUser = {
        ...fallbackUsers[userIndex],
        ...userData,
        id: id.toString(),
        updated_at: new Date().toISOString()
      };
      
      fallbackUsers[userIndex] = updatedUser;
      return updatedUser;
    }
  },

  async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const userIndex = fallbackUsers.findIndex(u => u.id === id.toString());
      if (userIndex === -1) {
        return null;
      }
      
      const deletedUser = fallbackUsers.splice(userIndex, 1)[0];
      return deletedUser;
    }
  },

  async updateStatus(id, isActive) {
    try {
      const connection = await getPool().getConnection();
      
      const query = 'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await connection.execute(query, [isActive, id]);
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Database error, using fallback data:', error.message);
      
      const userIndex = fallbackUsers.findIndex(u => u.id === id.toString());
      if (userIndex === -1) {
        return null;
      }
      
      fallbackUsers[userIndex].is_active = isActive;
      fallbackUsers[userIndex].updated_at = new Date().toISOString();
      
      return fallbackUsers[userIndex];
    }
  }
};

// Create payments table
async function createPaymentsTable() {
  try {
    const connection = await getPool().getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        item_type ENUM('course', 'book', 'live_class') NOT NULL,
        item_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method VARCHAR(50) DEFAULT 'card',
        payment_gateway VARCHAR(50) DEFAULT 'razorpay',
        gateway_payment_id VARCHAR(255),
        gateway_order_id VARCHAR(255),
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_item (item_type, item_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Payments table created/verified successfully');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error creating payments table:', error.message);
    return false;
  }
}

module.exports = {
  get pool() { return getPool(); },
  testConnection,
  updateDatabaseToINR,
  createUsersTable,
  createBooksTable,
  createCoursesTable,
  createLiveClassesTable,
  createEnrollmentsTable,
  createPaymentsTable,
  Book,
  Course,
  LiveClass,
  User
};
