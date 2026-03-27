import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponseHeaders, RawAxiosRequestHeaders } from 'axios';
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
  requestUrl?: string;
  method?: string;
  isNetworkError?: boolean;
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

const toAbsoluteRequestUrl = (config: AxiosRequestConfig): string => {
  const rawUrl = String(config.url || '');
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  const base = String(config.baseURL || API_BASE_URL).replace(/\/+$/, '');
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${base}${path}`;
};

const toRecordHeaders = (headers: unknown): Record<string, string> => {
  if (!headers || typeof headers !== 'object') return {};
  const source = headers as RawAxiosRequestHeaders | AxiosResponseHeaders | Record<string, unknown>;
  const result: Record<string, string> = {};
  Object.entries(source).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    result[k] = String(v);
  });
  return result;
};

const sanitizeHeaders = (headers: unknown): Record<string, string> => {
  const normalized = toRecordHeaders(headers);
  const redacted: Record<string, string> = {};
  Object.entries(normalized).forEach(([k, v]) => {
    if (/authorization|cookie|token|secret|password/i.test(k)) {
      redacted[k] = '[REDACTED]';
    } else {
      redacted[k] = v;
    }
  });
  return redacted;
};

const estimatePayloadSizeBytes = (payload: unknown): number => {
  if (payload === null || payload === undefined) return 0;
  if (typeof payload === 'string') return payload.length;
  if (typeof FormData !== 'undefined' && payload instanceof FormData) return -1;
  try {
    return JSON.stringify(payload).length;
  } catch {
    return -1;
  }
};

const normalizeApiError = async (error: AxiosError): Promise<ApiError> => {
  const requestUrl = toAbsoluteRequestUrl(error.config || {});
  const method = String(error.config?.method || 'GET').toUpperCase();
  const isNetworkError = !error.response || error.code === 'ERR_NETWORK';

  if (isRequestCancelled(error)) {
    return {
      message: 'Request cancelled',
      code: 'CANCELLED',
      requestUrl,
      method,
      isNetworkError: false,
      originalError: error,
    };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: 'Request timeout. Please try again.',
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

    if (status === 401) {
      return {
        message: data?.message || 'Session expired. Please login again.',
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
      message: data?.message || 'Request failed. Please try again.',
      code: 'API_ERROR',
      status,
      data,
      requestUrl,
      method,
      isNetworkError: false,
      originalError: error,
    };
  }

  if (error.code === 'ERR_NETWORK' || !error.response) {
    return {
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      requestUrl,
      method,
      isNetworkError: true,
      originalError: error,
    };
  }

  return {
    message: error.message || 'Request failed. Please try again.',
    code: 'API_ERROR',
    requestUrl,
    method,
    isNetworkError,
    originalError: error,
  };
};

const refreshHandle = installRefreshInterceptor(api, {
  timeoutMs: DEFAULT_TIMEOUT_MS,
  healthPath: `${API_PATHS.auth}/health`,
});

api.interceptors.request.use(
  (config) => {
    try {
      const requestUrl = toAbsoluteRequestUrl(config);
      const method = String(config.method || 'GET').toUpperCase();
      const payloadSize = estimatePayloadSizeBytes(config.data);
      (config as any).metadata = { startedAt: Date.now() };
      console.log('[API:REQUEST]', {
        method,
        url: requestUrl,
        headers: sanitizeHeaders(config.headers),
        payloadSizeBytes: payloadSize,
      });
    } catch {
      // Keep request flow intact if diagnostic logging fails.
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    try {
      const requestUrl = toAbsoluteRequestUrl(response.config || {});
      const method = String(response.config?.method || 'GET').toUpperCase();
      const startedAt = (response.config as any)?.metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
      console.log('[API:RESPONSE]', {
        method,
        url: requestUrl,
        status: response.status,
        durationMs,
      });
    } catch {
      // Keep response flow intact if diagnostic logging fails.
    }
    return response;
  },
  async (error: AxiosError) => {
    try {
      const requestUrl = toAbsoluteRequestUrl(error.config || {});
      const method = String(error.config?.method || 'GET').toUpperCase();
      const startedAt = (error.config as any)?.metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
      console.log('[API:ERROR]', {
        message: error.message,
        code: error.code,
        method,
        url: requestUrl,
        status: error.response?.status,
        durationMs,
        kind: error.response ? 'server_error' : 'network_error',
        responseData: error.response?.data,
      });
    } catch {
      // Keep response flow intact if diagnostic logging fails.
    }
    return Promise.reject(await normalizeApiError(error));
  }
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

  if (normalizedPath.startsWith('/api/')) {
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
