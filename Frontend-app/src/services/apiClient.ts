import axios, {
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from '../config';
import { Storage } from '../utils/storage';
import { createSafeError } from '../utils/safeError';
import Constants from 'expo-constants';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await Storage.getItem('authToken');
      if (token) {
        const headers = AxiosHeaders.from(config.headers ?? {});
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
      }
    } catch (error) {
      // Token retrieval failed
    }
    return config;
  },
  (_error) => {
    return Promise.reject({ message: 'Request preparation failed' });
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if response data exists and is valid JSON-like
    if (!response.data) {
      return response;
    }

    return response;
  },
  async (error: unknown) => {
    const safeError = createSafeError(error);
    
    // Handle specific JSON parsing errors
    if (safeError.message && safeError.message.includes('JSON Parse error')) {
      // Constants.expoConfig access to prevent Hermes crashes
      try {
        const extraConfig = Constants?.expoConfig?.extra;
        void !!(extraConfig && typeof extraConfig === 'object' && 'EXPO_PUBLIC_ENV' in extraConfig && extraConfig.EXPO_PUBLIC_ENV === 'production');
      } catch (_error) {
        // Assume production if Constants access fails
      }
      
      // JSON parsing error detected in non-production
      return Promise.reject({
        ...safeError,
        message: 'Server returned invalid response. Please check backend logs.',
        isJsonParseError: true
      });
    }
    
    if (safeError.response?.status === 401) {
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
        await Storage.deleteItem('user');
      } catch {
        // ignore cleanup failures
      }
    }
    return Promise.reject(safeError);
  }
);

const normalizePath = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized;
};

const buildUrl = (basePath: string, path?: string) => {
  // Remove trailing slash from base path
  const normalizedBase = basePath.replace(/\/$/, '');
  
  // If no path provided, return just the base
  if (!path) return normalizedBase;
  
  // Normalize the path to ensure it starts with /
  const normalizedPath = normalizePath(path);
  
  // CRITICAL FIX: Prevent double path concatenation
  // If basePath already contains the path, don't append it again
  if (normalizedBase.endsWith(normalizedPath)) {
    return normalizedBase;
  }
  
  // Concatenate base and path
  return `${normalizedBase}${normalizedPath}`;
};

export const withBasePath = (basePath: string) => ({
  get: <T = any>(path: string, config?: AxiosRequestConfig) =>
    api.get<T>(buildUrl(basePath, path), config),
  delete: <T = any>(path: string, config?: AxiosRequestConfig) =>
    api.delete<T>(buildUrl(basePath, path), config),
  post: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(buildUrl(basePath, path), data, config),
  put: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(buildUrl(basePath, path), data, config),
  patch: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch<T>(buildUrl(basePath, path), data, config),
  request: <T = any>(config: AxiosRequestConfig) =>
    api.request<T>({
      ...config,
      url: buildUrl(basePath, config.url || ''),
    }),
});

export default api;
