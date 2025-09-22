// Lazy load database connection
let pool;
const getPool = () => {
  if (!pool) {
    const database = require('../database');
    pool = database.pool;
  }
  return pool;
};

// Course Model - Handles course-related database operations

class Course {
  /**
   * Create a new course
   */
  static async create(courseData) {
    try {
      const connection = await getPool().getConnection();
      
      const {
        title,
        description,
        instructor,
        price,
        duration,
        level,
        category,
        thumbnail,
        status = 'draft',
        isPublished = false
      } = courseData;
      
      const query = `
        INSERT INTO courses (title, description, instructor, price, duration, level, category, thumbnail, status, is_published, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.execute(query, [
        title, description, instructor, price, duration, level, category, thumbnail, status, isPublished
      ]);
      
      // Get the created course
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Find course by ID
   */
  static async findById(id) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      connection.release();
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding course by ID:', error);
      throw error;
    }
  }

  /**
   * Get all courses with pagination and filtering
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      if (filters.category) {
        whereClause += ' WHERE category = ?';
        params.push(filters.category);
      }
      
      if (filters.status) {
        const statusCondition = filters.status === 'published' ? 'is_published = 1' : 'is_published = 0';
        if (whereClause) {
          whereClause += ` AND ${statusCondition}`;
        } else {
          whereClause = ` WHERE ${statusCondition}`;
        }
      }
      
      if (filters.search) {
        const searchCondition = 'title LIKE ? OR description LIKE ? OR instructor LIKE ?';
        if (whereClause) {
          whereClause += ` AND (${searchCondition})`;
        } else {
          whereClause = ` WHERE ${searchCondition}`;
        }
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM courses${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM courses 
        ${whereClause} 
        ORDER BY created_at DESC 
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
      console.error('Error getting courses:', error);
      throw error;
    }
  }

  /**
   * Update course
   */
  static async update(id, updateData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE courses SET ${setClause}, updated_at = NOW() WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      // Get the updated course
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete course
   */
  static async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      // Get the course before deleting
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      // Delete the course
      await connection.execute('DELETE FROM courses WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Update course status
   */
  static async updateStatus(id, status, isPublished) {
    try {
      const connection = await getPool().getConnection();
      
      const query = 'UPDATE courses SET status = ?, is_published = ?, updated_at = NOW() WHERE id = ?';
      await connection.execute(query, [status, isPublished, id]);
      
      // Get the updated course
      const [rows] = await connection.execute('SELECT * FROM courses WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating course status:', error);
      throw error;
    }
  }

  /**
   * Get course statistics
   */
  static async getStats() {
    try {
      const connection = await getPool().getConnection();
      
      const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM courses');
      const [publishedRows] = await connection.execute('SELECT COUNT(*) as published FROM courses WHERE is_published = 1');
      const [draftRows] = await connection.execute('SELECT COUNT(*) as draft FROM courses WHERE is_published = 0');
      
      connection.release();
      
      return {
        total: totalRows[0].total,
        published: publishedRows[0].published,
        draft: draftRows[0].draft
      };
    } catch (error) {
      console.error('Error getting course stats:', error);
      throw error;
    }
  }
}

module.exports = Course;
