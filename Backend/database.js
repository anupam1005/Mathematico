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

console.log('Database Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  ssl: dbConfig.ssl ? 'enabled' : 'disabled'
});

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
    price: 49.99,
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
    price: 39.99,
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
    const connection = await pool.getConnection();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      const connection = await pool.getConnection();
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
      const connection = await pool.getConnection();
      
      const status = isPublished ? 'published' : 'draft';
      const query = 'UPDATE books SET isPublished = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
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
  pool,
  testConnection,
  createUsersTable,
  createBooksTable,
  Book
};
