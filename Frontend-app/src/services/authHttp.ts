import axios from 'axios';
import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';
import { createSafeError } from '../utils/safeError';

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
    // Normalize hostile Axios/Hermes errors WITHOUT mutating Error instances
    const safe = createSafeError(error);
    const message =
      (typeof safe?.response?.data?.message === 'string' && safe.response.data.message) ||
      (typeof safe?.message === 'string' && safe.message) ||
      'Request failed';

    const status = safe?.response?.status ?? null;

    console.log('[AUTH_HTTP] AXIOS error', {
      message,
      status,
    });

    const axiosCode = typeof safe?.code === 'string' ? safe.code : '';
    const classifiedCode =
      axiosCode === 'ECONNABORTED'
        ? 'TIMEOUT'
        : !safe?.response
          ? 'NETWORK_ERROR'
          : 'API_ERROR';

    // IMPORTANT: Always throw a NEW plain object (no mutation, no shared templates).
    throw {
      code: classifiedCode,
      message,
      status,
      response: safe?.response ?? null,
      config: safe?.config ?? null,
    };
  }
}