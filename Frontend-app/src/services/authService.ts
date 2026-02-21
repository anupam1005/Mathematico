import { API_PATHS } from '../constants/apiPaths';
import { API_BASE_URL } from '../config';
import { withBasePath } from './apiClient';
import { Storage } from '../utils/storage';
import { createSafeError } from '../utils/safeError';

const authApi = withBasePath(API_PATHS.auth);

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
      // Log the exact endpoint being called
      const loginUrl = `${API_BASE_URL}/auth/login`;
      console.log('[AUTH SERVICE] Login URL:', loginUrl);
      
      const response = await authApi.post('/login', { email, password });
      const payload = response?.data;
      
      // Log response structure for debugging
      console.log('[AUTH SERVICE] Login response success:', payload?.success);
      console.log('[AUTH SERVICE] Login response has accessToken:', !!payload?.data?.accessToken);
      console.log('[AUTH SERVICE] Login response has token:', !!payload?.data?.token);

      const accessToken = payload?.data?.accessToken || payload?.data?.token;

      if (!payload?.success || !accessToken) {
        return {
          success: false,
          message: payload?.message || 'Invalid login response',
        };
      }

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
          refreshToken: payload.data.refreshToken,
        },
      };
    } catch (err) {
      const safe = createSafeError(err);

      // Log error details for production debugging
      console.error('[AUTH SERVICE] Login error:', {
        status: safe.response?.status,
        message: safe.message,
        responseData: safe.response?.data,
        url: safe.config?.url || safe.request?.url
      });

      let message = 'Login failed';
      const msg = String(safe.message || '');

      if (msg.includes('Network') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
        message = 'Network error. Please check your internet connection.';
      } else if (safe.response?.status === 401) {
        message = safe.response?.data?.message || 'Invalid email or password';
      } else if (safe.response?.status === 429) {
        message = safe.response?.data?.message || 'Too many login attempts. Please try again later.';
      } else if (safe.response?.status === 503) {
        message = safe.response?.data?.message || 'Service temporarily unavailable. Please try again later.';
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
      // Log the exact endpoint being called
      const registerUrl = `${API_BASE_URL}/auth/register`;
      console.log('[AUTH SERVICE] Register URL:', registerUrl);
      
      const response = await authApi.post('/register', { name, email, password });
      const payload = response?.data;
      
      // Log response structure for debugging
      console.log('[AUTH SERVICE] Register response success:', payload?.success);
      console.log('[AUTH SERVICE] Register response has accessToken:', !!payload?.data?.accessToken);
      console.log('[AUTH SERVICE] Register response has token:', !!payload?.data?.token);

      if (!payload?.success) {
        return {
          success: false,
          message: payload?.message || 'Registration failed',
        };
      }

      const accessToken = payload?.data?.accessToken || payload?.data?.token;
      if (accessToken) {
        await Storage.setItem('authToken', accessToken);
      }

      return {
        success: true,
        message: payload.message || 'Registration successful',
        data: {
          ...payload.data,
          token: accessToken,
        },
      };
    } catch (err) {
      const safe = createSafeError(err);

      // Log error details for production debugging
      console.error('[AUTH SERVICE] Register error:', {
        status: safe.response?.status,
        message: safe.message,
        responseData: safe.response?.data,
        url: safe.config?.url || safe.request?.url
      });

      let message = 'Registration failed';
      if (safe.response?.status === 400) {
        message = safe.response?.data?.message || 'Invalid registration data';
      } else if (safe.response?.status === 409) {
        message = safe.response?.data?.message || 'Email already exists';
      } else if (safe.response?.status === 429) {
        message = safe.response?.data?.message || 'Too many registration attempts. Please try again later.';
      } else if (safe.response?.status === 503) {
        message = safe.response?.data?.message || 'Service temporarily unavailable. Please try again later.';
      } else if (safe.response?.data?.message) {
        message = safe.response.data.message;
      } else if (safe.message?.includes('Network') || safe.message?.includes('ECONNREFUSED') || safe.message?.includes('timeout')) {
        message = 'Network error. Please check your internet connection.';
      }

      return { success: false, message };
    }
  },

  /* ----------------------------- LOGOUT ---------------------------- */

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;
      await authApi.post('/logout', payloadBody);
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

  /* -------------------------- REFRESH TOKEN -------------------------- */

  async refreshToken(): Promise<{ success: boolean; message: string; data?: { token: string; refreshToken?: string } }> {
    try {
      const refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;

      const response = await authApi.post('/refresh-token', payloadBody);
      const payload = response?.data;

      const accessToken = payload?.data?.accessToken || payload?.data?.token;

      if (!payload?.success || !accessToken) {
        return {
          success: false,
          message: payload?.message || 'Invalid refresh response',
        };
      }
      const newRefreshToken = payload.data.refreshToken || refreshTokenValue || undefined;

      if (typeof accessToken !== 'string' || accessToken.length < 10) {
        return {
          success: false,
          message: 'Invalid access token received from refresh',
        };
      }

      await Storage.setItem('authToken', accessToken);
      if (newRefreshToken && newRefreshToken !== refreshTokenValue) {
        await Storage.setItem('refreshToken', newRefreshToken);
      }

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (err) {
      const safe = createSafeError(err);
      return {
        success: false,
        message: safe.message || 'Token refresh failed',
      };
    }
  },

  /* ------------------------- UPDATE PROFILE -------------------------- */

  async updateProfile(data: Partial<any>): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await authApi.put('/profile', data);
      const payload = response?.data;

      if (!payload?.success) {
        return {
          success: false,
          message: payload?.message || 'Profile update failed',
        };
      }

      return {
        success: true,
        message: payload.message || 'Profile updated successfully',
        data: payload.data,
      };
    } catch (err) {
      const safe = createSafeError(err);
      return {
        success: false,
        message: safe.message || 'Profile update failed',
      };
    }
  },
};

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */

export { authService };
export default authService;
