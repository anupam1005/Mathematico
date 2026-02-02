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
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    const safeError = createSafeError(error);
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
