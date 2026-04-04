import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

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
  const h = config?.headers as Record<string, unknown> | undefined;
  if (!h || typeof h !== 'object') return false;
  const raw = h.Authorization ?? h.authorization;
  return typeof raw === 'string' && raw.trim().toLowerCase().startsWith('bearer ');
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

const rebuildRequest = (original: RetryableConfig, token?: string): AxiosRequestConfig => {
  if (!original.url) {
    throw new Error('FATAL: Missing URL before retry');
  }
  const url = String(original.url || '').trim();
  if (!url || url === '/' || url === '') {
    throw new Error('FATAL: Invalid URL in retry rebuild');
  }

  const method = String(original.method || 'GET').toUpperCase();
  const data = original.data;
  const params = original.params;

  const retryConfig: AxiosRequestConfig = {
    url,
    method,
    baseURL: original.baseURL,
    headers: {
      ...(original.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    data,
    params,
    timeout: original.timeout || 20000,
  };
  return retryConfig;
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
      if (!config.url || config.url === '/' || config.url.trim() === '') {
        return Promise.reject(new Error('Invalid API request'));
      }

      const retryable = config as RetryableConfig;
      if (retryable.skipAuthRefresh) {
        config.timeout = config.timeout ?? timeoutMs;
        return config;
      }

      await tokenStorage.hydrate();
      const token = await tokenStorage.getAccessToken();

      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        } as InternalAxiosRequestConfig['headers'];
      }

      config.timeout = config.timeout ?? timeoutMs;
      return config;
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
              let retryCfg: AxiosRequestConfig;
              try {
                retryCfg = rebuildRequest(originalRequest, token || undefined);
              } catch (rebuildError) {
                reject(rebuildError);
                return;
              }
              if (!retryCfg.url || retryCfg.url === '/' || retryCfg.url === '') {
                console.error('❌ FATAL BLOCK: retry with invalid URL', retryCfg);
                reject(new Error('Invalid retry dispatch'));
                return;
              }
              resolve(client.request(retryCfg));
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

