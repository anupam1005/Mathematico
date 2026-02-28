import { API_PATHS } from '../constants/apiPaths';
import api from './apiClient';
import { Storage } from '../utils/storage';
import { API_BASE_URL } from '../config';
import axios from 'axios';

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
      // PRODUCTION DEBUG: Log request URL before API call
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/login`;
      console.log('REQUEST_URL', requestUrl);
      
      let response: any;
      let payload: any;
      
      try {
        // Use relative path - api client already has the full base URL
        response = await api.post(`${API_PATHS.auth}/login`, { email, password });
        payload = response?.data;
      } catch (apiError) {
        console.warn('API_CLIENT_FAILED, FALLING_BACK_TO_DIRECT_AXIOS', apiError);
        
        // PRODUCTION DEBUG: Fallback to direct axios call
        const directUrl = 'https://mathematico-backend-new.vercel.app/api/v1/auth/login';
        console.log('DIRECT_AXIOS_URL', directUrl);
        
        const directResponse = await axios.post(directUrl, { email, password }, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 30000,
        });
        payload = directResponse?.data;
      }

      // PRODUCTION DEBUG: Log response structure
      console.log('LOGIN_RESPONSE', payload);

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
      // PRODUCTION DEBUG: Full error logging without safeError swallowing
      console.error('FULL_LOGIN_ERROR', err);
      
      // Extract error information directly
      let message = 'Login failed';
      
      if (err && typeof err === 'object') {
        const errorObj = err as any;
        
        if (errorObj.response) {
          const status = errorObj.response.status;
          const errorMsg = errorObj.response.data?.message;
          
          if (status === 401) {
            message = errorMsg || 'Invalid email or password';
          } else if (status === 429) {
            message = errorMsg || 'Too many login attempts. Please try again later.';
          } else if (status === 503) {
            message = errorMsg || 'Service temporarily unavailable. Please try again later.';
          } else if (errorMsg) {
            message = errorMsg;
          }
        } else if (errorObj.message) {
          const msg = String(errorObj.message);
          if (msg.includes('Network') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
            message = 'Network error. Please check your internet connection.';
          }
        }
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
      // PRODUCTION DEBUG: Log request URL before API call
      const requestUrl = `${API_BASE_URL}${API_PATHS.auth}/register`;
      console.log('REQUEST_URL', requestUrl);
      
      // Direct API call to prevent path duplication
      const response = await api.post(`${API_PATHS.auth}/register`, { name, email, password });
      const payload = response?.data;

      // PRODUCTION DEBUG: Log response structure
      console.log('REGISTER_RESPONSE', payload);

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
      // PRODUCTION DEBUG: Full error logging without safeError swallowing
      console.error('FULL_REGISTER_ERROR', err);
      
      // Extract error information directly
      let message = 'Registration failed';
      
      if (err && typeof err === 'object') {
        const errorObj = err as any;
        
        if (errorObj.response) {
          const status = errorObj.response.status;
          const errorMsg = errorObj.response.data?.message;
          
          if (status === 400) {
            message = errorMsg || 'Invalid registration data';
          } else if (status === 409) {
            message = errorMsg || 'Email already exists';
          } else if (status === 429) {
            message = errorMsg || 'Too many registration attempts. Please try again later.';
          } else if (status === 503) {
            message = errorMsg || 'Service temporarily unavailable. Please try again later.';
          } else if (errorMsg) {
            message = errorMsg;
          }
        } else if (errorObj.message) {
          const msg = String(errorObj.message);
          if (msg.includes('Network') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
            message = 'Network error. Please check your internet connection.';
          }
        }
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
      // PRODUCTION DEBUG: Full error logging without safeError swallowing
      console.error('FULL_LOGOUT_ERROR', err);
      
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

      // CRITICAL FIX: Use direct API call to prevent path duplication
      const response = await api.post(`${API_PATHS.auth}/refresh-token`, payloadBody);
      const payload = response?.data;

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
      // PRODUCTION DEBUG: Full error logging without safeError swallowing
      console.error('FULL_REFRESH_ERROR', err);
      
      return {
        success: false,
        message: 'Token refresh failed',
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
      // PRODUCTION DEBUG: Full error logging without safeError swallowing
      console.error('FULL_UPDATE_PROFILE_ERROR', err);
      
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
