// Production Error Handler Middleware
const winston = require('winston');

// Configure logger for production
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mathematico-backend' },
  transports: [
    // Only add file transports in local development (not Vercel)
    ...(process.env.VERCEL !== '1' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ] : []),
    // Always add console transport for Vercel
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const errorHandler = (err, req, res, next) => {
  // Prevent double response sending
  if (res.headersSent) {
    return next(err);
  }

  // Safely extract error information
  const errorMessage = err && err.message ? String(err.message) : 'Internal server error';
  const errorName = err && err.name ? String(err.name) : 'Error';
  const errorCode = err && typeof err.code === 'number' ? err.code : null;
  const errorStack = err && err.stack ? String(err.stack) : undefined;

  // Log error details safely
  try {
    logger.error({
      message: errorMessage,
      name: errorName,
      code: errorCode,
      stack: errorStack,
      url: req && req.url ? req.url : 'unknown',
      method: req && req.method ? req.method : 'unknown',
      ip: req && req.ip ? req.ip : 'unknown',
      userAgent: req && req.get ? req.get('User-Agent') : 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    // Fallback logging if winston fails
    console.error('Error logging failed:', logError);
    console.error('Original error:', errorMessage);
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    success: false,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { 
      stack: errorStack,
      details: err && err.details ? err.details : undefined,
      name: errorName
    })
  };

  // Handle specific error types
  if (errorName === 'ValidationError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Validation failed',
      errors: err && err.errors ? err.errors : undefined
    });
  }

  if (errorName === 'CastError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Invalid data format'
    });
  }

  if (errorCode === 11000) {
    return res.status(409).json({
      ...errorResponse,
      message: 'Duplicate entry found'
    });
  }

  if (errorName === 'JsonWebTokenError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Invalid authentication token'
    });
  }

  if (errorName === 'TokenExpiredError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Authentication token expired'
    });
  }

  // Handle MongoDB connection errors
  if (errorMessage && (
    errorMessage.toLowerCase().includes('mongo') ||
    errorMessage.toLowerCase().includes('database') ||
    errorMessage.toLowerCase().includes('connection')
  )) {
    return res.status(503).json({
      ...errorResponse,
      message: 'Database connection error. Please try again later.'
    });
  }

  // Default error response
  const statusCode = (err && (err.statusCode || err.status)) || 500;
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