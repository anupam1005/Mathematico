import { API_PATHS } from '../constants/apiPaths';
import api from './apiClient';
import { Storage } from '../utils/storage';
import { createSafeError } from '../utils/safeError';

// const authApi = withBasePath(API_PATHS.auth);

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
      // Use relative path - api client already has the full base URL
      const response = await api.post(`${API_PATHS.auth}/login`, { email, password });
      const payload = response?.data;

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

      // Use safeError for structured logging and error formatting
      const errorContext = {
        timestamp: new Date().toISOString(),
        service: 'authService.login',
        email: email.substring(0, 3) + '***@***', // Partial email for privacy
        errorType: safe.response?.status ? `HTTP_${safe.response.status}` : 'NETWORK_ERROR',
        errorMessage: safe.message,
      };

      // Log error details for production debugging
      console.error('AUTH_LOGIN_ERROR', JSON.stringify(errorContext));

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
      // Direct API call to prevent path duplication
      const response = await api.post(`${API_PATHS.auth}/register`, { name, email, password });
      const payload = response?.data;

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

      // Use safeError for structured logging and error formatting
      const errorContext = {
        timestamp: new Date().toISOString(),
        service: 'authService.register',
        name: name.substring(0, 3) + '***', // Partial name for privacy
        email: email.substring(0, 3) + '***@***', // Partial email for privacy
        errorType: safe.response?.status ? `HTTP_${safe.response.status}` : 'NETWORK_ERROR',
        errorMessage: safe.message,
      };

      // Log error details for production debugging
      console.error('AUTH_REGISTER_ERROR', JSON.stringify(errorContext));

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
    let refreshTokenValue: string | null = null;
    try {
      refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;
      // CRITICAL FIX: Use direct API call to prevent path duplication
      await api.post(`${API_PATHS.auth}/logout`, payloadBody);
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      return { success: true, message: 'Logout successful' };
    } catch (err) {
      const safeError = createSafeError(err);
      
      // Use safeError for structured logging and error formatting
      const errorContext = {
        timestamp: new Date().toISOString(),
        service: 'authService.logout',
        hasRefreshToken: !!refreshTokenValue,
        errorType: safeError.response?.status ? `HTTP_${safeError.response.status}` : 'NETWORK_ERROR',
        errorMessage: safeError.message,
      };

      // Log error details for production debugging
      console.error('AUTH_LOGOUT_ERROR', JSON.stringify(errorContext));
      
      // Still clear local tokens even if logout API fails
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
      } catch (storageError: any) {
        // Token cleanup error
        const storageErrorContext = {
          timestamp: new Date().toISOString(),
          service: 'authService.logout.tokenCleanup',
          errorType: 'STORAGE_ERROR',
          errorMessage: storageError?.message || 'Unknown storage error',
        };
        console.error('AUTH_LOGOUT_STORAGE_ERROR', JSON.stringify(storageErrorContext));
      }
      return { success: false, message: 'Logout failed' };
    }
  },

  /* ------------------------- TOKEN HELPERS ------------------------- */

  async getToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('authToken');
      const isValidToken = typeof token === 'string' && token.length > 10;
      return isValidToken ? token : null;
    } catch (err) {
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      await Storage.deleteItem('user');
    } catch (err) {
      // Token cleanup error
      // Don't throw - cleanup failures should not break auth flows
    }
  },

  /* -------------------------- REFRESH TOKEN -------------------------- */

  async refreshToken(): Promise<{ success: boolean; message: string; data?: { accessToken: string; tokenType: string; expiresIn: number } }> {
    let refreshTokenValue: string | null = null;
    try {
      refreshTokenValue = await Storage.getItem('refreshToken');
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
      
      // Use safeError for structured logging and error formatting
      const errorContext = {
        timestamp: new Date().toISOString(),
        service: 'authService.refreshToken',
        hasRefreshToken: !!refreshTokenValue,
        errorType: safe.response?.status ? `HTTP_${safe.response.status}` : 'NETWORK_ERROR',
        errorMessage: safe.message,
      };

      // Log error details for production debugging
      console.error('AUTH_REFRESH_ERROR', JSON.stringify(errorContext));
      
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
      
      // Use safeError for structured logging and error formatting
      const errorContext = {
        timestamp: new Date().toISOString(),
        service: 'authService.updateProfile',
        updateFields: Object.keys(data),
        errorType: safe.response?.status ? `HTTP_${safe.response.status}` : 'NETWORK_ERROR',
        errorMessage: safe.message,
      };

      // Log error details for production debugging
      console.error('AUTH_UPDATE_PROFILE_ERROR', JSON.stringify(errorContext));
      
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
