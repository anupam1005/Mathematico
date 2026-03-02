/**
 * Production Error Handler Middleware - Vercel Serverless Compatible
 * Enhanced security with no stack traces in production
 */
const winston = require('winston');

// Configure logger for serverless (no file operations)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mathematico-backend' },
  transports: [
    // Console transport only for Vercel serverless
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  // Handle exceptions in serverless
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  // Handle rejections in serverless
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Sanitize error details for production
 * @param {Error} err - Error object
 * @returns {Object} Sanitized error information
 */
const sanitizeError = (err) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const sanitized = {
    message: err && err.message ? String(err.message) : 'Internal server error',
    name: err && err.name ? String(err.name) : 'Error',
    code: err && typeof err.code === 'number' ? err.code : null
  };

  // Only include stack trace in development
  if (isDevelopment && err && err.stack) {
    sanitized.stack = String(err.stack);
  }

  // Only include detailed error info in development
  if (isDevelopment) {
    if (err && err.details) sanitized.details = err.details;
    if (err && err.errors) sanitized.errors = err.errors;
  }

  return sanitized;
};

const errorHandler = (err, req, res, next) => {
  // Prevent double response sending
  if (res.headersSent) {
    return next(err);
  }

  // Sanitize error information
  const sanitizedError = sanitizeError(err);

  // Log error details safely (without sensitive information)
  try {
    logger.error({
      message: sanitizedError.message,
      name: sanitizedError.name,
      code: sanitizedError.code,
      url: req && req.url ? req.url : 'unknown',
      method: req && req.method ? req.method : 'unknown',
      ip: req && req.ip ? req.ip : 'unknown',
      userAgent: req && req.get ? req.get('User-Agent') : 'unknown',
      timestamp: new Date().toISOString(),
      // Include stack trace only in development
      ...(process.env.NODE_ENV !== 'production' && { stack: err && err.stack })
    });
  } catch (logError) {
    // Fallback logging if winston fails
    console.error('Error logging failed:', logError);
    console.error('Original error:', sanitizedError.message);
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    success: false,
    message: sanitizedError.message,
    timestamp: new Date().toISOString()
  };

  // Include additional details only in development
  if (isDevelopment) {
    errorResponse.name = sanitizedError.name;
    if (sanitizedError.stack) errorResponse.stack = sanitizedError.stack;
    if (sanitizedError.details) errorResponse.details = sanitizedError.details;
  }

  // Handle specific error types with appropriate status codes
  if (sanitizedError.name === 'ValidationError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Validation failed',
      ...(isDevelopment && { errors: err && err.errors ? err.errors : undefined })
    });
  }

  if (sanitizedError.name === 'CastError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Invalid data format'
    });
  }

  if (sanitizedError.code === 11000) {
    return res.status(409).json({
      ...errorResponse,
      message: 'Duplicate entry found'
    });
  }

  if (sanitizedError.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Invalid authentication token'
    });
  }

  if (sanitizedError.name === 'TokenExpiredError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Authentication token expired'
    });
  }

  // Handle MongoDB connection errors
  if (sanitizedError.message && (
    sanitizedError.message.toLowerCase().includes('mongo') ||
    sanitizedError.message.toLowerCase().includes('database') ||
    sanitizedError.message.toLowerCase().includes('connection')
  )) {
    return res.status(503).json({
      ...errorResponse,
      message: 'Database connection error. Please try again later.'
    });
  }

  // Handle Redis connection errors
  if (sanitizedError.message && sanitizedError.message.toLowerCase().includes('redis')) {
    return res.status(503).json({
      ...errorResponse,
      message: 'Service temporarily unavailable'
    });
  }

  // Handle rate limit errors
  if (sanitizedError.code === 429 || sanitizedError.message.toLowerCase().includes('rate limit')) {
    return res.status(429).json({
      ...errorResponse,
      message: 'Too many requests. Please try again later.',
      retryAfter: 60
    });
  }

  // Handle JWT security errors
  if (sanitizedError.message && (
    sanitizedError.message.toLowerCase().includes('jwt') ||
    sanitizedError.message.toLowerCase().includes('token') ||
    sanitizedError.message.toLowerCase().includes('unauthorized')
  )) {
    return res.status(401).json({
      ...errorResponse,
      message: 'Authentication failed'
    });
  }

  // Default error response - generic message in production
  const statusCode = (err && (err.statusCode || err.status)) || 500;
  
  if (process.env.NODE_ENV === 'production') {
    // In production, return generic error message for 500 errors
    if (statusCode >= 500) {
      return res.status(statusCode).json({
        success: false,
        message: 'An internal error occurred. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper middleware
// Wraps async route handlers to catch errors and pass them to error handler
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;