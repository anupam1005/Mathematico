import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';
import { installRefreshInterceptor, isRequestCancelled } from './refreshInterceptor';

type ApiErrorCode =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'API_ERROR'
  | 'CANCELLED';

export interface ApiError {
  message: string;
  code: ApiErrorCode;
  status?: number;
  data?: any;
  originalError?: unknown;
}

const DEFAULT_TIMEOUT_MS = 20000;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const normalizeApiError = async (error: AxiosError): Promise<ApiError> => {
  if (isRequestCancelled(error)) {
    return {
      message: 'Request cancelled',
      code: 'CANCELLED',
      originalError: error,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: 'Request timeout. Please try again.',
      code: 'TIMEOUT',
      originalError: error,
    };
  }

  if (error.response) {
    const status = error.response.status;
    const data = (error.response.data || {}) as any;

    if (status === 401) {
      return {
        message: data?.message || 'Session expired. Please login again.',
        code: 'UNAUTHORIZED',
        status,
        data,
        originalError: error,
      };
    }

    return {
      message: data?.message || 'Request failed. Please try again.',
      code: 'API_ERROR',
      status,
      data,
      originalError: error,
    };
  }

  if (error.code === 'ERR_NETWORK' || !error.response) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      originalError: error,
    };
  }

  return {
    message: error.message || 'Request failed. Please try again.',
    code: 'API_ERROR',
    originalError: error,
  };
};

const refreshHandle = installRefreshInterceptor(api, {
  timeoutMs: DEFAULT_TIMEOUT_MS,
  healthPath: `${API_PATHS.auth}/health`,
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => Promise.reject(await normalizeApiError(error))
);

const normalizePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`;
};

const buildUrl = (basePath: string, path?: string): string => {
  const normalizedBase = normalizePath(basePath).replace(/\/+$/, '');

  if (!path) return normalizedBase;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = normalizePath(path);

  if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizedPath;
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

export const createRequestController = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
};

export const runBackendHealthCheck = () => refreshHandle.checkHealth();

export const ejectApiInterceptors = () => refreshHandle.eject();

export default api;
