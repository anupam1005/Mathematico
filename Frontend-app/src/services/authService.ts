import { API_PATHS } from '../constants/apiPaths';
import api from './apiClient';
import { postAuthJson } from './authHttp';
import { tokenStorage } from './tokenStorage';
import { safeCatch } from '../utils/safeCatch';
import { createSafeError } from '../utils/safeError';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface LoginResponse {
  success: boolean;
  message?: string;
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
  message?: string;
  data?: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn: number;
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: {
    user: any;
    accessToken?: string;
    refreshToken?: string;
  };
}

/* ------------------------------------------------------------------ */
/* Auth Service                                                       */
/* ------------------------------------------------------------------ */

const toBearerToken = (payload: any): string | null => {
  const token =
    payload?.data?.accessToken ||
    payload?.data?.token ||
    payload?.accessToken ||
    payload?.token;
  return typeof token === 'string' && token.length > 10 ? token : null;
};

const toRefreshToken = (payload: any): string | null => {
  const token = payload?.data?.refreshToken || payload?.refreshToken;
  return typeof token === 'string' && token.length > 10 ? token : null;
};

const toLoginErrorMessage = (error: any): string => {
  const safe = createSafeError(error);
  const code = typeof safe?.code === 'string' ? safe.code : '';
  if (code === 'TIMEOUT') return 'Login timed out. Please check your connection and try again.';
  if (code === 'NETWORK_ERROR' || code === 'OFFLINE') return 'Unable to reach server. Please check your internet connection.';
  if (code === 'API_ERROR' && !safe?.response?.status) return 'Server is unreachable right now. Please try again.';
  if (code === 'CANCELLED') return 'Login request was cancelled. Please try again.';
  const backendMessage =
    typeof safe?.response?.data?.message === 'string'
      ? safe.response.data.message
      : typeof safe?.message === 'string'
        ? safe.message
        : '';
  return backendMessage || 'Login failed. Please try again.';
};

const toRegisterErrorMessage = (error: any): string => {
  const safe = createSafeError(error);
  const code = typeof safe?.code === 'string' ? safe.code : '';
  if (code === 'TIMEOUT') return 'Registration timed out. Please check your connection and try again.';
  if (code === 'NETWORK_ERROR' || code === 'OFFLINE') return 'Unable to reach server. Please check your internet connection.';
  if (code === 'CANCELLED') return 'Registration was cancelled. Please try again.';
  const backendMessage =
    typeof safe?.response?.data?.message === 'string'
      ? safe.response.data.message
      : typeof safe?.message === 'string'
        ? safe.message
        : '';
  return backendMessage || 'Registration failed. Please try again.';
};

const authService = {
  /* ---------------------------- LOGIN ----------------------------- */

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('[AUTH_TRANSPORT] login -> fetch(authHttp)');
      const payload = await postAuthJson<any>('/login', { email, password });
      console.log('[AUTH] login response received');

      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.message || 'Invalid login response payload');
      }

      // Normalize backend shape for mobile clients
      const rawUser = payload.data.user || payload.data || null;
      const accessToken = toBearerToken(payload);
      const refreshToken = toRefreshToken(payload);

      if (!rawUser || typeof rawUser !== 'object') {
        throw new Error('Login response missing user object');
      }

      if (!accessToken) {
        throw new Error(payload?.message || 'Login response missing access token');
      }

      await tokenStorage.setSession({
        user: rawUser,
        tokens: {
          accessToken,
          refreshToken,
        },
      });

      // Final-stage real-device validation: ensure tokens are available immediately after save.
      const stored = await tokenStorage.getAccessToken();
      console.log('[AUTH] token stored:', stored ? `present(len=${stored.length})` : 'missing');
      console.log('LOGIN SUCCESS: session stored');

      return {
        success: true,
        message: payload.message,
        data: {
          user: rawUser,
          accessToken,
          tokenType: 'Bearer',
          expiresIn: payload.data.expiresIn || 900,
          refreshToken: refreshToken || undefined,
        },
      };
    } catch (error: any) {
      throw new Error(toLoginErrorMessage(error));
    }
  },

  /* --------------------------- REGISTER ---------------------------- */

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    try {
      console.log('[AUTH_TRANSPORT] register -> fetch(authHttp)');
      const payload = await postAuthJson<any>('/register', {
        name,
        email,
        password,
      });

      if (!payload?.success || !payload?.data) {
        return {
          success: false,
          message: payload?.message,
        };
      }

      const rawUser = payload.data.user || payload.data || null;
      const refreshToken = toRefreshToken(payload);

      return {
        success: true,
        message: payload.message,
        data: {
          user: rawUser,
          refreshToken: refreshToken || undefined,
        },
      };
    } catch (error: any) {
      throw new Error(toRegisterErrorMessage(error));
    }
  },

  /* ----------------------------- LOGOUT ---------------------------- */

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await api.post(`${API_PATHS.auth}/logout`);
    } catch (error) {
      safeCatch('authService.logout')(error);
      throw error;
    }
    await tokenStorage.clearSession();
    return { success: true, message: 'Logout successful' };
  },

  /* ------------------------- TOKEN HELPERS ------------------------- */

  async getToken(): Promise<string | null> {
    try {
      return await tokenStorage.getAccessToken();
    } catch (err: any) {
      const errorObj = err as any;
      safeCatch('authService.getToken')(errorObj);
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      await tokenStorage.clearSession();
    } catch (err: any) {
      const errorObj = err as any;
      safeCatch('authService.clearInvalidTokens')(errorObj);
    }
  },

  /* ------------------------- UPDATE PROFILE -------------------------- */

  async updateProfile(data: Partial<any>): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await api.put(`${API_PATHS.auth}/profile`, data);
      const payload = response?.data ?? null;

      if (!payload?.success) {
        return { success: false, message: payload?.message };
      }

      return {
        success: true,
        message: payload.message,
        data: payload.data,
      };
    } catch (error: any) {
      throw error;
    }
  },

  async restoreSession(): Promise<{ user: any | null; isAuthenticated: boolean }> {
    try {
      await tokenStorage.hydrate();
      const { user, accessToken } = await tokenStorage.getSession();
      const isAuthenticated = Boolean(accessToken && user);
      console.log('[AUTH] restore session result:', {
        hasToken: Boolean(accessToken),
        hasUser: Boolean(user),
        isAuthenticated,
      });
      if (!isAuthenticated && (accessToken || user)) {
        await tokenStorage.clearSession();
      }
      return {
        user,
        isAuthenticated,
      };
    } catch (error) {
      safeCatch('authService.restoreSession')(error);
      await tokenStorage.clearSession();
      return { user: null, isAuthenticated: false };
    }
  },
};

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */

export { authService };
export default authService;
