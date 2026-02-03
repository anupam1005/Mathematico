import { API_PATHS } from '../constants/apiPaths';
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
      const response = await authApi.post('/login', { email, password });
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
          refreshToken: payload.data.refreshToken,
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
      const response = await authApi.post('/register', { name, email, password });
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

      if (!payload?.success || !payload?.data?.accessToken) {
        return {
          success: false,
          message: payload?.message || 'Invalid refresh response',
        };
      }

      const accessToken = payload.data.accessToken;
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
