
import { API_PATHS } from '../constants/apiPaths';
import { Storage } from '../utils/storage';
import api, { withBasePath } from './apiClient';

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
  data?: {
    user: any;
    token: string;
  };
}

/* ------------------------------------------------------------------ */
/* Auth Service                                                       */
/* ------------------------------------------------------------------ */

const authApi = withBasePath(API_PATHS.auth);

const authService = {
  /* ---------------------------- LOGIN ----------------------------- */

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/login', { email, password });
      const payload = response?.data ?? null;

      if (!payload?.success || !payload?.data) {
        return {
          success: false,
          message: payload?.message || 'Invalid login response',
        };
      }

      // Normalize backend shape for mobile clients
      const rawUser = payload.data.user || payload.data;
      const token: string =
        payload.data.accessToken ||
        payload.data.token ||
        payload.accessToken ||
        payload.token;

      if (!token || typeof token !== 'string' || token.length < 10) {
        return {
          success: false,
          message: 'Invalid token received from server',
        };
      }

      await Storage.setItem('authToken', token);

      return {
        success: true,
        message: payload.message || 'Login successful',
        data: {
          user: rawUser,
          accessToken: token,
          tokenType: 'Bearer',
          expiresIn: payload.data.expiresIn || 900,
        },
      };
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        'Login failed - please check your connection and try again';

      return {
        success: false,
        message,
      };
    }
  },

  /* --------------------------- REGISTER ---------------------------- */

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    try {
      const response = await authApi.post('/register', {
        name,
        email,
        password,
      });

      const payload = response?.data ?? null;

      if (!payload?.success || !payload?.data) {
        return {
          success: false,
          message: payload?.message || 'Registration failed',
        };
      }

      const rawUser = payload.data.user || payload.data;
      const token: string =
        payload.data.accessToken ||
        payload.data.token ||
        payload.accessToken ||
        payload.token;

      if (token && typeof token === 'string' && token.length > 0) {
        await Storage.setItem('authToken', token);
      }

      return {
        success: true,
        message: payload.message || 'Registration successful',
        data: {
          user: rawUser,
          token,
        },
      };
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        'Registration failed - please check your connection and try again';

      return {
        success: false,
        message,
      };
    }
  },

  /* ----------------------------- LOGOUT ---------------------------- */

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await api.post(`${API_PATHS.auth}/logout`);
    } catch {
      // Ignore backend logout failures – we still clear local state
    }
    await Storage.deleteItem('authToken');
    await Storage.deleteItem('refreshToken');
    await Storage.deleteItem('user');
    return { success: true, message: 'Logout successful' };
  },

  /* ------------------------- TOKEN HELPERS ------------------------- */

  async getToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('authToken');
      const isValidToken = typeof token === 'string' && token.length > 10;
      return isValidToken ? token : null;
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_GET_TOKEN_ERROR_OBJECT', errorObj);
      console.error('FULL_GET_TOKEN_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_GET_TOKEN_ERROR_STACK', errorObj?.stack);
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      await Storage.deleteItem('user');
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_CLEAR_INVALID_TOKENS_ERROR_OBJECT', errorObj);
      console.error('FULL_CLEAR_INVALID_TOKENS_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_CLEAR_INVALID_TOKENS_ERROR_STACK', errorObj?.stack);
      // Don't throw - cleanup failures should not break auth flows
    }
  },

  /* -------------------------- REFRESH TOKEN -------------------------- */

  async refreshToken(): Promise<{ success: boolean; message: string; data?: { accessToken: string; tokenType: string; expiresIn: number } }> {
    try {
      const response = await api.post(`${API_PATHS.auth}/refresh-token`);
      const payload = response?.data ?? null;

      const accessToken =
        payload?.data?.accessToken ||
        payload?.data?.token ||
        payload?.accessToken ||
        payload?.token;

      if (!payload?.success || !accessToken || typeof accessToken !== 'string' || accessToken.length < 10) {
        return {
          success: false,
          message: payload?.message || 'Invalid refresh response',
        };
      }

      await Storage.setItem('authToken', accessToken);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          tokenType: payload.data?.tokenType || 'Bearer',
          expiresIn: payload.data?.expiresIn || 900,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Token refresh failed',
      };
    }
  },

  /* ------------------------- UPDATE PROFILE -------------------------- */

  async updateProfile(data: Partial<any>): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await api.put(`${API_PATHS.auth}/profile`, data);
      const payload = response?.data ?? null;

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
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Profile update failed',
      };
    }
  },
};

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */

export { authService };
export default authService;
