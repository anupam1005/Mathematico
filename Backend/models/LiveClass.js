// Lazy load database connection
let pool;
const getPool = () => {
  if (!pool) {
    const database = require('../database');
    pool = database.pool;
  }
  return pool;
};

// LiveClass Model - Handles live class-related database operations

class LiveClass {
  /**
   * Create a new live class
   */
  static async create(liveClassData) {
    try {
      const connection = await getPool().getConnection();
      
      const {
        title,
        description,
        instructor,
        date,
        duration,
        maxStudents,
        price,
        status = 'draft',
        meetingLink,
        thumbnail,
        category,
        subject,
        class: classField,
        level,
        created_by
      } = liveClassData;
      
      // Validate required fields
      if (!title || !meetingLink) {
        throw new Error('Title and Meeting Link are required');
      }
      
      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      
      const query = `
        INSERT INTO live_classes (
          title, slug, description, instructor, date, duration, max_students, price, 
          status, meeting_link, thumbnail, category, subject, class, level, created_by, created_at, updated_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.execute(query, [
        title, 
        slug,
        description || null, 
        instructor || 'Admin', 
        date || null, 
        duration || 60, 
        maxStudents || 50, 
        price || 0, 
        status, 
        meetingLink, 
        thumbnail || null,
        category || null,
        subject || null,
        classField || null,
        level || null,
        created_by || '1'
      ]);
      
      // Get the created live class
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [result.insertId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error creating live class:', error);
      throw error;
    }
  }

  /**
   * Find live class by ID
   */
  static async findById(id) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding live class by ID:', error);
      throw error;
    }
  }

  /**
   * Get all live classes with pagination and filtering
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      if (filters.status) {
        whereClause += ' WHERE status = ?';
        params.push(filters.status);
      } else if (filters.statusIn && Array.isArray(filters.statusIn)) {
        // Support filtering by multiple statuses
        const placeholders = filters.statusIn.map(() => '?').join(', ');
        whereClause += ` WHERE status IN (${placeholders})`;
        params.push(...filters.statusIn);
      }
      
      if (filters.instructor) {
        const instructorCondition = 'instructor LIKE ?';
        if (whereClause) {
          whereClause += ` AND ${instructorCondition}`;
        } else {
          whereClause = ` WHERE ${instructorCondition}`;
        }
        params.push(`%${filters.instructor}%`);
      }
      
      if (filters.search) {
        const searchCondition = 'title LIKE ? OR description LIKE ?';
        if (whereClause) {
          whereClause += ` AND (${searchCondition})`;
        } else {
          whereClause = ` WHERE ${searchCondition}`;
        }
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM live_classes${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM live_classes 
        ${whereClause} 
        ORDER BY date DESC 
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
      console.error('Error getting live classes:', error);
      throw error;
    }
  }

  /**
   * Update live class
   */
  static async update(id, updateData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE live_classes SET ${setClause}, updated_at = NOW() WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      // Get the updated live class
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating live class:', error);
      throw error;
    }
  }

  /**
   * Delete live class
   */
  static async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      // Get the live class before deleting
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      // Delete the live class
      await connection.execute('DELETE FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error deleting live class:', error);
      throw error;
    }
  }

  /**
   * Update live class status
   */
  static async updateStatus(id, status) {
    try {
      const connection = await getPool().getConnection();
      
      const query = 'UPDATE live_classes SET status = ?, updated_at = NOW() WHERE id = ?';
      await connection.execute(query, [status, id]);
      
      // Get the updated live class
      const [rows] = await connection.execute('SELECT * FROM live_classes WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating live class status:', error);
      throw error;
    }
  }

  /**
   * Get live class statistics
   */
  static async getStats() {
    try {
      const connection = await getPool().getConnection();
      
      const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM live_classes');
      const [upcomingRows] = await connection.execute('SELECT COUNT(*) as upcoming FROM live_classes WHERE status = "upcoming"');
      const [completedRows] = await connection.execute('SELECT COUNT(*) as completed FROM live_classes WHERE status = "completed"');
      
      connection.release();
      
      return {
        total: totalRows[0].total,
        upcoming: upcomingRows[0].upcoming,
        completed: completedRows[0].completed
      };
    } catch (error) {
      console.error('Error getting live class stats:', error);
      throw error;
    }
  }

  /**
   * Get upcoming live classes
   */
  static async getUpcoming(limit = 5) {
    try {
      const connection = await getPool().getConnection();
      
      const query = `
        SELECT * FROM live_classes 
        WHERE status = 'upcoming' AND date > NOW() 
        ORDER BY date ASC 
        LIMIT ?
      `;
      
      const [rows] = await connection.execute(query, [limit]);
      
      connection.release();
      return rows;
    } catch (error) {
      console.error('Error getting upcoming live classes:', error);
      throw error;
    }
  }
}

module.exports = LiveClass;
