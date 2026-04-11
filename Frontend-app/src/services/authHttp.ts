import { API_BASE_URL } from '../config';
import { API_PATHS } from '../constants/apiPaths';

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

  console.log('[AUTH_HTTP] POST start', { url, timeoutMs });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    // Hermes-safe: Direct header assignment (no enumeration)
    const safeHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Timeout via Promise.race — do not pass AbortSignal to fetch. RN's AbortController
    // polyfill has been linked to TypeError: Cannot assign to read-only property 'NONE'.
    const fetchPromise = globalThis.fetch(url, {
      method: 'POST',
      headers: safeHeaders,
      body: JSON.stringify(body),
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const err = new Error('Request timed out');
        err.name = 'AbortError';
        reject(err);
      }, timeoutMs);
    });

    const res = await Promise.race([fetchPromise, timeoutPromise]);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

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
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * __DEV__ only: minimal GET with fetch (no AbortSignal) to isolate networking from auth POST body.
 * Call from a dev screen or `await devProbeAuthHealth()` in the RN debugger.
 */
export async function devProbeAuthHealth(): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  if (!__DEV__) {
    return { ok: false, error: 'dev only' };
  }
  const base = API_BASE_URL.replace(/\/+$/, '');
  const prefix = API_PATHS.auth.startsWith('/') ? API_PATHS.auth : `/${API_PATHS.auth}`;
  const url = `${base}${prefix}/health`;
  try {
    const res = await globalThis.fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}