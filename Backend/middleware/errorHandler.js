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
  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.details 
    })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      ...errorResponse,
      message: 'Invalid data format'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      ...errorResponse,
      message: 'Duplicate entry found'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ...errorResponse,
      message: 'Authentication token expired'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
