import { API_PATHS } from '../constants/apiPaths';
import { Storage } from '../utils/storage';
import { API_BASE_URL } from '../config';
import { withBasePath } from '../services/apiClient';

/* ------------------------------------------------------------------ */
/* Axios-based Auth API (avoids React Native fetch/Hermes NONE bug)   */
/* ------------------------------------------------------------------ */

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
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/login`;
      console.log('REQUEST_URL:', requestUrl);

      // Use axios-based client instead of global fetch
      const axiosResponse = await authApi.post(requestUrl, { email, password });
      const responseData = axiosResponse.data;

      // Deep clone response data to avoid accidental mutations
      const payload = responseData ? JSON.parse(JSON.stringify(responseData)) : null;

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
    } catch (err) {
      // PRODUCTION DEBUG (Hermes-safe): avoid deep inspection of error objects
      console.error('FULL_LOGIN_ERROR:', String(err));

      // PRODUCTION: Return simple error without touching nested error properties
      return { 
        success: false, 
        message: 'Login failed - please check your connection and try again' 
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

      // Use axios-based client instead of global fetch
      const axiosResponse = await authApi.post(requestUrl, { name, email, password });
      const responseData = axiosResponse.data;

      // Deep clone response data to avoid accidental mutations
      const payload = responseData ? JSON.parse(JSON.stringify(responseData)) : null;

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
    } catch (err) {
      // PRODUCTION DEBUG (Hermes-safe): keep logging minimal to avoid NONE read-only bugs
      console.error('FULL_REGISTER_ERROR:', String(err));

      // PRODUCTION: Return simple error without touching nested error properties
      return { 
        success: false, 
        message: 'Registration failed - please check your connection and try again' 
      };
    }
  },

  /* ----------------------------- LOGOUT ---------------------------- */

  async logout(): Promise<{ success: boolean; message: string }> {
    let refreshTokenValue: string | null = null;
    try {
      refreshTokenValue = await Storage.getItem('refreshToken');
      const payloadBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined;
      
      // Get auth token for protected endpoints
      const authToken = await Storage.getItem('authToken');
      
      // Use axios-based client instead of global fetch
      await authApi.post(`${API_BASE_URL}${API_PATHS.auth}/logout`, payloadBody);
      
      // Always clear local tokens regardless of API response
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      
      return { success: true, message: 'Logout successful' };
    } catch (err) {
      // PRODUCTION DEBUG (Hermes-safe)
      console.error('FULL_LOGOUT_ERROR:', String(err));
      
      // Still clear local tokens even if logout API fails
      try {
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
      } catch (storageError: any) {
        console.error('FULL_LOGOUT_STORAGE_ERROR', storageError);
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

      // PRODUCTION DEBUG: Log request URL
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/refresh-token`;
      console.log('REFRESH_REQUEST_URL:', requestUrl);

      // Get auth token for protected endpoints
      const authToken = await Storage.getItem('authToken');
      
      // Use axios-based client instead of global fetch
      const axiosResponse = await authApi.post(`${API_BASE_URL}${API_PATHS.auth}/refresh-token`, payloadBody, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });

      const responseData = axiosResponse.data;
      const payload = responseData ? JSON.parse(JSON.stringify(responseData)) : null;

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
    } catch (err) {
      // PRODUCTION DEBUG (Hermes-safe)
      console.error('FULL_REFRESH_ERROR:', String(err));
      
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

      // Use axios-based client instead of global fetch
      const axiosResponse = await authApi.put(`${API_BASE_URL}${API_PATHS.auth}/profile`, data);
      const responseData = axiosResponse.data;

      const payload = responseData ? JSON.parse(JSON.stringify(responseData)) : null;

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
      // PRODUCTION DEBUG (Hermes-safe)
      console.error('FULL_UPDATE_PROFILE_ERROR:', String(err));
      
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
