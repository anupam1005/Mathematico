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

// PRODUCTION: Request interceptor with Hermes-safe header handling
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await Storage.getItem('authToken');
      
      // HERMES SAFE: Create completely new header object - never mutate existing
      const newHeaders: Record<string, string | undefined> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Add authorization token if available
      if (token && typeof token === 'string') {
        newHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      // HERMES SAFE: Copy existing headers without mutation
      if (config.headers && typeof config.headers === 'object') {
        // Extract only primitive string values safely
        const headerEntries = Object.entries(config.headers);
        for (const [key, value] of headerEntries) {
          if (key !== 'Authorization' && value !== undefined && value !== null) {
            if (typeof value === 'string') {
              newHeaders[key] = value;
            }
          }
        }
      }
      
      // PRODUCTION: Replace headers with new object (no mutation)
      config.headers = newHeaders as AxiosRequestHeaders;
      
      // PRODUCTION DEBUG: Log final request URL
      const finalUrl = `${config.baseURL || ''}${config.url || ''}`;
      console.log('API_REQUEST_URL:', finalUrl);
      
    } catch (error) {
      console.warn('Token retrieval failed:', error);
      
      // PRODUCTION: Ensure safe headers even on error
      config.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      } as AxiosRequestHeaders;
    }
    
    return config;
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
        
        if (errorObj.code && typeof errorObj.code === 'string') {
          safeError.code = errorObj.code;
        }
        
        // Detect error types
        if (
          safeError.message.includes('Network') ||
          safeError.message.includes('ECONNREFUSED') ||
          safeError.message.includes('timeout') ||
          safeError.code === 'ECONNABORTED' ||
          safeError.code === 'ENOTFOUND' ||
          safeError.code === 'ECONNRESET'
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
