// PRODUCTION: Use strict API_BASE_URL from config (no old-domain fallback)
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { Storage } from '../utils/storage';

// IMPORTANT: No interceptors.
// Your migration rules require: "Ensure no interceptor mutates headers."
// We attach auth headers per request using fresh plain objects only.
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  validateStatus: (status: number) => status < 500,
});

type PlainHeaders = Record<string, string>;

const toPlainStringHeaders = (value: unknown): PlainHeaders => {
  const out: PlainHeaders = {};
  if (!value || typeof value !== 'object') return out;

  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
};

const buildAuthHeaders = async (extraHeaders?: unknown): Promise<PlainHeaders> => {
  const headers: PlainHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    const token = await Storage.getItem('authToken');
    if (token && typeof token === 'string' && token.length > 0) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore token read failures; request can still proceed without auth
  }

  // Merge extra headers (plain strings only) without mutating caller objects
  const extras = toPlainStringHeaders(extraHeaders);
  for (const [k, v] of Object.entries(extras)) {
    headers[k] = v;
  }

  return headers;
};

const sanitizeConfig = async (config?: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
  const finalConfig: AxiosRequestConfig = {};
  if (!config) return finalConfig;

  if (config.method) finalConfig.method = config.method;
  if (config.params !== undefined) finalConfig.params = config.params;
  if (config.data !== undefined) finalConfig.data = config.data;
  if (config.timeout) finalConfig.timeout = config.timeout;
  if (config.responseType) finalConfig.responseType = config.responseType;
  if (config.withCredentials !== undefined) finalConfig.withCredentials = config.withCredentials;

  // Headers: always replace with a fresh plain object (Hermes-safe)
  finalConfig.headers = await buildAuthHeaders(config.headers);
  return finalConfig;
};

// PRODUCTION-SAFE: Path building utilities
const normalizePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`;
};

const buildUrl = (basePath: string, path?: string): string => {
  // Remove trailing slash from base path
  const normalizedBase = basePath.replace(/\/$/, '');
  
  // If no path provided, return just the base
  if (!path) return normalizedBase;
  
  // Normalize the path to ensure it starts with /
  const normalizedPath = normalizePath(path);
  
  // Prevent double path concatenation
  if (normalizedBase.endsWith(normalizedPath)) {
    return normalizedBase;
  }
  
  // Concatenate base and path
  return `${normalizedBase}${normalizedPath}`;
};

// PRODUCTION-SAFE: API client wrapper with complete error isolation
// No frozen object mutations, no AxiosHeaders usage
export const withBasePath = (basePath: string) => ({
  get: <T = any>(path: string, config?: AxiosRequestConfig) => {
    return sanitizeConfig(config).then((finalConfig) => api.get<T>(buildUrl(basePath, path), finalConfig));
  },
  delete: <T = any>(path: string, config?: AxiosRequestConfig) => {
    return sanitizeConfig(config).then((finalConfig) => api.delete<T>(buildUrl(basePath, path), finalConfig));
  },
  post: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) => {
    return sanitizeConfig(config).then((finalConfig) => api.post<T>(buildUrl(basePath, path), data, finalConfig));
  },
  put: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) => {
    return sanitizeConfig(config).then((finalConfig) => api.put<T>(buildUrl(basePath, path), data, finalConfig));
  },
  patch: <T = any>(path: string, data?: any, config?: AxiosRequestConfig) => {
    return sanitizeConfig(config).then((finalConfig) => api.patch<T>(buildUrl(basePath, path), data, finalConfig));
  },
  request: <T = any>(config: AxiosRequestConfig) => {
    // HERMES-SAFE: Avoid spreading Axios config objects. Copy only primitives we need.
    const url = buildUrl(basePath, config.url || '');
    return sanitizeConfig(config).then((finalConfig) => api.request<T>({ ...finalConfig, url }));
  },
});

export default api;
