import { API_PATHS } from '../constants/apiPaths';
import { API_BASE_URL } from '../config';
import { withBasePath } from './apiClient';
import api from './apiClient';
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
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken?: string;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
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
      // CRITICAL FIX: Use direct API call instead of withBasePath to avoid duplication
      const loginUrl = `${API_BASE_URL}${API_PATHS.auth}/login`;
      console.log('[AUTH SERVICE] Login URL:', loginUrl);
      console.log('[AUTH SERVICE] API_BASE_URL:', API_BASE_URL);
      console.log('[AUTH SERVICE] API_PATHS.auth:', API_PATHS.auth);
      
      // Direct API call to prevent path duplication
      const response = await api.post(`${API_PATHS.auth}/login`, { email, password });
      const payload = response?.data;
      
      // Log response structure for debugging
      console.log('[AUTH SERVICE] Login response success:', payload?.success);
      console.log('[AUTH SERVICE] Login response has accessToken:', !!payload?.data?.accessToken);
      console.log('[AUTH SERVICE] Login response has token:', !!payload?.data?.token);
      console.log('[AUTH SERVICE] Full response payload:', JSON.stringify(payload, null, 2));

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
          accessToken: accessToken,
          tokenType: payload.data.tokenType || 'Bearer',
          expiresIn: payload.data.expiresIn || 900,
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
        url: safe.config?.url || safe.request?.url,
        fullError: err
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
      // CRITICAL FIX: Use direct API call instead of withBasePath to avoid duplication
      const registerUrl = `${API_BASE_URL}${API_PATHS.auth}/register`;
      console.log('[AUTH SERVICE] Register URL:', registerUrl);
      console.log('[AUTH SERVICE] API_BASE_URL:', API_BASE_URL);
      console.log('[AUTH SERVICE] API_PATHS.auth:', API_PATHS.auth);
      
      // Direct API call to prevent path duplication
      const response = await api.post(`${API_PATHS.auth}/register`, { name, email, password });
      const payload = response?.data;
      
      // Log response structure for debugging
      console.log('[AUTH SERVICE] Register response success:', payload?.success);
      console.log('[AUTH SERVICE] Register response has accessToken:', !!payload?.data?.accessToken);
      console.log('[AUTH SERVICE] Register response has token:', !!payload?.data?.token);
      console.log('[AUTH SERVICE] Full response payload:', JSON.stringify(payload, null, 2));

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
          accessToken: accessToken,
        },
      };
    } catch (err) {
      const safe = createSafeError(err);

      // Log error details for production debugging
      console.error('[AUTH SERVICE] Register error:', {
        status: safe.response?.status,
        message: safe.message,
        responseData: safe.response?.data,
        url: safe.config?.url || safe.request?.url,
        fullError: err
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
      // CRITICAL FIX: Use direct API call to prevent path duplication
      await api.post(`${API_PATHS.auth}/logout`, payloadBody);
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      return { success: true, message: 'Logout successful' };
    } catch (err) {
      const safe = createSafeError(err);
      console.error('[AUTH SERVICE] Logout error:', {
        status: safe.response?.status,
        message: safe.message,
        responseData: safe.response?.data,
        url: safe.config?.url || safe.request?.url
      });
      
      // Still clear local tokens even if logout API fails
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
      } catch (storageError) {
        console.error('[AUTH SERVICE] Token cleanup error:', storageError);
      }
      
      return { success: false, message: 'Logout failed' };
    }
  },

  /* ------------------------- TOKEN HELPERS ------------------------- */

  async getToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('authToken');
      const isValidToken = typeof token === 'string' && token.length > 10;
      console.log('[AUTH SERVICE] Token retrieval:', { hasToken: !!token, isValid: isValidToken, tokenLength: token?.length });
      return isValidToken ? token : null;
    } catch (err) {
      console.error('[AUTH SERVICE] Token retrieval error:', err);
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      console.log('[AUTH SERVICE] Clearing invalid tokens');
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      await Storage.deleteItem('user');
    } catch (err) {
      console.error('[AUTH SERVICE] Token cleanup error:', err);
      // Don't throw - cleanup failures should not break auth flows
    }
  },

  /* -------------------------- REFRESH TOKEN -------------------------- */

  async refreshToken(): Promise<{ success: boolean; message: string; data?: { accessToken: string; tokenType: string; expiresIn: number } }> {
    try {
      const refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;

      // CRITICAL FIX: Use direct API call to prevent path duplication
      const response = await api.post(`${API_PATHS.auth}/refresh-token`, payloadBody);
      const payload = response?.data;

      const accessToken = payload?.data?.accessToken || payload?.data?.token;

      if (!payload?.success || !accessToken) {
        return {
          success: false,
          message: payload?.message || 'Invalid refresh response',
        };
      }

      if (typeof accessToken !== 'string' || accessToken.length < 10) {
        return {
          success: false,
          message: 'Invalid access token received from refresh',
        };
      }

      await Storage.setItem('authToken', accessToken);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: accessToken,
          tokenType: payload.data.tokenType || 'Bearer',
          expiresIn: payload.data.expiresIn || 900,
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
      // CRITICAL FIX: Use direct API call to prevent path duplication
      const response = await api.put(`${API_PATHS.auth}/profile`, data);
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
