const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Lazy load database connection
let pool;
const getPool = () => {
  if (!pool) {
    const database = require('../database');
    pool = database.pool;
  }
  return pool;
};

// User Model - Handles user-related database operations

class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    try {
      const connection = await getPool().getConnection();
      
      const { name, email, password, role = 'user' } = userData;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userId = uuidv4();
      const query = `
        INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.execute(query, [userId, name, email, hashedPassword, role]);
      
      // Get the created user (without password)
      const [rows] = await connection.execute(
        'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?', 
        [userId]
      );
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      connection.release();
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Compare password
   */
  static async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const connection = await getPool().getConnection();
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id, updateData) {
    try {
      const connection = await getPool().getConnection();
      
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`;
      await connection.execute(query, [...values, id]);
      
      // Get the updated user
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async delete(id) {
    try {
      const connection = await getPool().getConnection();
      
      // Get the user before deleting
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        connection.release();
        return null;
      }
      
      // Delete the user
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      if (filters.role) {
        whereClause += ' WHERE role = ?';
        params.push(filters.role);
      }
      
      if (filters.status) {
        const statusCondition = filters.status === 'active' ? 'status = "active"' : 'status = "inactive"';
        if (whereClause) {
          whereClause += ` AND ${statusCondition}`;
        } else {
          whereClause = ` WHERE ${statusCondition}`;
        }
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM users 
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
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  static async updateStatus(id, status) {
    try {
      const connection = await getPool().getConnection();
      
      const query = 'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?';
      await connection.execute(query, [status, id]);
      
      // Get the updated user
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }
}

module.exports = User;
