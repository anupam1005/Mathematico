import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { Storage } from '../utils/storage';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Centralized auth token & error handling

// Inject Authorization header from SecureStore/AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await Storage.getItem<string>('authToken', false);
      if (token && typeof token === 'string' && token.length > 0) {
        config.headers = config.headers || {};
        // Never override an explicit Authorization header
        if (!('Authorization' in config.headers)) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Swallow – network calls should still proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Normalize errors and handle auth failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network-level errors (no response)
    if (!error.response) {
      return Promise.reject({
        message: 'Network error - please check your connection and try again.',
        code: 'NETWORK_ERROR',
      });
    }

    const { status, data } = error.response;

    if (status === 401) {
      // Clear tokens on unauthorized so the app can treat user as logged out
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
        await Storage.deleteItem('user');
      } catch {
      }

      return Promise.reject({
        message: data?.message || 'Your session has expired. Please log in again.',
        code: 'UNAUTHORIZED',
        status,
      });
    }

    return Promise.reject({
      message: data?.message || 'Request failed. Please try again.',
      code: 'API_ERROR',
      status,
      data,
    });
  },
);

const normalizePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`;
};

const buildUrl = (basePath: string, path?: string): string => {
  const normalizedBase = basePath.replace(/\/$/, '');
  
  if (!path) return normalizedBase;
  
  const normalizedPath = normalizePath(path);
  
  if (normalizedBase.endsWith(normalizedPath)) {
    return normalizedBase;
  }
  
  return `${normalizedBase}${normalizedPath}`;
};

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
    const url = buildUrl(basePath, config.url || '');
    return api.request<T>({ ...config, url });
  },
});

export default api;
