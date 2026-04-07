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
  message?: string;
  code: ApiErrorCode;
  status?: number;
  data?: any;
  requestUrl?: string;
  method?: string;
  isNetworkError?: boolean;
  originalError?: unknown;
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const healthApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
  },
});

if (__DEV__) {
  try {
    console.log('[API] BASE URL:', api.defaults.baseURL);
  } catch {
    // ignore
  }
}

const toAbsoluteRequestUrl = (config: AxiosRequestConfig): string => {
  const rawUrl = String(config.url ?? '').trim();
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  const base = String(config.baseURL || API_BASE_URL).replace(/\/+$/, '');
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${base}${path}`;
};

const safeMethodFromConfig = (config: AxiosRequestConfig | undefined): string => {
  const raw = config?.method;
  if (!raw) return 'UNKNOWN';
  return String(raw).toUpperCase();
};

const isRootLikeUrl = (url: string): boolean => {
  const trimmed = url.trim();
  if (!trimmed || trimmed === '/') return true;
  if (/^https?:\/\/[^/]+\/?$/i.test(trimmed)) return true;
  return false;
};

const isInvalidRequestConfig = (config: AxiosRequestConfig): boolean => {
  const rawUrl = String(config.url || '');
  if (isRootLikeUrl(rawUrl)) return true;
  const absolute = toAbsoluteRequestUrl(config);
  if (isRootLikeUrl(absolute)) return true;
  return false;
};

/** Own-property only — avoid triggering Hermes issues from inherited `code` getters on DOM errors. */
const readAxiosErrorCodeSafe = (error: unknown): string | undefined => {
  try {
    if (error == null || typeof error !== 'object') return undefined;
    const desc = Object.getOwnPropertyDescriptor(error, 'code');
    if (!desc || desc.value === undefined || desc.value === null) return undefined;
    const v = desc.value;
    return typeof v === 'string' ? v : undefined;
  } catch {
    return undefined;
  }
};

const normalizeApiError = async (error: AxiosError): Promise<ApiError> => {
  const safeCode = readAxiosErrorCodeSafe(error);
  const requestUrl = toAbsoluteRequestUrl(error.config || {});
  const method = safeMethodFromConfig(error.config);
  const isHeadersMutationRuntimeError = /read-only property\s+'NONE'/i.test(String(error.message || ''));
  const isNetworkError = !error.response || safeCode === 'ERR_NETWORK';

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

  const looksLikeTimeout =
    safeCode === 'ECONNABORTED' ||
    /timeout of \d+ms exceeded|exceeded the time limit/i.test(String(error.message || ''));
  if (looksLikeTimeout) {
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
    const data = (error.response.data || {}) as any;
    const backendMessage = typeof data?.message === 'string' ? data.message : undefined;

    if (status === 401) {
      return {
        message: backendMessage,
        code: 'UNAUTHORIZED',
        status,
        data,
        requestUrl,
        method,
        isNetworkError: false,
        originalError: error,
      };
    }

    return {
      message: backendMessage,
      code: 'API_ERROR',
      status,
      data,
      requestUrl,
      method,
      isNetworkError: false,
      originalError: error,
    };
  }

  if (safeCode === 'ERR_NETWORK' || !error.response) {
    if (isHeadersMutationRuntimeError) {
      return {
        message: error.message,
        code: 'API_ERROR',
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
  }

  return {
    message: error.message,
    code: 'API_ERROR',
    requestUrl,
    method,
    isNetworkError,
    originalError: error,
  };
};

const refreshHandle = installRefreshInterceptor(api, {
  timeoutMs: 20000,
});

api.interceptors.request.use(
  (config) => {
    if (!config.url || config.url === '/' || config.url.trim() === '') {
      console.error('❌ INVALID REQUEST URL:', config);
      return Promise.reject(new Error('Invalid API request'));
    }

    console.log('[API] Request:', config.url);
    if (config.url && /\/api\/v1\/auth\/(login|register)/i.test(String(config.url))) {
      console.warn('[AUTH_TRANSPORT] unexpected axios auth route:', config.url);
    }

    return {
      ...config,
      metadata: { startedAt: Date.now() },
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

const normalizePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`;
};

const validateApiV1Path = (path: string, label: string): string => {
  const normalized = normalizePath(path);
  if (!normalized.startsWith('/api/v1/')) {
    throw new Error(`Invalid API ${label}: expected /api/v1/* path`);
  }
  return normalized;
};

const buildUrl = (basePath: string, path?: string): string => {
  const normalizedBase = validateApiV1Path(basePath, 'basePath').replace(/\/+$/, '');

  if (!path || path === '/' || path === '') {
    throw new Error('Invalid API path: empty path not allowed');
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = normalizePath(path);

  if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('/api/')) {
    return validateApiV1Path(normalizedPath, 'path');
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
    if (isInvalidRequestConfig(config)) {
      return Promise.reject(new Error('Invalid API request: empty or root URL'));
    }
    const url = buildUrl(basePath, config.url);
    const safeConfig: AxiosRequestConfig = {
      ...config,
      url,
      method: config.method,
      headers: config.headers,
    };
    if (!safeConfig.url || safeConfig.url === '/' || safeConfig.url === '') {
      console.error('❌ FATAL: EMPTY URL BEFORE DISPATCH', safeConfig);
      return Promise.reject(new Error('Invalid request: empty URL'));
    }
    if (__DEV__) {
      console.log('DISPATCHING REQUEST:', {
        url: safeConfig.url,
        baseURL: safeConfig.baseURL || api.defaults.baseURL,
        full: `${String(safeConfig.baseURL || api.defaults.baseURL || '')}${String(safeConfig.url || '')}`,
        method: safeConfig.method,
      });
    }
    return api.request<T>(safeConfig);
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

export const ejectApiInterceptors = () => refreshHandle.eject();

export default api;
