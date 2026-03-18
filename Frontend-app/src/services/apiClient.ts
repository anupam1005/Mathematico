import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
// @ts-expect-error axios does not publish typings for deep adapter imports; required for Hermes/Metro static inclusion
import xhrAdapter from 'axios/lib/adapters/xhr.js';
import { API_BASE_URL } from '../config';
import { Storage } from '../utils/storage';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  validateStatus: (status: number) => status < 500,
  adapter: xhrAdapter,
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
  }

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

  finalConfig.headers = await buildAuthHeaders(config.headers);
  return finalConfig;
};

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
    const url = buildUrl(basePath, config.url || '');
    return sanitizeConfig(config).then((finalConfig) => api.request<T>({ ...finalConfig, url }));
  },
});

export default api;
