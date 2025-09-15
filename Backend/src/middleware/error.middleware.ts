import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import logger from '../utils/logger';
import { StatusCodes } from 'http-status-codes';
import { sendResponse } from '../utils/apiResponse';

// Base error class that other error classes extend
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  status: number;
  details?: any;
  code?: string;
  errors?: any;
  keyValue?: Record<string, any>;

  constructor(message = 'Bad Request', code?: string, details?: any) {
    super(message, StatusCodes.BAD_REQUEST, true, code, details);
    this.status = StatusCodes.BAD_REQUEST;
    this.name = 'BadRequestError';
  }
}

export class ApiError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    code?: string,
    errors?: any[]
  ) {
    super(message, statusCode, isOperational, code, errors);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(StatusCodes.UNAUTHORIZED, message, true, code);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(StatusCodes.FORBIDDEN, message, true, code);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(StatusCodes.NOT_FOUND, message, true, code);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict', code = 'CONFLICT', details?: any) {
    super(StatusCodes.CONFLICT, message, true, code, details);
    this.name = 'ConflictError';
  }
}

export class ValidationErrorResponse extends ApiError {
  constructor(errors: any[], message = 'Validation failed') {
    super(StatusCodes.BAD_REQUEST, message, true, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

export class JwtError extends AppError {
  constructor(message = 'Invalid or expired token', code = 'INVALID_TOKEN') {
    super(message, StatusCodes.UNAUTHORIZED as number, true, code);
    this.name = 'JwtError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', code = 'DATABASE_ERROR') {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR as number, true, code);
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED', details?: any) {
    super(message, StatusCodes.TOO_MANY_REQUESTS as number, true, code, details);
    this.name = 'RateLimitError';
  }
}

// Error handler middleware
/**
 * Global error handling middleware
 * Handles all errors thrown in routes and sends appropriate responses
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Set default values for error
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';
  err.code = err.code || 'INTERNAL_SERVER_ERROR';

  // Handle specific error types
  if (err instanceof JsonWebTokenError) {
    err = new JwtError('Invalid token');
  } else if (err instanceof TokenExpiredError) {
    err = new JwtError('Token expired', 'TOKEN_EXPIRED');
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('ERROR ', {
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });
  } else {
    // Production logging (more concise)
    logger.error(`[${new Date().toISOString()}] ${err.statusCode} ${req.method} ${req.path} - ${err.message}`, {
      error: {
        name: err.name,
        message: err.message,
        code: err.code,
        ...(err.details && { details: err.details })
      },
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError' || err.name === 'ValidationErrorResponse') {
    const errors = (err.errors || Object.values(err.errors || {}).map((el: any) => ({
      field: el.path || el.field,
      message: el.message || el.msg || 'Invalid value',
    })));
    
    return sendResponse(
      res,
      StatusCodes.BAD_REQUEST,
      { errors },
      err.message || 'Validation error',
      'VALIDATION_ERROR'
    );
  }

  // Handle duplicate field errors (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate field value: ${field}. Please use another value!`;
    return sendResponse(
      res,
      StatusCodes.CONFLICT,
      { field, value: err.keyValue?.[field] },
      message,
      'DUPLICATE_FIELD'
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'JwtError') {
    return sendResponse(
      res,
      StatusCodes.UNAUTHORIZED,
      null,
      'Invalid token. Please log in again!',
      'INVALID_TOKEN'
    );
  }

  if (err.name === 'TokenExpiredError') {
    return sendResponse(
      res,
      StatusCodes.UNAUTHORIZED,
      null,
      'Your session has expired. Please log in again.',
      'TOKEN_EXPIRED'
    );
  }

  // Handle CastError (invalid ID format)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return sendResponse(
      res,
      StatusCodes.BAD_REQUEST,
      { path: err.path, value: err.value },
      message,
      'INVALID_ID_FORMAT'
    );
  }

  // Handle rate limiting
  if (err.name === 'RateLimitError') {
    return sendResponse(
      res,
      StatusCodes.TOO_MANY_REQUESTS,
      { retryAfter: err.retryAfter },
      'Too many requests, please try again later',
      'RATE_LIMIT_EXCEEDED'
    );
  }

  // Handle other operational errors
  if (err.isOperational) {
    return sendResponse(
      res,
      err.statusCode,
      err.details || null,
      err.message,
      err.code || 'OPERATIONAL_ERROR'
    );
  }

  // Handle programming or other unknown errors
  logger.error('UNHANDLED ERROR', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err.details && { details: err.details })
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    },
    timestamp: new Date().toISOString()
  });
  
  // Send generic error response in production, detailed in development
  const errorResponse = process.env.NODE_ENV === 'development' 
    ? {
        name: err.name,
        message: err.message,
        stack: err.stack,
        ...(err.details && { details: err.details })
      }
    : { message: 'Something went wrong!' };

  return sendResponse(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV === 'development' ? errorResponse : null,
    'An unexpected error occurred',
    'INTERNAL_SERVER_ERROR'
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  
  // Log the 404 error
  logger.warn(`404 [${req.method}] ${req.originalUrl} - Route not found`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers
  });
  
  // Send error response using our utility
  return sendResponse(
    res,
    StatusCodes.NOT_FOUND,
    process.env.NODE_ENV === 'development' ? { path: req.originalUrl } : null,
    error.message,
    error.code || 'NOT_FOUND'
  );
};

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

type AsyncHandlerOptions = {
  /** Whether to enable request/response logging (default: true) */
  enableLogging?: boolean;
  /** Custom error message for validation errors */
  validationErrorMessage?: string;
};

/**
 * Wraps an async route handler to catch errors and pass them to the error handling middleware
 * @param fn The async route handler function
 * @param options Configuration options for the handler
 * @returns A new route handler with error handling
 */
export const asyncHandler = (
  fn: AsyncRequestHandler, 
  options: AsyncHandlerOptions = { enableLogging: true }
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestInfo = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };

    if (options.enableLogging) {
      logger.info(`[${requestInfo.timestamp}] ${requestInfo.method} ${requestInfo.url}`, {
        ...requestInfo,
        body: req.body,
        query: req.query,
        params: req.params
      });
    }

    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationError = new ValidationErrorResponse(
          Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          })),
          'Validation failed'
        );
        return next(validationError);
      }
      
      // Handle duplicate key errors (MongoDB)
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || 'field';
        const conflictError = new ConflictError(
          `The ${field} '${error.keyValue?.[field]}' already exists`,
          'DUPLICATE_ENTRY',
          { field, value: error.keyValue?.[field] }
        );
        return next(conflictError);
      }
      
      // Handle cast errors (invalid ObjectId, etc.)
      if (error.name === 'CastError') {
        const notFoundError = new NotFoundError(
          `Invalid ${error.path}: ${error.value}`,
          'INVALID_ID_FORMAT'
        );
        return next(notFoundError);
      }
      
      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        return next(new JwtError('Invalid token'));
      }
      
      if (error.name === 'TokenExpiredError') {
        return next(new JwtError('Token expired', 'TOKEN_EXPIRED'));
      }
      
      // Log the error with request context
      const errorContext = {
        ...requestInfo,
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        ...(error.details && { details: error.details })
      };

      if (options.enableLogging) {
        logger.error(`Error in ${requestInfo.method} ${requestInfo.url}`, errorContext);
      }

      // Handle database errors
      if (error.name === 'MongoError' || error.name === 'MongooseError') {
        return next(new DatabaseError(error.message, error.code));
      }

      // Handle rate limiting
      if (error.name === 'RateLimitError') {
        return next(new RateLimitError(
          'Too many requests, please try again later',
          'RATE_LIMIT_EXCEEDED',
          { retryAfter: error.retryAfter }
        ));
      }
      
      // Handle uncaught promise rejections
      if (error.name === 'UnhandledPromiseRejection') {
        return next(new AppError(
          'An unexpected error occurred',
          StatusCodes.INTERNAL_SERVER_ERROR,
          true,
          'UNHANDLED_REJECTION',
          { originalError: error.message }
        ));
      }
      
      // For other unhandled errors, pass them along with additional context
      if (!error.isOperational) {
        error = new AppError(
          error.message || 'An unexpected error occurred',
          error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
          false, // Mark as non-operational
          error.code || 'INTERNAL_SERVER_ERROR',
          process.env.NODE_ENV === 'development' 
            ? { ...errorContext, stack: error.stack } 
            : undefined
        );
      }
      
      return next(error);
    });
  };
};

// Export all error types

export default {
  // Error classes
  AppError,
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationErrorResponse,
  RateLimitError,
  DatabaseError,
  JwtError,
  
  // Middleware functions
  errorHandler,
  notFoundHandler,
  asyncHandler
};
