import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from 'axios';
import { API_BASE_URL } from '../config';
import { Storage } from '../utils/storage';

// PRODUCTION-SAFE: Create base axios instance with minimal configuration
// Avoid any potential frozen object mutations
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  validateStatus: (status: number) => status < 500,
});

// PRODUCTION-SAFE: Request interceptor without AxiosHeaders mutations
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await Storage.getItem('authToken');
      
      // PRODUCTION SAFE: Never use AxiosHeaders constructor - causes Hermes mutations
      // Always work with plain objects to avoid frozen object errors
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Add authorization token if available
      if (token && typeof token === 'string') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // PRODUCTION SAFE: Preserve existing headers safely
      if (config.headers && typeof config.headers === 'object') {
        // HERMES SAFE: Never spread config.headers - it could be a frozen AxiosHeaders instance
        // Instead, manually copy only primitive string values to avoid frozen object mutations
        Object.keys(config.headers).forEach(key => {
          const value = config.headers[key];
          if (value !== undefined && value !== null && key !== 'Authorization') {
            // Only copy primitive string values - never objects or functions
            if (typeof value === 'string') {
              headers[key] = value;
            }
          }
        });
      }
      
      // PRODUCTION SAFE: Cast to AxiosRequestHeaders to satisfy TypeScript
      // This is safe because we're using plain objects which Hermes handles correctly
      config.headers = headers as AxiosRequestHeaders;
      
      // PRODUCTION DEBUG: Log final request URL
      const finalUrl = `${config.baseURL || ''}${config.url || ''}`;
      console.log('API_REQUEST_URL', finalUrl);
      
    } catch (error) {
      // Token retrieval failed - ensure safe headers
      console.warn('Token retrieval failed:', error);
      
      // PRODUCTION SAFE: Always ensure headers are plain objects
      const safeHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      config.headers = safeHeaders as AxiosRequestHeaders;
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

// PRODUCTION-SAFE: Response interceptor without frozen object mutations
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return response as-is without any mutations
    return response;
  },
  async (error: unknown) => {
    // PRODUCTION SAFE: Create completely new error object
    // Never reference or mutate frozen objects from Axios
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
      // PRODUCTION SAFE: Only extract primitive values, never objects
      if (error && typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        
        // Extract message safely
        if (errorObj.message && typeof errorObj.message === 'string') {
          safeError.message = errorObj.message;
        }
        
        // Extract response data safely without object references
        if (errorObj.response && typeof errorObj.response === 'object') {
          const responseStatus = errorObj.response.status;
          const responseData = errorObj.response.data;
          const responseStatusText = errorObj.response.statusText;
          
          // Only store primitive values
          if (typeof responseStatus === 'number') {
            safeError.status = responseStatus;
            safeError.response = safeError.response || {};
            safeError.response.status = responseStatus;
          }
          
          if (typeof responseStatusText === 'string') {
            safeError.response = safeError.response || {};
            safeError.response.statusText = responseStatusText;
          }
          
          // Store data if it's serializable
          if (responseData !== undefined && responseData !== null) {
            try {
              // Try to serialize to ensure it's safe
              const serializedData = JSON.parse(JSON.stringify(responseData));
              safeError.response = safeError.response || {};
              safeError.response.data = serializedData;
            } catch {
              // If serialization fails, store only the message
              if (responseData && typeof responseData.message === 'string') {
                safeError.response = safeError.response || {};
                safeError.response.data = { message: responseData.message };
              }
            }
          }
        }
        
        // Extract code safely
        if (errorObj.code && typeof errorObj.code === 'string') {
          safeError.code = errorObj.code;
        }
        
        // Detect network errors
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
        
        // Detect auth errors
        if (safeError.status === 401) {
          safeError.isAuthError = true;
        }
      }
    } catch (processingError) {
      // If error processing fails, create minimal safe error
      console.warn('Error processing failed:', processingError);
      safeError.message = 'Request failed';
      safeError.isNetworkError = true;
    }
    
    // Handle 401 unauthorized - clear tokens
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
