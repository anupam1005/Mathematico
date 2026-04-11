import axios from 'axios';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';

// ✅ CLEAN AXIOS INSTANCE (NO INTERCEPTORS)
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const buildAuthUrl = (relativePath: string): string => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const prefix = API_PATHS.auth.startsWith('/') ? API_PATHS.auth : `/${API_PATHS.auth}`;
  return `${prefix}${path}`;
};

export async function postAuthJson<T>(
  relativePath: string,
  body: unknown
): Promise<T> {
  const url = buildAuthUrl(relativePath);

  console.log('[AUTH_HTTP] AXIOS POST start', { url });

  try {
    const res = await authClient.post(url, body);

    console.log('[AUTH_HTTP] AXIOS response', {
      status: res.status,
      success: res.data?.success,
    });

    return res.data as T;
  } catch (error: any) {
    console.log('[AUTH_HTTP] AXIOS error', {
      message: error?.message,
      status: error?.response?.status,
    });

    const err = new Error(
      error?.response?.data?.message || error.message || 'Request failed'
    ) as any;

    err.code = 'NETWORK_ERROR';
    err.status = error?.response?.status;

    throw err;
  }
}