import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';

import { API_PATHS } from '../constants/apiPaths';
import { tokenStorage } from './tokenStorage';
import { safeCatch } from '../utils/safeCatch';

type RetryableConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
  _retryCount?: number;
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

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

const isAxiosNetworkError = (error: AxiosError): boolean => {
  return !error.response;
};

const isAuthMutationRequest = (config?: RetryableConfig): boolean => {
  const url = String(config?.url || '').toLowerCase();
  return (
    url.includes('/login') ||
    url.includes('/register') ||
    url.includes('/refresh-token')
  );
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

// ✅ SAFE REQUEST BUILDER (NO HEADER MUTATION)
const rebuildRequest = (
  original: RetryableConfig,
  token?: string
): AxiosRequestConfig => {
  if (!original.url) throw new Error('Missing URL');

  return {
    url: original.url,
    method: original.method,
    baseURL: original.baseURL,
    data: original.data,
    params: original.params,
    timeout: original.timeout || 20000,
    headers: token
      ? {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        }
      : {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
    skipAuthRefresh: original.skipAuthRefresh,
  };
};

const refreshTokenRequest = async (
  client: AxiosInstance,
  timeoutMs: number
): Promise<string | null> => {
  await tokenStorage.hydrate();
  const refreshToken = await tokenStorage.getRefreshToken();

  if (!refreshToken) return null;

  const res = await client.post<RefreshResponse>(
    `${API_PATHS.auth}/refresh-token`,
    { refreshToken },
    {
      timeout: timeoutMs,
      skipAuthRefresh: true,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    } as AxiosRequestConfig & { skipAuthRefresh: boolean }
  );

  const newAccess = parseAccessToken(res.data);
  if (!newAccess) return null;

  const newRefresh = parseRefreshToken(res.data) || refreshToken;

  await Promise.all([
    tokenStorage.setAccessToken(newAccess),
    tokenStorage.setRefreshToken(newRefresh),
  ]);

  return newAccess;
};

export const installRefreshInterceptor = (
  client: AxiosInstance,
  options: InstallOptions = {}
) => {
  const timeoutMs = options.timeoutMs ?? 20000;

  let isRefreshing = false;
  let queue: Array<{
    resolve: (token: string | null) => void;
    reject: (err: any) => void;
  }> = [];

  const flushQueue = (error: any, token: string | null) => {
    queue.forEach((p) => {
      if (error) p.reject(error);
      else p.resolve(token);
    });
    queue = [];
  };

  // ✅ SAFE REQUEST INTERCEPTOR
  const reqId = client.interceptors.request.use(async (config) => {
    const retryable = config as RetryableConfig;

    if (retryable.skipAuthRefresh) return config;
    if (isAuthMutationRequest(retryable)) return config;

    await tokenStorage.hydrate();
    const token = await tokenStorage.getAccessToken();

    return {
      ...config,
      timeout: config.timeout ?? timeoutMs,
      headers: token
        ? {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          }
        : {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
    };
  });

  // ✅ RESPONSE INTERCEPTOR
  const resId = client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as RetryableConfig;
      if (!original) return Promise.reject(error);

      const retryCount = (original as any)._retryCount || 0;

      if (shouldRetryNetwork(error, original, retryCount)) {
        (original as any)._retryCount = retryCount + 1;
        await sleep(RETRY_BASE_DELAY_MS);
        return client.request(rebuildRequest(original));
      }

      if (
        error.response?.status === 401 &&
        !original.skipAuthRefresh &&
        !isAuthMutationRequest(original)
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            queue.push({
              resolve: (token) =>
                resolve(client.request(rebuildRequest(original, token || undefined))),
              reject,
            });
          });
        }

        isRefreshing = true;

        try {
          const newToken = await refreshTokenRequest(client, timeoutMs);

          if (!newToken) {
            await tokenStorage.clearSession();
            flushQueue(new Error('Session expired'), null);
            options.onAuthFailure?.();
            return Promise.reject(error);
          }

          flushQueue(null, newToken);
          return client.request(rebuildRequest(original, newToken));
        } catch (e) {
          safeCatch('refreshInterceptor')(e);
          flushQueue(e, null);
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return {
    eject: () => {
      client.interceptors.request.eject(reqId);
      client.interceptors.response.eject(resId);
    },
  };
};

export const isRequestCancelled = (error: unknown): boolean => {
  return axios.isCancel(error);
};