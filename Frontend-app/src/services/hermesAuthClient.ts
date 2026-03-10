import { API_BASE_URL } from "../config";
import { API_PATHS } from "../constants/apiPaths";

type HeadersMap = Record<string, string>;

const buildHeaders = (token?: string | null): HeadersMap => {
  const headers: HeadersMap = {
    "Content-Type": "application/json",
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

      const headers = buildHeaders(token);

      Object.keys(headers).forEach((key) => {
        xhr.setRequestHeader(key, headers[key]);
      });

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

      xhr.onerror = () => {
        reject({
          message: "Network request failed",
        });
      };

      if (data) {
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send();
      }
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