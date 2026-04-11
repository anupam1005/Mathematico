import axios from 'axios';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';

// ✅ CLEAN AXIOS INSTANCE (NO HEADERS HERE)
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
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
    const res = await authClient.post(url, body, {
      // ✅ SAFE HEADERS PER REQUEST (NO MUTATION)
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 20000,
    });

    console.log('[AUTH_HTTP] AXIOS response', {
      status: res.status,
      success: res.data?.success,
    });

    return res.data as T;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Request failed';

    const status = error?.response?.status;

    console.log('[AUTH_HTTP] AXIOS error', {
      message,
      status,
    });

    const err = new Error(message) as any;

    // ✅ SAFE ERROR CLASSIFICATION
    if (error?.code === 'ECONNABORTED') {
      err.code = 'TIMEOUT';
    } else if (!error?.response) {
      err.code = 'NETWORK_ERROR';
    } else {
      err.code = 'API_ERROR';
    }

    err.status = status;

    throw err;
  }
}