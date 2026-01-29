import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config';
import { Storage } from '../utils/storage';
import { createSafeError } from '../utils/safeError';

/* ------------------------------------------------------------------ */
/* Axios instance (NO logging, NO raw rejects)                          */
/* ------------------------------------------------------------------ */

const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.auth,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await Storage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore token read failures
    }
    return config;
  },
  () => Promise.reject({ message: 'Request preparation failed' })
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => Promise.reject(createSafeError(error))
);

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
    token: string;
    refreshToken?: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: any;
}

/* ------------------------------------------------------------------ */
/* Auth Service                                                       */
/* ------------------------------------------------------------------ */

const authService = {
  /* ---------------------------- LOGIN ----------------------------- */

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post('/login', { email, password });
      const payload = response?.data;

      if (!payload?.success || !payload?.data?.accessToken) {
        return {
          success: false,
          message: payload?.message || 'Invalid login response',
        };
      }

      const accessToken = payload.data.accessToken;

      if (typeof accessToken !== 'string' || accessToken.length < 10) {
        return {
          success: false,
          message: 'Invalid access token received',
        };
      }

      await Storage.setItem('authToken', accessToken);

      return {
        success: true,
        message: payload.message || 'Login successful',
        data: {
          user: payload.data.user,
          token: accessToken,
        },
      };
    } catch (err) {
      const safe = createSafeError(err);

      let message = 'Login failed';
      const msg = String(safe.message || '');

      if (msg.includes('Network')) {
        message = 'Network error. Please check your internet connection.';
      } else if (safe.response?.status === 401) {
        message = 'Invalid email or password';
      } else if (safe.response?.data?.message) {
        message = safe.response.data.message;
      }

      return { success: false, message };
    }
  },

  /* --------------------------- REGISTER ---------------------------- */

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    try {
      const response = await api.post('/register', { name, email, password });
      const payload = response?.data;

      if (!payload?.success) {
        return {
          success: false,
          message: payload?.message || 'Registration failed',
        };
      }

      if (payload?.data?.accessToken) {
        await Storage.setItem('authToken', payload.data.accessToken);
      }

      return {
        success: true,
        message: payload.message || 'Registration successful',
        data: payload.data,
      };
    } catch (err) {
      const safe = createSafeError(err);

      let message = 'Registration failed';
      if (safe.response?.status === 409) {
        message = 'Email already exists';
      } else if (safe.response?.data?.message) {
        message = safe.response.data.message;
      }

      return { success: false, message };
    }
  },

  /* ----------------------------- LOGOUT ---------------------------- */

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/logout');
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      return { success: true, message: 'Logout successful' };
    } catch {
      return { success: false, message: 'Logout failed' };
    }
  },

  /* ------------------------- TOKEN HELPERS ------------------------- */

  async getToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('authToken');
      return typeof token === 'string' && token.length > 10 ? token : null;
    } catch {
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      await Storage.deleteItem('user');
    } catch {
      // ignore
    }
  },
};

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */

export { authService };
export default authService;
