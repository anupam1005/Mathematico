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

// Payment Model - Handles payment-related database operations

class Payment {
  /**
   * Create a new payment record
   */
  static async create(paymentData) {
    try {
      const connection = await getPool().getConnection();
      
      const {
        user_id,
        item_type, // 'course', 'book', 'live_class'
        item_id,
        amount,
        currency = 'USD',
        payment_method = 'card',
        payment_gateway = 'razorpay',
        gateway_payment_id,
        gateway_order_id,
        status = 'pending',
        metadata = {}
      } = paymentData;
      
      const paymentId = uuidv4();
      
      const query = `
        INSERT INTO payments (
          id, user_id, item_type, item_id, amount, currency, 
          payment_method, payment_gateway, gateway_payment_id, 
          gateway_order_id, status, metadata, created_at, updated_at
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.execute(query, [
        paymentId, user_id, item_type, item_id, amount, currency,
        payment_method, payment_gateway, gateway_payment_id,
        gateway_order_id, status, JSON.stringify(metadata)
      ]);
      
      // Get the created payment
      const [rows] = await connection.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);
      
      connection.release();
      return rows[0];
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Find payment by ID
   */
  static async findById(id) {
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute('SELECT * FROM payments WHERE id = ?', [id]);
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      // Parse metadata JSON
      const payment = rows[0];
      if (payment.metadata) {
        try {
          payment.metadata = JSON.parse(payment.metadata);
        } catch (e) {
          payment.metadata = {};
        }
      }
      
      return payment;
    } catch (error) {
      console.error('Error finding payment by ID:', error);
      throw error;
    }
  }

  /**
   * Get all payments with pagination and filtering
   */
  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const connection = await getPool().getConnection();
      
      let whereClause = '';
      let params = [];
      
      // Build where clause based on filters
      const conditions = [];
      
      if (filters.user_id) {
        conditions.push('user_id = ?');
        params.push(filters.user_id);
      }
      
      if (filters.item_type) {
        conditions.push('item_type = ?');
        params.push(filters.item_type);
      }
      
      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      
      if (filters.payment_method) {
        conditions.push('payment_method = ?');
        params.push(filters.payment_method);
      }
      
      if (filters.date_from) {
        conditions.push('created_at >= ?');
        params.push(filters.date_from);
      }
      
      if (filters.date_to) {
        conditions.push('created_at <= ?');
        params.push(filters.date_to);
      }
      
      if (conditions.length > 0) {
        whereClause = ' WHERE ' + conditions.join(' AND ');
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM payments${whereClause}`;
      const [countRows] = await connection.execute(countQuery, params);
      const total = countRows[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT p.*, u.name as user_name, u.email as user_email
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        ${whereClause} 
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await connection.execute(selectQuery, [...params, parseInt(limit), parseInt(offset)]);
      
      // Parse metadata for each payment
      const payments = rows.map(payment => {
        if (payment.metadata) {
          try {
            payment.metadata = JSON.parse(payment.metadata);
          } catch (e) {
            payment.metadata = {};
          }
        }
        return payment;
      });
      
      connection.release();
      
      return {
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  static async updateStatus(id, status, metadata = {}) {
    try {
      const connection = await getPool().getConnection();
      
      const query = `
        UPDATE payments 
        SET status = ?, metadata = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      
      await connection.execute(query, [status, JSON.stringify(metadata), id]);
      
      // Get the updated payment
      const [rows] = await connection.execute('SELECT * FROM payments WHERE id = ?', [id]);
      
      connection.release();
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  static async getStats() {
    try {
      const connection = await getPool().getConnection();
      
      const queries = {
        total: 'SELECT COUNT(*) as count FROM payments',
        totalAmount: 'SELECT SUM(amount) as total FROM payments WHERE status = "completed"',
        pending: 'SELECT COUNT(*) as count FROM payments WHERE status = "pending"',
        completed: 'SELECT COUNT(*) as count FROM payments WHERE status = "completed"',
        failed: 'SELECT COUNT(*) as count FROM payments WHERE status = "failed"',
        refunded: 'SELECT COUNT(*) as count FROM payments WHERE status = "refunded"',
        byMethod: 'SELECT payment_method, COUNT(*) as count FROM payments GROUP BY payment_method',
        byItemType: 'SELECT item_type, COUNT(*) as count FROM payments GROUP BY item_type',
        recentRevenue: 'SELECT SUM(amount) as total FROM payments WHERE status = "completed" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
        monthlyRevenue: `
          SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as month,
            SUM(amount) as revenue,
            COUNT(*) as transactions
          FROM payments 
          WHERE status = 'completed' 
          GROUP BY DATE_FORMAT(created_at, '%Y-%m')
          ORDER BY month DESC 
          LIMIT 12
        `
      };
      
      const stats = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const [rows] = await connection.execute(query);
        if (key === 'byMethod' || key === 'byItemType' || key === 'monthlyRevenue') {
          stats[key] = rows;
        } else {
          stats[key] = rows[0].count || rows[0].total || 0;
        }
      }
      
      connection.release();
      return stats;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  static async getUserPayments(userId, page = 1, limit = 10) {
    try {
      const connection = await getPool().getConnection();
      
      // Get total count
      const countQuery = 'SELECT COUNT(*) as total FROM payments WHERE user_id = ?';
      const [countRows] = await connection.execute(countQuery, [userId]);
      const total = countRows[0].total;
      
      // Get paginated results
      const offset = (page - 1) * limit;
      const selectQuery = `
        SELECT * FROM payments 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const [rows] = await connection.execute(selectQuery, [userId, parseInt(limit), parseInt(offset)]);
      
      // Parse metadata for each payment
      const payments = rows.map(payment => {
        if (payment.metadata) {
          try {
            payment.metadata = JSON.parse(payment.metadata);
          } catch (e) {
            payment.metadata = {};
          }
        }
        return payment;
      });
      
      connection.release();
      
      return {
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      };
    } catch (error) {
      console.error('Error getting user payments:', error);
      throw error;
    }
  }
}

module.exports = Payment;
