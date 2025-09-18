import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authService } from '@/services/auth.service';

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, {
        error: error.message,
        response: error.response?.data,
        config: error.config
      });
    }
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        await authService.refreshToken();
        
        // Retry the original request with new token
        const token = authService.getToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login if refresh fails
        authService.forceReAuth();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }
    
    // Handle specific HTTP status codes
    switch (error.response.status) {
      case 400:
        console.error('Bad request:', error.response.data);
        break;
      case 403:
        console.error('Forbidden:', error.response.data);
        break;
      case 404:
        console.error('Not found:', error.response.data);
        break;
      case 422:
        console.error('Validation error:', error.response.data);
        break;
      case 500:
        console.error('Server error:', error.response.data);
        break;
      default:
        console.error(`HTTP ${error.response.status}:`, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors with better error messages
export const handleApiError = (error: any, context: string = 'API call'): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (data?.message) {
        return `${context} failed: ${data.message}`;
      }
      
      switch (status) {
        case 400:
          return `${context} failed: Bad request`;
        case 401:
          return `${context} failed: Please log in again`;
        case 403:
          return `${context} failed: Access denied`;
        case 404:
          return `${context} failed: Resource not found`;
        case 422:
          return `${context} failed: Validation error`;
        case 500:
          return `${context} failed: Server error`;
        default:
          return `${context} failed: HTTP ${status}`;
      }
    } else if (error.request) {
      // Request was made but no response received
      return `${context} failed: No response from server`;
    } else {
      // Something else happened
      return `${context} failed: ${error.message}`;
    }
  }
  
  // Non-axios error
  return `${context} failed: ${error.message || 'Unknown error'}`;
};

// Export the configured api instance
export default api;

// Export types for use in other files
export type { AxiosRequestConfig, AxiosResponse, AxiosError };
