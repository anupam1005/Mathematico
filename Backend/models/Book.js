// Lazy load database connection
let pool;
const getPool = () => {
  if (!pool) {
    const database = require('../database');
    pool = database.pool;
  }
  return pool;
};

// Book Model - Handles book-related database operations

class Book {
  /**
   * Create a new book
   */
  static async create(bookData) {
    try {
      const connection = await getPool().getConnection();
      
      const {
        title,
        author,
        description,
        category,
        level,
        pages,
        isbn,
        cover_image_url,
        pdf_url,
        status = 'draft',
        created_by
      } = bookData;
      
      // Validate required fields
      if (!title || !author) {
        throw new Error('Title and Author are required');
      }
      
      const query = `
        INSERT INTO books (
          title, author, description, category, level, pages, isbn, 
          cover_image_url, pdf_url, status, created_by, created_at, updated_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.execute(query, [
        title, 
        author, 
        description || null, 
        category || null, 
        level || null, 
        pages || null, 
        isbn || null, 
        cover_image_url || null, 
        pdf_url || null, 
        status, 
        created_by || '1'
      ]);
      
      // Get the created book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  }

  /**
   * Find book by ID
   */
  static async findById(id) {
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error finding book by ID:', error);
      throw error;
    }
  }

  /**
   * Get all books with pagination and filtering
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      // Build where clause based on filters
      const conditions = [];
      
      if (filters.category) {
        conditions.push('category LIKE ?');
        params.push(`%${filters.category}%`);
      }
      
      if (filters.level) {
        conditions.push('level = ?');
        params.push(filters.level);
      }
      
      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      
      if (filters.search) {
        conditions.push('(title LIKE ? OR author LIKE ? OR description LIKE ?)');
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }
      
      if (conditions.length > 0) {
        whereClause = ' WHERE ' + conditions.join(' AND ');
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
      console.error('Error getting books:', error);
      throw error;
    }
  }

  /**
   * Update book
   */
  static async update(id, updateData) {
    try {
      const connection = await getPool().getConnection();
      
      // Remove undefined values and build update query
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );
      
      if (Object.keys(cleanData).length === 0) {
        connection.release();
        return await this.findById(id);
      }
      
      const fields = Object.keys(cleanData);
      const values = Object.values(cleanData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE books SET ${setClause}, updated_at = NOW() WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  /**
   * Delete book
   */
  static async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      // Get the book before deleting
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      const bookToDelete = rows[0];
      
      // Delete the book
      await connection.execute('DELETE FROM books WHERE id = ?', [id]);
      
      connection.release();
      return bookToDelete;
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  /**
   * Update book status
   */
  static async updateStatus(id, status) {
    try {
      const connection = await getPool().getConnection();
      
      const query = 'UPDATE books SET status = ?, updated_at = NOW() WHERE id = ?';
      await connection.execute(query, [status, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error updating book status:', error);
      throw error;
    }
  }

  /**
   * Get book statistics
   */
  static async getStats() {
    try {
      const connection = await getPool().getConnection();
      
      const queries = {
        total: 'SELECT COUNT(*) as count FROM books',
        published: 'SELECT COUNT(*) as count FROM books WHERE status = "published"',
        draft: 'SELECT COUNT(*) as count FROM books WHERE status = "draft"',
        archived: 'SELECT COUNT(*) as count FROM books WHERE status = "archived"',
        byCategory: 'SELECT category, COUNT(*) as count FROM books GROUP BY category',
        byLevel: 'SELECT level, COUNT(*) as count FROM books GROUP BY level',
        recent: 'SELECT COUNT(*) as count FROM books WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      };
      
      const stats = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const [rows] = await connection.execute(query);
        if (key === 'byCategory' || key === 'byLevel') {
          stats[key] = rows;
        } else {
          stats[key] = rows[0].count;
        }
      }
      
      connection.release();
      return stats;
    } catch (error) {
      console.error('Error getting book stats:', error);
      throw error;
    }
  }

  /**
   * Search books by multiple criteria
   */
  static async search(searchTerm, filters = {}) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = 'WHERE (title LIKE ? OR author LIKE ? OR description LIKE ? OR isbn LIKE ?)';
      let params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
      
      if (filters.category) {
        whereClause += ' AND category = ?';
        params.push(filters.category);
      }
      
      if (filters.level) {
        whereClause += ' AND level = ?';
        params.push(filters.level);
      }
      
      if (filters.status) {
        whereClause += ' AND status = ?';
        params.push(filters.status);
      }
      
      const query = `SELECT * FROM books ${whereClause} ORDER BY created_at DESC`;
      const [rows] = await connection.execute(query, params);
      
      connection.release();
      return rows;
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }

  /**
   * Get books by category
   */
  static async getByCategory(category, limit = 10) {
    try {
      const connection = await getPool().getConnection();
      
      const query = `
        SELECT * FROM books 
        WHERE category = ? AND is_published = true 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const [rows] = await connection.execute(query, [category, limit]);
      
      connection.release();
      return rows;
    } catch (error) {
      console.error('Error getting books by category:', error);
      throw error;
    }
  }

  /**
   * Toggle publication status
   */
  static async togglePublish(id) {
    try {
      const connection = await getPool().getConnection();
      
      // Get current status
      const [currentRows] = await connection.execute('SELECT is_published FROM books WHERE id = ?', [id]);
      
      if (currentRows.length === 0) {
        connection.release();
        return null;
      }
      
      const currentStatus = currentRows[0].is_published;
      const newStatus = !currentStatus;
      const newStatusText = newStatus ? 'active' : 'draft';
      
      // Update status
      const query = 'UPDATE books SET is_published = ?, status = ?, updated_at = NOW() WHERE id = ?';
      await connection.execute(query, [newStatus, newStatusText, id]);
      
      // Get the updated book
      const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error toggling book publish status:', error);
      throw error;
    }
  }
}

module.exports = Book;
