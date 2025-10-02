const { ensureDatabaseConnection } = require('../utils/database');

// Middleware to ensure database connection for all API routes
const ensureDatabase = async (req, res, next) => {
  try {
    // Skip database check for health endpoint
    if (req.path === '/health' || req.path === '/') {
      return next();
    }

    // Try to ensure database connection, but don't block if it fails
    // Let the individual route handlers deal with database connection issues
    try {
      await ensureDatabaseConnection();
    } catch (error) {
      console.warn('Database connection warning in middleware:', error.message);
      // Don't block the request, let the route handler deal with it
    }

    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    // Don't block the request, let the route handler deal with it
    next();
  }
};

module.exports = {
  ensureDatabase
};
