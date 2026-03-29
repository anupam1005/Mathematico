import { API_PATHS } from '../constants/apiPaths';
import api, { withBasePath } from './apiClient';
import { tokenStorage } from './tokenStorage';
import { safeCatch } from '../utils/safeCatch';

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
    accessToken: string;
    refreshToken?: string;
  };
}

/* ------------------------------------------------------------------ */
/* Auth Service                                                       */
/* ------------------------------------------------------------------ */

const authApi = withBasePath(API_PATHS.auth);

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

const authService = {
  /* ---------------------------- LOGIN ----------------------------- */

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/login', { email, password }, { skipAuthRefresh: true });
      const payload = response?.data ?? null;

      if (!payload?.success || !payload?.data) {
        return {
          success: false,
          message: payload?.message,
        };
      }

      // Normalize backend shape for mobile clients
      const rawUser = payload.data.user || payload.data || null;
      const accessToken = toBearerToken(payload);
      const refreshToken = toRefreshToken(payload);

      if (!accessToken) {
        return {
          success: false,
          message: payload?.message,
        };
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
      console.log('TOKEN AFTER SAVE:', stored ? `Bearer [len=${stored.length}]` : 'MISSING');

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
      throw error;
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
      }, { skipAuthRefresh: true });

      const payload = response?.data ?? null;

      if (!payload?.success || !payload?.data) {
        return {
          success: false,
          message: payload?.message,
        };
      }

      const rawUser = payload.data.user || payload.data || null;
      const accessToken = toBearerToken(payload);
      const refreshToken = toRefreshToken(payload);

      if (!accessToken) {
        return {
          success: false,
          message: payload?.message,
        };
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
      console.log('TOKEN AFTER SAVE:', stored ? `Bearer [len=${stored.length}]` : 'MISSING');

      return {
        success: true,
        message: payload.message,
        data: {
          user: rawUser,
          accessToken,
          refreshToken: refreshToken || undefined,
        },
      };
    } catch (error: any) {
      throw error;
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
      const { user, accessToken, refreshToken } = await tokenStorage.getSession();
      return {
        user,
        isAuthenticated: Boolean(accessToken && refreshToken && user),
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
