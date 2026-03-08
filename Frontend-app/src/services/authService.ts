import { API_PATHS } from '../constants/apiPaths';
import axios from 'axios';
import { Storage } from '../utils/storage';
import { API_BASE_URL } from '../config';

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
      // PRODUCTION DEBUG: Log request URL before API call
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/login`;
      console.log('REQUEST_URL:', requestUrl);
      console.log('ABOUT_TO_CALL_AXIOS:', requestUrl);
      
      // PRODUCTION: Use direct axios to bypass interceptor issues
      const response = await axios.post(`${API_BASE_URL}${API_PATHS.auth}/login`, { email, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('AXIOS_CALL_SUCCESSFUL:', response.status);
      
      // PRODUCTION DEBUG: Log response structure safely
      console.log('LOGIN_RESPONSE:', JSON.stringify(response?.data));
      
      // PRODUCTION: Deep clone response data to avoid frozen object issues
      const payload = response?.data ? JSON.parse(JSON.stringify(response.data)) : null;

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
      // PRODUCTION DEBUG: Full error logging - try multiple methods to capture error
      console.error('FULL_LOGIN_ERROR:', err);
      console.error('ERROR_TYPE:', typeof err);
      console.error('ERROR_STRING:', String(err));
      console.error('ERROR_JSON:', JSON.stringify(err, null, 2));
      
      // PRODUCTION: Return simple error without any object property access
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
      // PRODUCTION DEBUG: Log request URL before API call
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/register`;
      console.log('REQUEST_URL:', requestUrl);
      
      // PRODUCTION: Use direct axios to bypass interceptor issues
      const response = await axios.post(`${API_BASE_URL}${API_PATHS.auth}/register`, { name, email, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      });
      
      // PRODUCTION DEBUG: Log response structure safely
      console.log('REGISTER_RESPONSE:', JSON.stringify(response?.data));
      
      // PRODUCTION: Deep clone response data to avoid frozen object issues
      const payload = response?.data ? JSON.parse(JSON.stringify(response.data)) : null;

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
        
        // PRODUCTION DEBUG: Verify token storage
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
      // PRODUCTION DEBUG: Full error logging - safely stringify to avoid frozen object issues
      console.error('FULL_REGISTER_ERROR:', JSON.stringify(err));
      
      // PRODUCTION: Return simple error without any object property access
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
      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // PRODUCTION: Use direct axios to bypass interceptor issues
      await axios.post(`${API_BASE_URL}${API_PATHS.auth}/logout`, payloadBody, {
        headers,
        timeout: 30000
      });
      
      // Always clear local tokens regardless of API response
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      
      return { success: true, message: 'Logout successful' };
    } catch (err) {
      // PRODUCTION DEBUG: Full error logging
      console.error('FULL_LOGOUT_ERROR:', err);
      
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
      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // PRODUCTION: Use direct axios to bypass interceptor issues
      const response = await axios.post(`${API_BASE_URL}${API_PATHS.auth}/refresh-token`, payloadBody, {
        headers,
        timeout: 30000
      });

      // PRODUCTION DEBUG: Log response structure safely
      console.log('REFRESH_RESPONSE:', JSON.stringify(response?.data));

      // PRODUCTION: Deep clone response data to avoid frozen object issues
      const payload = response?.data ? JSON.parse(JSON.stringify(response.data)) : null;

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
      // PRODUCTION DEBUG: Full error logging
      console.error('FULL_REFRESH_ERROR:', err);
      
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

      // Get auth token for protected endpoints
      const authToken = await Storage.getItem('authToken');
      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // PRODUCTION: Use direct axios to bypass interceptor issues
      const response = await axios.put(`${API_BASE_URL}${API_PATHS.auth}/profile`, data, {
        headers,
        timeout: 30000
      });
      
      // PRODUCTION: Deep clone response data to avoid frozen object issues
      const payload = response?.data ? JSON.parse(JSON.stringify(response.data)) : null;

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
      // PRODUCTION DEBUG: Full error logging
      console.error('FULL_UPDATE_PROFILE_ERROR:', err);
      
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
