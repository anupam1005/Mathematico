import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';
import { isRequestCancelled } from './refreshInterceptor';

type ApiErrorCode =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'API_ERROR'
  | 'CANCELLED';

export interface ApiError {
  message?: string;
  code: ApiErrorCode;
  status?: number;
  data?: any;
  requestUrl?: string;
  method?: string;
  isNetworkError?: boolean;
  originalError?: unknown;
}

// ✅ SAFE AXIOS INSTANCE (NO MUTATION RISK)
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const healthApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

if (__DEV__) {
  try {
    console.log('[API] BASE URL:', api.defaults.baseURL);
  } catch {}
}

const toAbsoluteRequestUrl = (config: AxiosRequestConfig): string => {
  const rawUrl = String(config.url ?? '').trim();
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const base = String(config.baseURL || API_BASE_URL).replace(/\/+$/, '');
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${base}${path}`;
};

const safeMethodFromConfig = (config: AxiosRequestConfig | undefined): string => {
  return config?.method ? String(config.method).toUpperCase() : 'UNKNOWN';
};

const isInvalidRequestConfig = (config: AxiosRequestConfig): boolean => {
  const rawUrl = String(config.url || '');
  if (!rawUrl || rawUrl === '/') return true;
  return false;
};

const normalizeApiError = async (error: AxiosError): Promise<ApiError> => {
  const requestUrl = toAbsoluteRequestUrl(error.config || {});
  const method = safeMethodFromConfig(error.config);

  if (isRequestCancelled(error)) {
    return {
      message: error.message,
      code: 'CANCELLED',
      requestUrl,
      method,
      isNetworkError: false,
      originalError: error,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: error.message,
      code: 'TIMEOUT',
      requestUrl,
      method,
      isNetworkError: true,
      originalError: error,
    };
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;

    return {
      message: data?.message,
      code: status === 401 ? 'UNAUTHORIZED' : 'API_ERROR',
      status,
      data,
      requestUrl,
      method,
      isNetworkError: false,
      originalError: error,
    };
  }

  return {
    message: error.message,
    code: 'NETWORK_ERROR',
    requestUrl,
    method,
    isNetworkError: true,
    originalError: error,
  };
};

// ❌ NO HEADER MUTATION ANYWHERE

api.interceptors.request.use(
  (config) => {
    if (!config.url || config.url.trim() === '' || config.url === '/') {
      return Promise.reject(new Error('Invalid API request'));
    }

    console.log('[API] Request:', config.url);

    return {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MathematicoApp/1.0 (Android)',
      },
    };
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status);
    return response;
  },
  async (error: AxiosError) => {
    console.log('[API] Error:', error?.message);
    return Promise.reject(await normalizeApiError(error));
  }
);

const buildUrl = (basePath: string, path?: string): string => {
  if (!path || path === '/') {
    throw new Error('Invalid API path');
  }

  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
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

  request: <T = any>(config: AxiosRequestConfig) => {
    if (isInvalidRequestConfig(config)) {
      return Promise.reject(new Error('Invalid API request'));
    }

    return api.request<T>({
      ...config,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  },
});

export const createRequestController = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
};

export const runBackendHealthCheck = async (): Promise<boolean> => {
  try {
    await healthApi.get(`${API_PATHS.auth}/health`);
    return true;
  } catch (error) {
    console.error('[API:HEALTH_CHECK_FAILED]', error);
    throw error;
  }
};

export default api;