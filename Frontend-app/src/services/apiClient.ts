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

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
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
    } catch {
      // ignore token read failures
    }
    return config;
  },
  () => Promise.reject({ message: 'Request preparation failed' })
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if response data exists and is valid JSON-like
    if (!response.data) {
      // Only warn in development
      if (__DEV__) {
        console.warn('API Client: Response has no data');
      }
      return response;
    }
    
    // Log successful responses only in development
    if (__DEV__ && response.status >= 200 && response.status < 300) {
      console.log('API Client: Success response:', {
        status: response.status,
        url: response.config.url,
        hasData: !!response.data
      });
    }
    
    return response;
  },
  async (error: unknown) => {
    const safeError = createSafeError(error);
    
    // Enhanced error logging - only in development
    if (__DEV__) {
      console.error('API Client: Error intercepted:', {
        message: safeError.message,
        status: safeError.response?.status,
        url: safeError.config?.url,
        responseData: safeError.response?.data,
        isString: typeof safeError.response?.data === 'string'
      });
    }
    
    // Handle specific JSON parsing errors
    if (safeError.message && safeError.message.includes('JSON Parse error')) {
      if (__DEV__) {
        console.error('API Client: JSON parsing error detected');
      }
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

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

const buildUrl = (basePath: string, path?: string) => {
  const normalizedBase = basePath.replace(/\/$/, '');
  if (!path) return normalizedBase;
  return `${normalizedBase}${normalizePath(path)}`;
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
