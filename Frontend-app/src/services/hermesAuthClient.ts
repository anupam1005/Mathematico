import { API_BASE_URL } from "../config";
import { API_PATHS } from "../constants/apiPaths";

type HeadersMap = Record<string, string>;

const safeJsonSerialize = (data: any): { body?: string; isJson: boolean } => {
  // If no body data, return undefined (no payload)
  if (data === undefined || data === null) {
    return { body: undefined, isJson: true };
  }

  // If a string is provided, we only accept it if it's valid JSON already.
  if (typeof data === "string") {
    try {
      JSON.parse(data);
      return { body: data, isJson: true };
    } catch {
      // Wrap raw strings into a JSON string so the backend JSON parser won't crash.
      return { body: JSON.stringify(data), isJson: true };
    }
  }

  // For objects/arrays/numbers/booleans: JSON.stringify is safe and produces valid JSON.
  try {
    return { body: JSON.stringify(data), isJson: true };
  } catch {
    // As an ultimate fallback, send an empty object instead of invalid JSON.
    return { body: "{}", isJson: true };
  }
};

const buildHeaders = (token?: string | null): HeadersMap => {
  const headers: HeadersMap = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json",
  };

  if (token && typeof token === "string" && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const hermesSafeRequest = (
  method: "POST" | "GET" | "PUT" | "DELETE",
  path: string,
  data?: any,
  token?: string | null
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();

      const url = `${API_BASE_URL}${API_PATHS.auth}${path}`;

      xhr.open(method, url, true);
      xhr.timeout = 30000;

      const headers = buildHeaders(token);

      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

      // Always serialize payloads as valid JSON when Content-Type is application/json.
      // This prevents backend JSON parser crashes that surface as "XHR request failed".
      const { body } = safeJsonSerialize(data);

      // PRODUCTION-SAFE DIAGNOSTICS (no secrets): log body length + first char for auth endpoints only.
      try {
        if (method === "POST" && (path === "/login" || path === "/register")) {
          const len = typeof body === "string" ? body.length : 0;
          const first = typeof body === "string" ? body.slice(0, 1) : "";
          console.log("AUTH_XHR_DEBUG", { method, path, hasBody: Boolean(body), bodyLength: len, firstChar: first });
        }
      } catch {}

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            const text = xhr.responseText;

            if (!text) {
              resolve(null);
              return;
            }

            const parsed = JSON.parse(text);
            resolve(parsed);
          } catch (parseError) {
            resolve(xhr.responseText);
          }
        }
      };

      xhr.ontimeout = () => {
        reject({
          message: "Request timed out",
          status: xhr.status || 0,
        });
      };

      xhr.onerror = () => {
        reject({
          message: "Network request failed",
          status: xhr.status || 0,
          responseText: xhr.responseText,
        });
      };

      if (typeof body === "string") xhr.send(body);
      else xhr.send();
    } catch (err) {
      reject({
        message: "XHR request failed",
      });
    }
  });
};

export const hermesAuthClient = {
  post: (path: string, body?: any, token?: string | null) =>
    hermesSafeRequest("POST", path, body, token),

  get: (path: string, token?: string | null) =>
    hermesSafeRequest("GET", path, undefined, token),

  put: (path: string, body?: any, token?: string | null) =>
    hermesSafeRequest("PUT", path, body, token),
};