
import axios, { AxiosInstance } from 'axios';
import { API_PATHS } from '../constants/apiPaths';
import { Storage } from '../utils/storage';
import { API_BASE_URL } from '../config';
import { hermesAuthClient } from './hermesAuthClient';

/* ------------------------------------------------------------------ */
/* Auth API - Hermes-safe (dedicated Axios instance, no interceptors) */
/* ------------------------------------------------------------------ */

// Create a dedicated Axios instance for auth that does NOT use the shared
// interceptors. This isolates login/register from any potential Hermes
// issues in global interceptor chains while still using Axios.
const authApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PATHS.auth}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const buildHeaders = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token && typeof token === 'string' && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

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
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/login`;
      console.log('REQUEST_URL:', requestUrl);

      const responseData = await hermesAuthClient.post('/login', {
        email,
        password,
      });

      const payload = responseData ?? null;

      // Flexible token extraction for backend compatibility
      const accessToken = payload?.data?.accessToken || payload?.data?.token || payload?.accessToken || payload?.token;

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
      
      // PRODUCTION DEBUG: Verify token storage
      console.log('TOKEN_SAVED');
      const storedToken = await Storage.getItem('authToken');
      console.log('TOKEN_VERIFIED', storedToken ? 'SUCCESS' : 'FAILED');

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
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_LOGIN_ERROR_OBJECT', errorObj);
      console.error('FULL_LOGIN_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_LOGIN_ERROR_STACK', errorObj?.stack);

      // Prefer backend error message if available
      const backendMessage =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Login failed - please check your connection and try again';

      return {
        success: false,
        message: backendMessage,
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
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/register`;
      console.log('REQUEST_URL:', requestUrl);

      const responseData = await hermesAuthClient.post('/register', {
        name,
        email,
        password,
      });

      const payload = responseData ?? null;

      if (!payload?.success) {
        return {
          success: false,
          message: payload?.message || 'Registration failed',
        };
      }

      // Flexible token extraction for backend compatibility
      const accessToken = payload?.data?.accessToken || payload?.data?.token || payload?.accessToken || payload?.token;
      
      if (accessToken) {
        await Storage.setItem('authToken', accessToken);
        console.log('TOKEN_SAVED');
        const storedToken = await Storage.getItem('authToken');
        console.log('TOKEN_VERIFIED', storedToken ? 'SUCCESS' : 'FAILED');
      }

      return {
        success: true,
        message: payload.message || 'Registration successful',
        data: {
          ...payload.data,
          accessToken: accessToken,
        },
      };
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_REGISTER_ERROR_OBJECT', errorObj);
      console.error('FULL_REGISTER_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_REGISTER_ERROR_STACK', errorObj?.stack);

      const backendMessage =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Registration failed - please check your connection and try again';

      return {
        success: false,
        message: backendMessage,
      };
    }
  },

  /* ----------------------------- LOGOUT ---------------------------- */

  async logout(): Promise<{ success: boolean; message: string }> {
    let refreshTokenValue: string | null = null;
    try {
      refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;
      const authToken = await Storage.getItem('authToken');

      await authApi.post(
        '/logout',
        payloadBody,
        {
          headers: buildHeaders(authToken ?? null),
        }
      );
      
      // Always clear local tokens regardless of API response
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      
      return { success: true, message: 'Logout successful' };
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_LOGOUT_ERROR_OBJECT', errorObj);
      console.error('FULL_LOGOUT_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_LOGOUT_ERROR_STACK', errorObj?.stack);

      // Still clear local tokens even if logout API fails
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
      } catch (storageError: any) {
        const storageErrorObj = storageError as any;
        console.error('FULL_LOGOUT_STORAGE_ERROR_OBJECT', storageErrorObj);
        console.error('FULL_LOGOUT_STORAGE_ERROR_MESSAGE', storageErrorObj?.message);
        console.error('FULL_LOGOUT_STORAGE_ERROR_STACK', storageErrorObj?.stack);
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
    let refreshTokenValue: string | null = null;
    try {
      refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;

      // PRODUCTION DEBUG: Log request URL
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/refresh-token`;
      console.log('REFRESH_REQUEST_URL:', requestUrl);

      // Get auth token for protected endpoints
      const authToken = await Storage.getItem('authToken');

      const axiosResponse = await authApi.post(
        '/refresh-token',
        payloadBody,
        {
          headers: buildHeaders(authToken ?? null),
        }
      );

      const responseData = axiosResponse.data;
      const payload = responseData ?? null;

      const accessToken = payload?.data?.accessToken || payload?.data?.token || payload?.accessToken || payload?.token;

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
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_REFRESH_ERROR_OBJECT', errorObj);
      console.error('FULL_REFRESH_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_REFRESH_ERROR_STACK', errorObj?.stack);

      return {
        success: false,
        message: 'Token refresh failed',
      };
    }
  },

  /* ------------------------- UPDATE PROFILE -------------------------- */

  async updateProfile(data: Partial<any>): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // PRODUCTION DEBUG: Log request URL
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/profile`;
      console.log('PROFILE_UPDATE_REQUEST_URL:', requestUrl);

      const authToken = await Storage.getItem('authToken');

      const axiosResponse = await authApi.put(
        '/profile',
        data,
        {
          headers: buildHeaders(authToken ?? null),
        }
      );
      const responseData = axiosResponse.data;

      const payload = responseData ?? null;

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
    } catch (err: any) {
      const errorObj = err as any;
      // Hermes-safe error logging – avoid JSON.stringify on Error objects
      console.error('FULL_UPDATE_PROFILE_ERROR_OBJECT', errorObj);
      console.error('FULL_UPDATE_PROFILE_ERROR_MESSAGE', errorObj?.message);
      console.error('FULL_UPDATE_PROFILE_ERROR_STACK', errorObj?.stack);

      return {
        success: false,
        message: 'Profile update failed',
      };
    }
  },
};

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */

export { authService };
export default authService;
