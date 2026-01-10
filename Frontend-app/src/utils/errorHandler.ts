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
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.debug(message, ...args);
  }
};

export class ErrorHandler {
  static handleApiError(error: any): ApiError {
    // Safely log error without accessing read-only properties
    // The global error handler will safely extract the message
    console.error('API Error:', error);
    
    // Network error - safely check for response property using descriptor
    let hasResponse = false;
    let responseValue: any = null;
    try {
      if (error && typeof error === 'object' && 'response' in error) {
        const responseDesc = Object.getOwnPropertyDescriptor(error, 'response');
        if (responseDesc && 'value' in responseDesc && responseDesc.value !== undefined && responseDesc.value !== null) {
          hasResponse = true;
          responseValue = responseDesc.value;
        }
      }
    } catch (e) {
      hasResponse = false;
    }
    
    if (!hasResponse) {
      return {
        message: 'Network error. Please check your internet connection.',
        status: 0,
        code: 'NETWORK_ERROR'
      };
    }
    
    // HTTP error - safely extract status and data using descriptors
    let status: number | undefined;
    let data: any;
    
    try {
      if (responseValue && typeof responseValue === 'object') {
        const statusDesc = Object.getOwnPropertyDescriptor(responseValue, 'status');
        if (statusDesc && 'value' in statusDesc) {
          status = Number(statusDesc.value);
        }
        
        const dataDesc = Object.getOwnPropertyDescriptor(responseValue, 'data');
        if (dataDesc && 'value' in dataDesc) {
          data = dataDesc.value;
        }
      }
    } catch (e) {
      // Property extraction failed
    }
    
    // Safely extract message from data if it exists
    let dataMessage: string | undefined;
    try {
      if (data && typeof data === 'object' && 'message' in data) {
        const dataMessageDesc = Object.getOwnPropertyDescriptor(data, 'message');
        if (dataMessageDesc && 'value' in dataMessageDesc) {
          dataMessage = String(dataMessageDesc.value);
        }
      }
    } catch (e) {
      // Message extraction from data failed
    }
    
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
          code: 'UNAUTHORIZED',
          details: data
        };
      case 403:
        return {
          message: 'Access denied. You do not have permission to perform this action.',
          status,
          code: 'FORBIDDEN',
          details: data
        };
      case 404:
        return {
          message: 'Resource not found.',
          status,
          code: 'NOT_FOUND',
          details: data
        };
      case 422:
        return {
          message: dataMessage || 'Validation error. Please check your input.',
          status,
          code: 'VALIDATION_ERROR',
          details: data
        };
      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          status,
          code: 'RATE_LIMITED',
          details: data
        };
      case 500:
        return {
          message: 'Server error. Please try again later.',
          status,
          code: 'SERVER_ERROR',
          details: data
        };
      default:
        return {
          message: dataMessage || 'An unexpected error occurred.',
          status,
          code: 'UNKNOWN_ERROR',
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
      console.warn('String operation failed:', error);
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
      console.warn('String includes operation failed:', error);
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
      console.error('Response validation error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to validate response',
          code: 'VALIDATION_ERROR',
          details: error
        }
      };
    }
  }

  static createFallbackData<T>(type: 'courses' | 'books' | 'liveClasses' | 'users'): T[] {
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
