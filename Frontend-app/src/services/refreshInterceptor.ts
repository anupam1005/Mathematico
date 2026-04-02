import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { API_PATHS } from '../constants/apiPaths';
import { tokenStorage } from './tokenStorage';
import { safeCatch } from '../utils/safeCatch';

/** Own-property `code` only — same rationale as apiClient (Hermes / DOM errors). */
const readAxiosErrorCodeOwn = (error: unknown): string | undefined => {
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

/**
 * Hermes-safe: read header values only (AxiosHeaders#toJSON), then build a fresh plain object.
 * Never mutate AxiosHeaders / fetch Headers / or assign into config.headers in place.
 */
const isAxiosHeadersLike = (headers: unknown): headers is AxiosHeaders => {
  if (headers == null || typeof headers !== 'object') return false;
  if (headers instanceof AxiosHeaders) return true;
  const h = headers as { toJSON?: unknown; get?: unknown; set?: unknown };
  return typeof h.toJSON === 'function' && typeof h.get === 'function' && typeof h.set === 'function';
};

export const toPlainHeaders = (headers: unknown): Record<string, string> => {
  if (headers == null || typeof headers !== 'object') return {};
  try {
    if (isAxiosHeadersLike(headers)) {
      const json = headers.toJSON(true) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(json)) {
        if (v == null) continue;
        out[k] = Array.isArray(v) ? String(v[v.length - 1] ?? '') : String(v);
      }
      return out;
    }
  } catch {
    // fall through to generic copy
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = typeof v === 'string' ? v : String(v);
  }
  return out;
};

/** Plain-object multipart rule: let the runtime set multipart boundaries (no Content-Type). */
export const omitContentTypeKeys = (plain: Record<string, string>): Record<string, string> => {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(plain)) {
    if (k.toLowerCase() === 'content-type') continue;
    next[k] = v;
  }
  return next;
};

type RetryableConfig = InternalAxiosRequestConfig & {
  skipAuthRefresh?: boolean;
};

interface InstallOptions {
  onAuthFailure?: () => Promise<void> | void;
  timeoutMs?: number;
}

interface RefreshResponse {
  success?: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;
  };
  accessToken?: string;
  token?: string;
}

const MAX_NETWORK_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseAccessToken = (payload: RefreshResponse): string | null => {
  return (
    payload?.data?.accessToken ||
    payload?.data?.token ||
    payload?.accessToken ||
    payload?.token ||
    null
  );
};

const parseRefreshToken = (payload: RefreshResponse): string | null => {
  return payload?.data?.refreshToken || null;
};

const hasBearerHeader = (config?: RetryableConfig): boolean => {
  const plain = toPlainHeaders(config?.headers);
  const rawAuth = plain.Authorization ?? plain.authorization;
  return typeof rawAuth === 'string' && rawAuth.trim().toLowerCase().startsWith('bearer ');
};

const isAxiosNetworkError = (error: AxiosError): boolean => {
  if (!error.response) return true;
  const code = readAxiosErrorCodeOwn(error);
  return code === 'ECONNABORTED' || code === 'ERR_NETWORK';
};

const isAuthMutationRequest = (config?: RetryableConfig): boolean => {
  const rawUrl = String(config?.url || '').toLowerCase();
  return rawUrl.includes('/login') || rawUrl.includes('/register') || rawUrl.includes('/refresh-token');
};

const isInvalidRequestUrl = (config: InternalAxiosRequestConfig): boolean => {
  const rawUrl = String(config.url || '').trim();
  if (!rawUrl || rawUrl === '/') return true;
  if (/^https?:\/\/[^/]+\/?$/i.test(rawUrl)) return true;
  return false;
};

const shouldRetryNetwork = (
  error: AxiosError,
  config: RetryableConfig | undefined,
  retryCount: number
): boolean => {
  if (!config || config.skipAuthRefresh) return false;
  if (isAuthMutationRequest(config)) return false;
  if (retryCount >= MAX_NETWORK_RETRIES) return false;

  if (isAxiosNetworkError(error)) return true;
  const status = error.response?.status;
  return status === 429 || (typeof status === 'number' && status >= 500);
};

const isInvalidRefreshResponse = (error: unknown): boolean => {
  const axiosError = error as AxiosError | undefined;
  const status = axiosError?.response?.status;
  if (status !== 400 && status !== 401) return false;

  const message = String((axiosError?.response?.data as any)?.message || '').toLowerCase();
  if (!message) return true;

  return (
    message.includes('refresh') ||
    message.includes('token') ||
    message.includes('invalid') ||
    message.includes('expired') ||
    message.includes('unauthorized')
  );
};

const rebuildRequest = (
  original: RetryableConfig,
  token?: string
): AxiosRequestConfig => {
  if (!original.url) {
    throw new Error('FATAL: Missing URL before retry');
  }
  const url = String(original.url || '').trim();
  if (!url || url === '/' || /^https?:\/\/[^/]+\/?$/i.test(url)) {
    throw new Error('FATAL: Invalid URL in retry rebuild');
  }

  const method = String(original.method || 'GET').toUpperCase();

  let data = original.data;
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    // keep reference — JSON cloning destroys multipart bodies
  } else if (data && typeof data === 'object') {
    try {
      data = JSON.parse(JSON.stringify(data));
    } catch {
      data = undefined;
    }
  }

  let params = original.params;
  if (params && typeof params === 'object') {
    try {
      params = JSON.parse(JSON.stringify(params));
    } catch {
      params = undefined;
    }
  }

  if (__DEV__) {
    console.log('RETRY BUILD:', {
      url,
      method,
      hasData: !!data,
      hasParams: !!params,
    });
  }

  const basePlain = toPlainHeaders(original.headers);
  let headersPlain: Record<string, string> = token
    ? { ...basePlain, Authorization: `Bearer ${token}` }
    : { ...basePlain };
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    headersPlain = omitContentTypeKeys(headersPlain);
  }

  const retryConfig: AxiosRequestConfig = {
    url,
    method: method.toUpperCase(),
    baseURL: original.baseURL || undefined,
    headers: headersPlain,
    data,
    params,
    timeout: original.timeout || 20000,
  };
  return retryConfig;
};

const enrichRequestWithAuth = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const retryable = config as RetryableConfig;

  if (retryable.skipAuthRefresh) {
    const plain = toPlainHeaders(config.headers);
    return { ...config, headers: plain } as InternalAxiosRequestConfig;
  }
  await tokenStorage.hydrate();
  const token = await tokenStorage.getAccessToken();
  const plain = toPlainHeaders(config.headers);
  if (!token) {
    return { ...config, headers: plain } as InternalAxiosRequestConfig;
  }
  return {
    ...config,
    headers: { ...plain, Authorization: `Bearer ${token}` },
  } as InternalAxiosRequestConfig;
};

const refreshTokenRequest = async (
  client: AxiosInstance,
  timeoutMs: number
): Promise<string | null> => {
  await tokenStorage.hydrate();
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const response = await client.post<RefreshResponse>(
    `${API_PATHS.auth}/refresh-token`,
    { refreshToken },
    {
      timeout: timeoutMs,
      skipAuthRefresh: true,
    } as AxiosRequestConfig & { skipAuthRefresh: boolean }
  );

  const payload = response?.data;
  const nextAccessToken = parseAccessToken(payload);
  if (!nextAccessToken) return null;

  const nextRefresh = parseRefreshToken(payload) || refreshToken;
  await Promise.all([
    tokenStorage.setAccessToken(nextAccessToken),
    tokenStorage.setRefreshToken(nextRefresh),
  ]);

  return nextAccessToken;
};

export const installRefreshInterceptor = (
  client: AxiosInstance,
  options: InstallOptions = {}
) => {
  const timeoutMs = options.timeoutMs ?? 20000;

  let isRefreshing = false;
  let authFailureNotified = false;
  const retriedRequests = new WeakSet<object>();
  const retryCountByRequest = new WeakMap<object, number>();
  let pendingQueue: Array<{
    resolve: (token: string | null) => void;
    reject: (error: any) => void;
  }> = [];

  const flushQueue = (error: any, token: string | null) => {
    const queued = pendingQueue;
    pendingQueue = [];
    queued.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token);
    });
  };

  const requestInterceptorId = client.interceptors.request.use(
    async (config) => {
      if (isInvalidRequestUrl(config)) {
        console.error('❌ BLOCKED INVALID REQUEST:', config);
        return Promise.reject(new Error('Invalid API request: empty or root URL'));
      }
      if (isAuthMutationRequest(config as RetryableConfig)) {
        const plain = toPlainHeaders(config.headers);
        return {
          ...config,
          headers: plain,
          timeout: config.timeout ?? timeoutMs,
        } as InternalAxiosRequestConfig;
      }
      const withAuth = await enrichRequestWithAuth(config);
      return {
        ...withAuth,
        timeout: withAuth.timeout ?? timeoutMs,
      } as InternalAxiosRequestConfig;
    },
    (error) => Promise.reject(error)
  );

  const responseInterceptorId = client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableConfig | undefined;
      if (!originalRequest) return Promise.reject(error);

      const currentRetryCount = retryCountByRequest.get(originalRequest) || 0;
      if (shouldRetryNetwork(error, originalRequest, currentRetryCount)) {
        const nextRetryCount = currentRetryCount + 1;
        retryCountByRequest.set(originalRequest, nextRetryCount);
        const delayMs = RETRY_BASE_DELAY_MS * 2 ** (nextRetryCount - 1);
        if (__DEV__) {
          console.log('[API:RETRY]', {
            url: originalRequest.url,
            method: String(originalRequest.method || 'GET').toUpperCase(),
            retryCount: nextRetryCount,
            delayMs,
            reasonCode: readAxiosErrorCodeOwn(error),
            status: error.response?.status,
          });
        }
        await sleep(delayMs);
        let retryConfig: AxiosRequestConfig;
        try {
          retryConfig = rebuildRequest(originalRequest);
        } catch (rebuildError) {
          return Promise.reject(rebuildError);
        }
        if (!retryConfig.url || retryConfig.url === '/' || retryConfig.url === '') {
          console.error('❌ FATAL BLOCK: retry with invalid URL', retryConfig);
          return Promise.reject(new Error('Invalid retry dispatch'));
        }
        return client.request(retryConfig);
      }

      const status = error.response?.status;
      const shouldRefresh =
        status === 401 &&
        !retriedRequests.has(originalRequest) &&
        !originalRequest.skipAuthRefresh &&
        !isAuthMutationRequest(originalRequest) &&
        hasBearerHeader(originalRequest) &&
        !String(originalRequest.url || '').includes('/refresh-token');

      if (!shouldRefresh) {
        return Promise.reject(error);
      }

      retriedRequests.add(originalRequest);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              let retryConfig: AxiosRequestConfig;
              try {
                retryConfig = rebuildRequest(originalRequest, token || undefined);
              } catch (rebuildError) {
                reject(rebuildError);
                return;
              }
              if (!retryConfig.url || retryConfig.url === '/' || retryConfig.url === '') {
                console.error('❌ FATAL BLOCK: retry with invalid URL', retryConfig);
                reject(new Error('Invalid retry dispatch'));
                return;
              }
              resolve(client.request(retryConfig));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const token = await refreshTokenRequest(client, timeoutMs);
        if (!token) {
          await tokenStorage.clearSession();
          if (!authFailureNotified) {
            authFailureNotified = true;
            options.onAuthFailure?.();
          }
          flushQueue(new Error('Refresh token invalid'), null);
          return Promise.reject(error);
        }

        authFailureNotified = false;
        flushQueue(null, token);
        const retryConfig = rebuildRequest(originalRequest, token);
        if (!retryConfig.url || retryConfig.url === '/' || retryConfig.url === '') {
          console.error('❌ FATAL BLOCK: retry with invalid URL', retryConfig);
          return Promise.reject(new Error('Invalid retry dispatch'));
        }
        return client.request(retryConfig);
      } catch (refreshError) {
        safeCatch('refreshInterceptor.refreshTokenRequest')(refreshError);
        if (isInvalidRefreshResponse(refreshError)) {
          await tokenStorage.clearSession();
          if (!authFailureNotified) {
            authFailureNotified = true;
            options.onAuthFailure?.();
          }
        }
        flushQueue(refreshError, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
  );

  return {
    eject: () => {
      client.interceptors.request.eject(requestInterceptorId);
      client.interceptors.response.eject(responseInterceptorId);
      pendingQueue = [];
    },
  };
};

export const isRequestCancelled = (error: unknown): boolean => {
  if (!error) return false;
  if (axios.isCancel(error)) return true;
  return readAxiosErrorCodeOwn(error) === 'ERR_CANCELED';
};
