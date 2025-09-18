const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'mathematico',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log('Database:', dbConfig.database);
    console.log('Host:', dbConfig.host);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Create books table if it doesn't exist
async function createBooksTable() {
  try {
    const connection = await pool.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        description TEXT,
        price DECIMAL(10, 2),
        category VARCHAR(100),
        pages INT,
        isbn VARCHAR(20),
        coverImage VARCHAR(500),
        pdfUrl VARCHAR(500),
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        isPublished BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Books table created/verified successfully');
    
    // Insert sample data if table is empty
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM books');
    if (rows[0].count === 0) {
      const insertSampleData = `
        INSERT INTO books (title, author, description, price, category, pages, isbn, coverImage, pdfUrl, status, isPublished) VALUES
        ('Advanced Calculus Textbook', 'Dr. John Smith', 'Comprehensive textbook covering advanced calculus topics', 49.99, 'Mathematics', 450, '978-1234567890', '/placeholder.svg', '/uploads/advanced-calculus.pdf', 'published', TRUE),
        ('Linear Algebra Fundamentals', 'Prof. Jane Doe', 'Essential guide to linear algebra concepts and applications', 39.99, 'Mathematics', 320, '978-0987654321', '/placeholder.svg', '/uploads/linear-algebra.pdf', 'published', TRUE)
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

// Book operations
const Book = {
  // Get all books with pagination and filtering
  async getAll(page = 1, limit = 10, category = null, search = null) {
    try {
      const connection = await pool.getConnection();
      
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
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await connection.execute(selectQuery, [...params, limit, offset]);
      
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
      console.error('Error getting books:', error);
      throw error;
    }
  },

  // Get book by ID
  async getById(id) {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error getting book by ID:', error);
      throw error;
    }
  },

  // Create new book
  async create(bookData) {
    try {
      const connection = await pool.getConnection();
      
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
      console.error('Error creating book:', error);
      throw error;
    }
  },

  // Update book
  async update(id, bookData) {
    try {
      const connection = await pool.getConnection();
      
      const fields = Object.keys(bookData);
      const values = Object.values(bookData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE books SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },

  // Delete book
  async delete(id) {
    try {
      const connection = await pool.getConnection();
      
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
      console.error('Error deleting book:', error);
      throw error;
    }
  },

  // Toggle publish status
  async togglePublish(id, isPublished) {
    try {
      const connection = await pool.getConnection();
      
      const status = isPublished ? 'published' : 'draft';
      const query = 'UPDATE books SET isPublished = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
      await connection.execute(query, [isPublished, status, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error toggling publish status:', error);
      throw error;
    }
  }
};

module.exports = {
  pool,
  testConnection,
  createBooksTable,
  Book
};
