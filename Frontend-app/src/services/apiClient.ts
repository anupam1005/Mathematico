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
  message?: string;
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
  adapter: 'fetch',
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const healthApi: AxiosInstance = axios.create({
  adapter: 'fetch',
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
  },
});

try {
  console.log('[API] BASE URL:', api.defaults.baseURL);
} catch {
  // ignore
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

const isWriteMethod = (method: unknown): boolean => {
  const m = String(method || 'GET').toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
};

const previewPayload = (payload: unknown): unknown => {
  if (payload === undefined) return undefined;
  if (payload === null) return null;
  if (typeof FormData !== 'undefined' && payload instanceof FormData) {
    return { __type: 'FormData' };
  }
  if (typeof payload === 'string') {
    return payload.length > 2000 ? `${payload.slice(0, 2000)}…(truncated)` : payload;
  }
  try {
    const json = JSON.stringify(payload);
    if (json.length > 4000) return `${json.slice(0, 4000)}…(truncated_json)`;
    return payload;
  } catch {
    return { __unserializable: true };
  }
};

const describeAuthHeader = (headers: unknown): string => {
  const h = toRecordHeaders(headers);
  const raw = h.Authorization || h.authorization || '';
  if (!raw) return 'MISSING';
  const trimmed = String(raw).trim();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith('bearer ')) return `INVALID_FORMAT(${trimmed.slice(0, 20)}${trimmed.length > 20 ? '…' : ''})`;
  const token = trimmed.slice(7).trim();
  if (!token) return 'INVALID_BEARER_EMPTY';
  return `Bearer [len=${token.length}]`;
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
  timeoutMs: DEFAULT_TIMEOUT_MS,
});

api.interceptors.request.use(
  (config) => {
    if (isInvalidRequestConfig(config)) {
      console.error('❌ BLOCKED INVALID REQUEST:', config);
      return Promise.reject(new Error('Invalid API request: empty or root URL'));
    }
    console.trace('REQUEST TRACE:', config.url);
    try {
      const requestUrl = toAbsoluteRequestUrl(config);
      const method = String(config.method || 'GET').toUpperCase();
      const payloadSize = estimatePayloadSizeBytes(config.data);
      (config as any).metadata = { startedAt: Date.now() };

      // Multipart safety: do NOT force Content-Type for FormData.
      // Let axios set the boundary, otherwise real devices often surface "Network Error".
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        console.log('HEADERS TYPE:', (config.headers as any)?.constructor?.name);
        console.log('HEADERS OBJECT:', config.headers);
        if (config.headers) {
          delete (config.headers as any)['Content-Type'];
          delete (config.headers as any)['content-type'];
          delete (config.headers as any)['Content-type'];
        }
      }
      console.log('FINAL HEADERS:', config.headers);

      const authHeader = describeAuthHeader(config.headers);
      if (requestUrl === `${String(API_BASE_URL).replace(/\/+$/, '')}/`) {
        console.log('UNEXPECTED REQUEST:', method, config.url);
      }

      console.log('[API:REQUEST]', {
        method,
        url: requestUrl,
        headers: sanitizeHeaders(config.headers),
        authHeader,
        payloadSizeBytes: payloadSize,
      });

      if (isWriteMethod(method)) {
        console.log('[API:WRITE]', {
          fullUrl: requestUrl,
          method,
          payload: previewPayload(config.data),
        });
      }
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
      console.log('RAW RESPONSE:', error.response);
      console.log('RAW DATA:', error.response?.data);
      const requestUrl = toAbsoluteRequestUrl(error.config || {});
      const method = safeMethodFromConfig(error.config);
      const startedAt = (error.config as any)?.metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
      console.log('[API:ERROR]', {
        message: error.message,
        code: readAxiosErrorCodeSafe(error),
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
    console.log('🚨 DISPATCHING REQUEST:', {
      url: safeConfig.url,
      baseURL: safeConfig.baseURL || api.defaults.baseURL,
      full: `${String(safeConfig.baseURL || api.defaults.baseURL || '')}${String(safeConfig.url || '')}`,
      method: safeConfig.method,
    });
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
