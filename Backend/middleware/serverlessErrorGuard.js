/**
 * SERVERLESS ERROR GUARD - GLOBAL ERROR BOUNDARY
 * 
 * PURPOSE:
 * - Catches ANY async middleware failure
 * - Prevents "XHR request failed" in React Native
 * - Guarantees JSON response for ALL errors
 * - Never hangs requests
 * - Never returns HTML or empty responses
 * 
 * POSITION: Before all business routes, after rate limiters
 */

/**
 * Serverless error guard middleware
 * Catches any synchronous or asynchronous errors and returns structured JSON
 */
const serverlessErrorGuard = (err, req, res, next) => {
  const errorId = (() => {
    try {
      const crypto = require('crypto');
      return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString('hex');
    } catch (_) {
      return `err_${Date.now()}`;
    }
  })();

  // Attach a correlation id without changing response JSON formats
  try {
    res.setHeader('X-Error-Id', errorId);
  } catch (_) {}

  const safeBody = (() => {
    try {
      const body = req.body;
      if (!body || typeof body !== 'object') return body;
      const clone = Array.isArray(body) ? body.slice(0, 20) : { ...body };
      if (clone && typeof clone === 'object') {
        if (Object.prototype.hasOwnProperty.call(clone, 'password')) clone.password = '[REDACTED]';
        if (Object.prototype.hasOwnProperty.call(clone, 'confirmPassword')) clone.confirmPassword = '[REDACTED]';
        if (Object.prototype.hasOwnProperty.call(clone, 'newPassword')) clone.newPassword = '[REDACTED]';
        if (Object.prototype.hasOwnProperty.call(clone, 'oldPassword')) clone.oldPassword = '[REDACTED]';
        if (Object.prototype.hasOwnProperty.call(clone, 'refreshToken')) clone.refreshToken = '[REDACTED]';
      }
      return clone;
    } catch (_) {
      return undefined;
    }
  })();

  // Log the full error for debugging
  console.error('[SERVERLESS_ERROR_GUARD]', {
    errorId,
    error: err?.message || 'Unknown error',
    stack: err?.stack,
    path: req.path,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: safeBody,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });

  // Determine error type and appropriate response
  let statusCode = 500;
  let errorCode = 'SERVER_RUNTIME_ERROR';
  let message = 'Unexpected runtime failure';

  // Body-parser / JSON parse errors (malformed JSON)
  // Express sets `err.type = 'entity.parse.failed'` and `err.status = 400` for invalid JSON bodies.
  if (
    err &&
    (err.type === 'entity.parse.failed' ||
      err.status === 400 ||
      err.statusCode === 400) &&
    (err instanceof SyntaxError || (typeof err.message === 'string' && err.message.toLowerCase().includes('json')))
  ) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON payload';
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Invalid input data';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    message = 'File size too large';
  } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'External service unavailable';
  } else if (err.message && err.message.includes('timeout')) {
    statusCode = 504;
    errorCode = 'TIMEOUT_ERROR';
    message = 'Request timeout';
  }

  // In production, hide sensitive error details
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorResponse = {
    success: false,
    error: errorCode,
    message: isProduction ? message : (err?.message || message),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add additional debug info in non-production
  if (!isProduction) {
    errorResponse.debug = {
      stack: err?.stack,
      originalError: err?.message,
      environment: process.env.NODE_ENV
    };
  }

  // Always return JSON response - never crash
  try {
    return res.status(statusCode).json(errorResponse);
  } catch (jsonError) {
    // Ultimate fallback - if JSON serialization fails
    console.error('[SERVERLESS_ERROR_GUARD] JSON serialization failed:', jsonError);
    
    try {
      return res.status(statusCode).json({
        success: false,
        error: 'CRITICAL_ERROR',
        message: 'A critical error occurred',
        timestamp: new Date().toISOString()
      });
    } catch (finalError) {
      // Last resort - send plain text (should never reach here)
      console.error('[SERVERLESS_ERROR_GUARD] Ultimate fallback failed:', finalError);
      return res.status(statusCode).end('Internal server error');
    }
  }
};

/**
 * Async error wrapper for route handlers
 * Ensures async errors are caught by the error guard
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Timeout middleware for serverless environments
 * Prevents hanging requests
 */
const timeoutGuard = (timeoutMs = 25000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.warn('[TIMEOUT_GUARD] Request timeout', {
          path: req.path,
          method: req.method,
          timeout: timeoutMs
        });
        
        return res.status(504).json({
          success: false,
          error: 'REQUEST_TIMEOUT',
          message: 'Request took too long to process',
          timestamp: new Date().toISOString()
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Request size guard for serverless environments
 * Prevents memory exhaustion
 */
const sizeGuard = (maxSizeBytes = 10 * 1024 * 1024) => { // 10MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: 'PAYLOAD_TOO_LARGE',
        message: `Request payload too large. Maximum size: ${maxSizeBytes / 1024 / 1024}MB`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Health check for error guard
 */
const errorGuardHealthCheck = () => {
  return {
    status: 'healthy',
    message: 'Serverless error guard is operational',
    features: {
      errorBoundary: true,
      timeoutGuard: true,
      sizeGuard: true,
      asyncHandler: true
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  serverlessErrorGuard,
  asyncHandler,
  timeoutGuard,
  sizeGuard,
  errorGuardHealthCheck
};
