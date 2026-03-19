import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';

import { API_PATHS } from '../constants/apiPaths';
import { tokenStorage } from './tokenStorage';
import { safeCatch } from '../utils/safeCatch';

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  __retryCount?: number;
  skipAuthRefresh?: boolean;
  __queued?: boolean;
};

interface InstallOptions {
  onAuthFailure?: () => Promise<void> | void;
  timeoutMs?: number;
  healthPath?: string;
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
  if (!config?.headers) return false;
  const headers = config.headers as Record<string, unknown>;
  const rawAuth = headers.Authorization ?? headers.authorization;
  return typeof rawAuth === 'string' && rawAuth.trim().toLowerCase().startsWith('bearer ');
};

const isAxiosNetworkError = (error: AxiosError): boolean => {
  const code = error.code || '';
  return !error.response || code === 'ECONNABORTED' || code === 'ERR_NETWORK';
};

const shouldRetryNetwork = (error: AxiosError, config?: RetryableConfig): boolean => {
  if (!config || config.skipAuthRefresh) return false;
  if (config.__retryCount && config.__retryCount >= MAX_NETWORK_RETRIES) return false;

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

const enrichRequestWithAuth = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const retryable = config as RetryableConfig;

  if (retryable.skipAuthRefresh) return config;
  await tokenStorage.hydrate();
  const token = await tokenStorage.getAccessToken();
  if (!token) return config;

  config.headers = config.headers || {};
  const headers = config.headers as Record<string, string>;
  if (!headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  return config;
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
      headers: {
        Authorization: '',
      },
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
  const healthPath = options.healthPath ?? '/health';

  let isRefreshing = false;
  let authFailureNotified = false;
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
      const withAuth = await enrichRequestWithAuth(config);
      if (!withAuth.timeout) {
        withAuth.timeout = timeoutMs;
      }
      return withAuth;
    },
    (error) => Promise.reject(error)
  );

  const responseInterceptorId = client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableConfig | undefined;
      if (!originalRequest) return Promise.reject(error);

      if (shouldRetryNetwork(error, originalRequest)) {
        originalRequest.__retryCount = (originalRequest.__retryCount || 0) + 1;
        const delayMs = RETRY_BASE_DELAY_MS * 2 ** (originalRequest.__retryCount - 1);
        await sleep(delayMs);
        return client.request(originalRequest);
      }

      const status = error.response?.status;
      const shouldRefresh =
        status === 401 &&
        !originalRequest._retry &&
        !originalRequest.skipAuthRefresh &&
        hasBearerHeader(originalRequest) &&
        !String(originalRequest.url || '').includes('/refresh-token');

      if (!shouldRefresh) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              if (token) {
                originalRequest.headers = originalRequest.headers || {};
                (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
              }
              resolve(client.request(originalRequest));
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
        originalRequest.headers = originalRequest.headers || {};
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        return client.request(originalRequest);
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

  const checkHealth = async (): Promise<boolean> => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return false;

    try {
      await client.get(healthPath, {
        timeout: 8000,
        skipAuthRefresh: true,
      } as AxiosRequestConfig & { skipAuthRefresh: boolean });
      return true;
    } catch {
      return false;
    }
  };

  return {
    eject: () => {
      client.interceptors.request.eject(requestInterceptorId);
      client.interceptors.response.eject(responseInterceptorId);
      pendingQueue = [];
    },
    checkHealth,
  };
};

export const isRequestCancelled = (error: unknown): boolean => {
  if (!error) return false;
  if (axios.isCancel(error)) return true;
  const maybeError = error as AxiosError;
  return maybeError.code === 'ERR_CANCELED';
};
