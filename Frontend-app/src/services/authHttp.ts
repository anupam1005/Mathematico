import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';

const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

const buildAuthUrl = (relativePath: string): string => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const prefix = API_PATHS.auth.startsWith('/') ? API_PATHS.auth : `/${API_PATHS.auth}`;
  return `${base}${prefix}${path}`;
};

/**
 * POST JSON to /api/v1/auth/* using fetch() to avoid Hermes/XHR
 * "Cannot assign to read-only property 'NONE'" failures on some RN builds.
 */
export async function postAuthJson<T>(relativePath: string, body: unknown, timeoutMs = 20000): Promise<T> {
  const url = buildAuthUrl(relativePath);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text || 'Invalid response from server' };
    }

    const payload = data as Record<string, unknown>;

    if (!res.ok) {
      const msg =
        typeof payload?.message === 'string'
          ? payload.message
          : `Request failed (${res.status})`;
      const err = new Error(msg) as Error & { status?: number; response?: { status: number; data: unknown } };
      err.status = res.status;
      err.response = { status: res.status, data: payload };
      throw err;
    }

    return data as T;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && (e as Error).name === 'AbortError') {
      const err = new Error('Request timed out') as Error & { code?: string };
      err.code = 'TIMEOUT';
      throw err;
    }
    const hasResponse =
      e &&
      typeof e === 'object' &&
      'response' in (e as object) &&
      (e as { response?: unknown }).response != null;
    if (!hasResponse && e instanceof Error) {
      const err = new Error(e.message || 'Unable to reach server') as Error & { code?: string };
      err.code = 'NETWORK_ERROR';
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
