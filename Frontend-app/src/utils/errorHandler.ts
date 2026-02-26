import { safeCatch } from './safeCatch';

// Error handling utility for API responses and frontend operations
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface SafeApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  fallbackData?: T;
}

// Logger utility
export const Logger = {
  error: (message: string, error?: unknown) => {
    const scope = `ErrorHandler.Logger.error ${message}`;
    if (error !== undefined) {
      safeCatch(scope)(error);
      return;
    }
    safeCatch(scope)(new Error(message));
  },
  info: () => {},
  warn: (message: string, error?: unknown) => {
    const scope = `ErrorHandler.Logger.warn ${message}`;
    if (error !== undefined) {
      safeCatch(scope)(error);
      return;
    }
    safeCatch(scope)(new Error(message));
  },
  log: () => {},
  debug: () => {},
};

export class ErrorHandler {
  static handleApiError(error: any): ApiError {
    // Use createSafeError to safely extract error info without triggering NONE error
    const safeError = require('./safeError').createSafeError(error);
    
    // Extract status from safe error
    const status = safeError.response?.status || 0;
    const data = safeError.response?.data;
    const dataMessage = data?.message;
    
    // Return appropriate error based on status
    switch (status) {
      case 400:
        return {
          message: dataMessage || 'Bad request. Please check your input.',
          status,
          code: 'BAD_REQUEST',
          details: data
        };
      case 401:
        return {
          message: 'Authentication required. Please log in again.',
          status,
          code: 'UNAUTHORIZED'
        };
      case 403:
        return {
          message: 'Access forbidden. You do not have permission.',
          status,
          code: 'FORBIDDEN'
        };
      case 404:
        return {
          message: dataMessage || 'Resource not found.',
          status,
          code: 'NOT_FOUND'
        };
      case 422:
        return {
          message: dataMessage || 'Validation failed. Please check your input.',
          status,
          code: 'VALIDATION_ERROR',
          details: data
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          status,
          code: 'RATE_LIMITED'
        };
      case 500:
        return {
          message: 'Internal server error. Please try again later.',
          status,
          code: 'SERVER_ERROR'
        };
      case 502:
      case 503:
      case 504:
        return {
          message: 'Service temporarily unavailable. Please try again later.',
          status,
          code: 'SERVICE_UNAVAILABLE'
        };
      case 0:
        return {
          message: 'Network error. Please check your internet connection.',
          status: 0,
          code: 'NETWORK_ERROR'
        };
      default:
        return {
          message: dataMessage || safeError.message || 'An unexpected error occurred.',
          status,
          code: 'UNKNOWN',
          details: data
        };
    }
  }

  static safeStringOperation(value: any, operation: (val: string) => any, fallback: any = ''): any {
    try {
      if (value === null || value === undefined) {
        return fallback;
      }
      
      const stringValue = String(value);
      return operation(stringValue);
    } catch (error) {
      safeCatch('ErrorHandler.safeStringOperation')(error);
      return fallback;
    }
  }

  static safeToLowerCase(value: any): string {
    return this.safeStringOperation(value, (val) => val.toLowerCase(), '');
  }

  static safeIncludes(value: any, searchTerm: any): boolean {
    try {
      const stringValue = this.safeToLowerCase(value);
      const searchString = this.safeToLowerCase(searchTerm);
      return stringValue.includes(searchString);
    } catch (error) {
      safeCatch('ErrorHandler.safeIncludes')(error);
      return false;
    }
  }

  static safeReplace(value: any, searchValue: string | RegExp, replaceValue: string): string {
    return this.safeStringOperation(value, (val) => val.replace(searchValue, replaceValue), '');
  }

  static validateApiResponse<T>(response: any, expectedDataKey?: string): SafeApiResponse<T> {
    try {
      // Check if response exists
      if (!response) {
        return {
          success: false,
          error: {
            message: 'No response received from server',
            code: 'NO_RESPONSE'
          }
        };
      }

      // Check if response has success property
      if (typeof response.success === 'boolean' && !response.success) {
        return {
          success: false,
          error: {
            message: response.message || 'Request failed',
            code: 'API_ERROR',
            details: response
          }
        };
      }

      // Check if response has data
      if (expectedDataKey) {
        if (!response.data || !response.data[expectedDataKey]) {
          return {
            success: false,
            error: {
              message: `Expected data key '${expectedDataKey}' not found in response`,
              code: 'MISSING_DATA_KEY'
            }
          };
        }
      } else if (!response.data) {
        return {
          success: false,
          error: {
            message: 'No data received from server',
            code: 'NO_DATA'
          }
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const safeErrorHandler = safeCatch('ErrorHandler.validateApiResponse');
      const safeError = safeErrorHandler(error);
      return {
        success: false,
        error: {
          message: 'Failed to validate response',
          code: 'VALIDATION_ERROR',
          details: safeError
        }
      };
    }
  }

  static createFallbackData<T>(_type: 'courses' | 'books' | 'liveClasses' | 'users'): T[] {
    // Return empty arrays - no fallback data needed
    return [] as T[];
  }

  static getUserFriendlyMessage(error: ApiError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please log in again.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      case 'SERVER_ERROR':
        return 'Server is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

export default ErrorHandler;
