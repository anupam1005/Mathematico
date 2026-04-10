import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';

const createJsonHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
};

const buildAuthUrl = (relativePath: string): string => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const prefix = API_PATHS.auth.startsWith('/') ? API_PATHS.auth : `/${API_PATHS.auth}`;
  return `${base}${prefix}${path}`;
};

/**
 * POST JSON to /api/v1/auth/* using fetch() (Hermes-safe)
 */
export async function postAuthJson<T>(
  relativePath: string,
  body: unknown,
  timeoutMs = 20000
): Promise<T> {
  const url = buildAuthUrl(relativePath);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  console.log('[AUTH_HTTP] POST start', { url, timeoutMs });

  try {
    // 🔥 CRITICAL FIX: Force plain headers (no RN mutation)
    const rawHeaders = createJsonHeaders();
    const safeHeaders: Record<string, string> = {};

    Object.keys(rawHeaders).forEach((key) => {
      safeHeaders[key] = String(rawHeaders[key]);
    });

    // 🔥 CRITICAL FIX: Use globalThis.fetch (avoid patched fetch)
    const res = await globalThis.fetch(url, {
      method: 'POST',
      headers: safeHeaders,
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

    const payload = data as Record<string, unknown> | null;

    console.log('[AUTH_HTTP] POST response', {
      url,
      status: res.status,
      ok: res.ok,
      hasPayload: Boolean(payload),
      success: payload?.success === true,
      hasData: Boolean(payload?.data),
      message: typeof payload?.message === 'string' ? payload.message : undefined,
    });

    const typedPayload = (data as Record<string, unknown>) || {};

    if (!res.ok) {
      const msg =
        typeof typedPayload?.message === 'string'
          ? typedPayload.message
          : `Request failed (${res.status})`;

      const err = new Error(msg) as Error & {
        status?: number;
        response?: { status: number; data: unknown };
      };

      err.status = res.status;
      err.response = { status: res.status, data: typedPayload };

      throw err;
    }

    return data as T;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && (e as Error).name === 'AbortError') {
      console.log('[AUTH_HTTP] POST timeout', { url, timeoutMs });

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
      console.log('[AUTH_HTTP] POST network failure', {
        url,
        message: e.message,
      });

      const err = new Error(e.message || 'Unable to reach server') as Error & {
        code?: string;
      };

      err.code = 'NETWORK_ERROR';

      throw err;
    }

    if (e instanceof Error) {
      console.log('[AUTH_HTTP] POST failure', { url, message: e.message });
    } else {
      console.log('[AUTH_HTTP] POST failure', { url, error: String(e) });
    }

    throw e;
  } finally {
    clearTimeout(timer);
  }
}