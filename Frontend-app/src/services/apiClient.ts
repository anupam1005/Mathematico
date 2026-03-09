// PRODUCTION: Use strict API_BASE_URL from config
// No fallbacks - will throw if invalid during config import
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from 'axios';
import { API_BASE_URL } from '../config';
import { Storage } from '../utils/storage';

// PRODUCTION DEBUG: Log API client initialization
console.log('API_CLIENT_INITIALIZED with baseURL:', API_BASE_URL);

// PRODUCTION: Create axios instance with strict base URL
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  validateStatus: (status: number) => status < 500,
});

// PRODUCTION: Request interceptor with complete Hermes safety
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await Storage.getItem('authToken');
      
      // HERMES SAFE: Create completely new config object - avoid any frozen object access
      const newConfig: InternalAxiosRequestConfig = {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        } as AxiosRequestHeaders,
      };
      
      // Add authorization token if available
      if (token && typeof token === 'string') {
        newConfig.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // HERMES SAFE: Never access config.headers directly - it might be frozen
      // Instead, create fresh headers and copy only safe config properties
      if (config.method) {
        newConfig.method = config.method;
      }
      if (config.url) {
        newConfig.url = config.url;
      }
      if (config.data) {
        newConfig.data = config.data;
      }
      if (config.params) {
        newConfig.params = config.params;
      }
      if (config.timeout) {
        newConfig.timeout = config.timeout;
      }
      
      // PRODUCTION DEBUG: Log final request URL
      const finalUrl = `${newConfig.baseURL || ''}${newConfig.url || ''}`;
      console.log('API_REQUEST_URL:', finalUrl);
      
      return newConfig;
      
    } catch (error) {
      console.warn('Request interceptor failed:', error);
      
      // PRODUCTION: Return safe config even on error
      return {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        } as AxiosRequestHeaders,
      } as InternalAxiosRequestConfig;
    }
  },
  (error) => {
    return Promise.reject({ 
      message: 'Request preparation failed',
      isNetworkError: true 
    });
  }
);

// PRODUCTION: Response interceptor with safe error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: unknown) => {
    // PRODUCTION: Create safe error object without frozen references
    const safeError: {
      message: string;
      response?: {
        status?: number;
        data?: any;
        statusText?: string;
      };
      status?: number;
      code?: string;
      isNetworkError?: boolean;
      isAuthError?: boolean;
    } = {
      message: 'Request failed',
    };

    try {
      if (error && typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        
        // Extract primitive values safely
        if (errorObj.message && typeof errorObj.message === 'string') {
          safeError.message = errorObj.message;
        }
        
        if (errorObj.response && typeof errorObj.response === 'object') {
          const responseStatus = errorObj.response.status;
          const responseData = errorObj.response.data;
          const responseStatusText = errorObj.response.statusText;
          
          if (typeof responseStatus === 'number') {
            safeError.status = responseStatus;
            safeError.response = safeError.response || {};
            safeError.response.status = responseStatus;
          }
          
          if (typeof responseStatusText === 'string') {
            safeError.response = safeError.response || {};
            safeError.response.statusText = responseStatusText;
          }
          
          if (responseData !== undefined && responseData !== null) {
            try {
              const serializedData = JSON.parse(JSON.stringify(responseData));
              safeError.response = { ...safeError.response };
              safeError.response.data = serializedData;
            } catch {
              if (responseData && typeof responseData.message === 'string') {
                safeError.response = { ...safeError.response };
                safeError.response.data = { message: responseData.message };
              }
            }
          }
        }
        
        // HERMES SAFE: Wrap error.code access in try-catch to avoid read-only property issues
        try {
          if (errorObj.code && typeof errorObj.code === 'string') {
            safeError.code = errorObj.code;
          }
        } catch (codeError) {
          // Ignore read-only property access errors - this is what causes the 'NONE' error
          console.warn('Could not access error.code property:', codeError);
        }
        
        // Detect error types - HERMES SAFE: Wrap safeError.code access in try-catch
        let isNetworkErrorByCode = false;
        try {
          if (safeError.code === 'ECONNABORTED' ||
              safeError.code === 'ENOTFOUND' ||
              safeError.code === 'ECONNRESET') {
            isNetworkErrorByCode = true;
          }
        } catch (codeAccessError) {
          // Ignore read-only property access errors
        }
        
        if (
          safeError.message.includes('Network') ||
          safeError.message.includes('ECONNREFUSED') ||
          safeError.message.includes('timeout') ||
          isNetworkErrorByCode
        ) {
          safeError.isNetworkError = true;
        }
        
        if (safeError.status === 401) {
          safeError.isAuthError = true;
        }
      }
    } catch (processingError) {
      console.warn('Error processing failed:', processingError);
      safeError.message = 'Request failed';
      safeError.isNetworkError = true;
    }
    
    // Handle 401 - clear tokens
    if (safeError.isAuthError || safeError.status === 401) {
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
        await Storage.deleteItem('user');
      } catch {
        // Ignore cleanup failures
      }
    }
    
    return Promise.reject(safeError);
  }
);

// PRODUCTION-SAFE: Path building utilities
const normalizePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`;
};

const buildUrl = (basePath: string, path?: string): string => {
  // Remove trailing slash from base path
  const normalizedBase = basePath.replace(/\/$/, '');
  
  // If no path provided, return just the base
  if (!path) return normalizedBase;
  
  // Normalize the path to ensure it starts with /
  const normalizedPath = normalizePath(path);
  
  // Prevent double path concatenation
  if (normalizedBase.endsWith(normalizedPath)) {
    return normalizedBase;
  }
  
  // Concatenate base and path
  return `${normalizedBase}${normalizedPath}`;
};

// PRODUCTION-SAFE: API client wrapper with complete error isolation
// No frozen object mutations, no AxiosHeaders usage
export const withBasePath = (basePath: string) => ({
  get: <T = any>(path: string, config?: AxiosRequestConfig) => {
    return api.get<T>(buildUrl(basePath, path), config);
  },
  delete: <T = any>(path: string, config?: AxiosRequestConfig) => {
    return api.delete<T>(buildUrl(basePath, path), config);
  },
  post: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) => {
    return api.post<T>(buildUrl(basePath, path), data, config);
  },
  put: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) => {
    return api.put<T>(buildUrl(basePath, path), data, config);
  },
  patch: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) => {
    return api.patch<T>(buildUrl(basePath, path), data, config);
  },
  request: <T = any>(config: AxiosRequestConfig) => {
    return api.request<T>({
      ...config,
      url: buildUrl(basePath, config.url || ''),
    });
  },
});

export default api;
