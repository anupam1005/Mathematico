import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiErrorHandler } from './error-handler';

/**
 * Type for API response
 */
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number | null;
};

/**
 * Type for paginated API response
 */
type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Default API configuration
 */
const defaultConfig: AxiosRequestConfig = {
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  timeout: 30000, // 30 seconds
};

/**
 * Create an API client with default configuration
 */
const createApiClient = (baseURL: string) => {
  const client = axios.create({
    ...defaultConfig,
    baseURL,
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config) => {
      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF token if available
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          );

          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);

          // Update the original request header
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Retry the original request
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, log the user out
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login?session=expired';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Get CSRF token from cookies
 */
const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Make an API request with error handling
 * @param method HTTP method
 * @param url API endpoint
 * @param data Request data
 * @param config Additional axios config
 * @returns Promise with typed response
 */
const apiRequest = async <T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<ApiResponse<T>> => {
  try {
    const client = createApiClient(import.meta.env.VITE_API_URL);
    const response = await client.request<T>({
      method,
      url,
      data,
      ...config,
    });

    return {
      data: response.data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    const apiError = ApiErrorHandler.handleError(error);
    return {
      data: null,
      error: apiError.message,
      status: apiError.status || 500,
    };
  }
};

/**
 * GET request
 */
const get = <T>(url: string, config?: AxiosRequestConfig) =>
  apiRequest<T>('get', url, undefined, config);

/**
 * POST request
 */
const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  apiRequest<T>('post', url, data, config);

/**
 * PUT request
 */
const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  apiRequest<T>('put', url, data, config);

/**
 * PATCH request
 */
const patch = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  apiRequest<T>('patch', url, data, config);

/**
 * DELETE request
 */
const del = <T>(url: string, config?: AxiosRequestConfig) =>
  apiRequest<T>('delete', url, undefined, config);

export { get, post, put, patch, del, createApiClient };
export type { ApiResponse, PaginatedResponse };
