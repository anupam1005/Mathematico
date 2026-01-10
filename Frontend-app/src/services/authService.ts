import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';
import { Storage } from '../utils/storage';

// Utility function to safely handle errors and prevent NONE property assignment
// This function never accesses read-only properties that might trigger React Native's error handlers
const createSafeError = (error: any) => {
  try {
    const safeError: any = {
      message: 'Unknown error',
      code: 'UNKNOWN',
      response: null,
      config: null,
    };
    
    // Safely extract message without accessing read-only properties
    try {
      if (error && typeof error === 'object') {
        if ('message' in error) {
          try {
            safeError.message = String(error.message || 'Unknown error');
          } catch (e) {
            safeError.message = 'Unable to extract message';
          }
        }
      } else {
        safeError.message = String(error || 'Unknown error');
      }
    } catch (e) {
      safeError.message = 'Unknown error';
    }
    
    // NEVER access error.code directly - it might be read-only 'NONE' property
    // React Native's error system uses 'NONE' as a read-only property value
    // Use property descriptor value instead of direct property access
    try {
      if (error && typeof error === 'object' && 'code' in error) {
        const codeDesc = Object.getOwnPropertyDescriptor(error, 'code');
        if (codeDesc && codeDesc.enumerable && codeDesc.writable !== false && 'value' in codeDesc) {
          // Use descriptor value directly, avoid accessing property
          const codeValue = codeDesc.value;
          if (codeValue !== undefined && codeValue !== null && String(codeValue) !== 'NONE') {
            safeError.code = String(codeValue);
          }
        }
      }
    } catch (e) {
      // Property is read-only, inaccessible, or is 'NONE', leave as 'UNKNOWN'
      safeError.code = 'UNKNOWN';
    }
    
    // Safely extract response
    try {
      if (error?.response) {
        safeError.response = {
          status: error.response.status || 0,
          statusText: error.response.statusText || '',
          data: error.response.data || null
        };
      } else {
        safeError.response = null;
      }
    } catch (e) {
      safeError.response = null;
    }
    
    // Safely extract config
    try {
      if (error?.config) {
        safeError.config = {
          url: error.config.url || '',
          method: error.config.method || '',
          headers: error.config.headers ? JSON.parse(JSON.stringify(error.config.headers)) : {},
          _retry: error.config._retry || false
        };
      } else {
        safeError.config = null;
      }
    } catch (e) {
      safeError.config = null;
    }
    
    return safeError;
  } catch (e) {
    return {
      message: 'Error processing error object',
      code: 'ERROR_PROCESSING',
      response: null,
      config: null
    };
  }
};

// Create axios instance for auth endpoints
const api = axios.create({
  baseURL: API_CONFIG.auth,
  timeout: 30000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Add request/response interceptors for debugging
  validateStatus: function (status: number) {
    return status >= 200 && status < 300; // default
  },
});

// Request interceptor to add auth token and debug
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('AuthService: Making request to:', config.url);
    console.log('AuthService: Full URL:', `${config.baseURL}${config.url}`);
    console.log('AuthService: Method:', config.method);
    console.log('AuthService: Headers:', config.headers);
    
    const token = await Storage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    const safeError = createSafeError(error);
    console.error('AuthService: Request interceptor error:', safeError.message);
    return Promise.reject(safeError);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('AuthService: Response received:', response.status, response.statusText);
    console.log('AuthService: Response data:', response.data);
    return response;
  },
  async (error: AxiosError) => {
    // Create a completely safe error object to prevent NONE property assignment issues
    const safeError = createSafeError(error);
    
    console.error('AuthService: Response error:', safeError.message);
    console.error('AuthService: Error code:', safeError.code);
    console.error('AuthService: Error response:', safeError.response?.data);
    console.error('AuthService: Error status:', safeError.response?.status);
    
    // Create a new request object to avoid modifying the original
    const originalRequest: (InternalAxiosRequestConfig & { _retry?: boolean }) | null = safeError.config ? {
      ...safeError.config,
      headers: { ...safeError.config.headers }
    } : null;
    
    if (safeError.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await Storage.getItem('refreshToken');
        if (refreshToken) {
          console.log('AuthService: Attempting token refresh...');
          
          const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
          const authUrl = API_CONFIG.auth;
          
      const response: AxiosResponse<any> = await api.post('/refresh-token', {
        refreshToken,
      });
          
          if (response.data.success && response.data.data) {
            const { accessToken, tokenType, expiresIn } = response.data.data;
            
            // Extract tokens from the backend response structure
            const actualToken = accessToken;
            const actualRefreshToken = null; // Backend uses HttpOnly cookies for refresh tokens
            
            // Store new tokens
            if (actualToken && actualToken !== 'null' && actualToken !== 'undefined') {
              await Storage.setItem('authToken', actualToken);
              console.log('AuthService: New access token stored via interceptor');
            }
            
            if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
              await Storage.setItem('refreshToken', actualRefreshToken);
              console.log('AuthService: New refresh token stored via interceptor');
            }
            
            // Retry original request with new token
            const retryRequest: AxiosRequestConfig & { _retry?: boolean } = {
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                Authorization: `Bearer ${actualToken}`
              }
            };
            return api(retryRequest);
          } else {
            console.error('AuthService: Invalid refresh response structure:', response.data);
            throw new Error('Invalid refresh response');
          }
        } else {
          console.log('AuthService: No refresh token available');
          throw new Error('No refresh token');
        }
      } catch (refreshError: any) {
        console.log('AuthService: Token refresh failed');
        // Refresh failed, clear tokens and redirect to login
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
        console.log('AuthService: Tokens cleared, user needs to login again');
      }
    }
    
    return Promise.reject(safeError);
  }
);

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

export interface UserResponse {
  success: boolean;
  message: string;
  data?: any;
}

const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Get the current backend URL
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      console.log('AuthService: Attempting login to:', authUrl);
      console.log('AuthService: Full login URL:', `${authUrl}/login`);
      console.log('AuthService: Backend URL:', backendUrl);
      
      // Use the api instance with safe error handling
      const response = await api.post('/login', {
        email,
        password,
      });
      
      console.log('AuthService: Login response received:', response.data);
      
      if (response.data.success && response.data.data) {
        const { user, accessToken, tokenType, expiresIn } = response.data.data;
        
        // Extract tokens from the backend response structure
        const actualToken = accessToken;
        const actualRefreshToken = null; // Backend uses HttpOnly cookies for refresh tokens
        
        // Validate tokens before storing
        if (!actualToken || actualToken === 'null' || actualToken === 'undefined') {
          console.error('AuthService: Login failed - No valid access token received');
          console.error('AuthService: Response data:', response.data);
          console.error('AuthService: Access token value:', actualToken);
          return {
            success: false,
            message: 'Login failed - No valid access token received. Please check server configuration.',
          };
        }
        
        // Store access token
        console.log('AuthService: Storing access token:', actualToken.substring(0, 20) + '...');
        await Storage.setItem('authToken', actualToken);
        console.log('AuthService: Access token stored successfully');
        
        // Verify the token was stored correctly
        const storedToken = await Storage.getItem('authToken');
        console.log('AuthService: Verification - stored token:', storedToken ? storedToken.substring(0, 20) + '...' : 'null');
        
        // Store refresh token if available
        if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
          await Storage.setItem('refreshToken', actualRefreshToken);
          console.log('AuthService: Refresh token stored successfully');
        }
        
        // Return normalized response structure
        return {
          success: true,
          message: response.data.message || 'Login successful',
          data: {
            user: user,
            token: actualToken,
            refreshToken: actualRefreshToken || undefined
          },
        };
      } else {
        console.error('AuthService: Login failed - Invalid response structure:', response.data);
        return {
          success: false,
          message: response.data.message || 'Login failed - Invalid response from server',
        };
      }
    } catch (error: any) {
      // Create a safe error object to prevent property assignment issues
      const safeError = createSafeError(error);
      console.error('AuthService: Login error:', safeError.message);
      
      // Provide more specific error messages
      let errorMessage = 'Login failed';
      
      if (safeError.code === 'NETWORK_ERROR' || safeError.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (safeError.response?.status === 404) {
        errorMessage = 'Server not found. Please check if the backend server is running.';
      } else if (safeError.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (safeError.response?.data?.message) {
        errorMessage = safeError.response.data.message;
      } else if (safeError.message) {
        errorMessage = safeError.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  async register(name: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      // Get the current backend URL
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      console.log('AuthService: Attempting registration to:', authUrl);
      console.log('AuthService: Full registration URL:', `${authUrl}/register`);
      console.log('AuthService: Registration payload:', { name, email, password: '***' });
      
      // Use the api instance with safe error handling
      const response = await api.post('/register', {
        name,
        email,
        password,
      });
      
      console.log('AuthService: Registration response received:', response.data);
      
      if (response.data.success && response.data.data) {
        const { user, accessToken, tokenType, expiresIn } = response.data.data;
        
        // Extract tokens from the backend response structure
        const actualToken = accessToken;
        const actualRefreshToken = null; // Backend uses HttpOnly cookies for refresh tokens
        
        // Store tokens if available
        if (actualToken && actualToken !== 'null' && actualToken !== 'undefined') {
          console.log('AuthService: Storing access token:', actualToken.substring(0, 20) + '...');
          await Storage.setItem('authToken', actualToken);
          console.log('AuthService: Access token stored after registration');
          
          // Verify the token was stored correctly
          const storedToken = await Storage.getItem('authToken');
          console.log('AuthService: Verification - stored token:', storedToken ? storedToken.substring(0, 20) + '...' : 'null');
        } else {
          console.error('AuthService: No valid access token to store:', actualToken);
        }
        
        if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
          await Storage.setItem('refreshToken', actualRefreshToken);
          console.log('AuthService: Refresh token stored after registration');
        }
        
        return {
          success: true,
          message: response.data.message || 'Registration successful',
          data: {
            user: user,
            token: actualToken,
            refreshToken: actualRefreshToken || undefined
          },
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed - Invalid response from server',
        };
      }
    } catch (error: any) {
      // Create a safe error object to prevent property assignment issues
      const safeError = createSafeError(error);
      console.error('AuthService: Registration error:', safeError.message);
      
      // Provide more specific error messages
      let errorMessage = 'Registration failed';
      
      if (safeError.code === 'NETWORK_ERROR' || safeError.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (safeError.response?.status === 404) {
        errorMessage = 'Server not found. Please check if the backend server is running.';
      } else if (safeError.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (safeError.response?.status === 409) {
        errorMessage = 'Email already exists. Please use a different email address.';
      } else if (safeError.response?.data?.message) {
        errorMessage = safeError.response.data.message;
      } else if (safeError.message) {
        errorMessage = safeError.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('AuthService: Starting logout request...');
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      const response = await api.post('/logout', {});
      console.log('AuthService: Logout response:', response.data);
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error: any) {
      const safeError = createSafeError(error);
      console.error('AuthService: Logout error:', safeError.message);
      console.error('AuthService: Error response:', safeError.response?.data);
      return {
        success: false,
        message: safeError.response?.data?.message || 'Logout failed',
      };
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      // Backend exposes /api/v1/auth/profile
      const token = await this.getToken();
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      const response = await api.get('/profile');
      return response.data.data;
    } catch (error: any) {
      const safeError = createSafeError(error);
      throw new Error(safeError.response?.data?.message || 'Failed to get user data');
    }
  },


  async updateProfile(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('AuthService: Starting profile update request with data:', data);
      const token = await this.getToken();
      console.log('AuthService: Using token for profile update:', token ? 'Token present' : 'No token');
      
      if (!token) {
        return {
          success: false,
          message: 'Access token is required',
        };
      }
      
      // Get the current backend URL dynamically
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      console.log('AuthService: Profile update URL:', authUrl);
      
      const response = await api.put('/profile', data);
      
      console.log('AuthService: Profile update response:', response.data);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      // Create a safe error object
      const safeError = createSafeError(error);
      console.error('AuthService: Profile update error:', safeError.message);
      console.error('AuthService: Error response:', safeError.response?.data);
      
      let errorMessage = 'Profile update failed';
      if (safeError.response?.status === 401) {
        errorMessage = 'Access token is required';
      } else if (safeError.response?.data?.message) {
        errorMessage = safeError.response.data.message;
      } else if (safeError.message) {
        errorMessage = safeError.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getToken();
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      const response = await api.put('/change-password', {
        currentPassword,
        newPassword,
      });
      
      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      const safeError = createSafeError(error);
      console.error('AuthService: Password change error:', safeError.message);
      return {
        success: false,
        message: safeError.response?.data?.message || 'Password change failed',
      };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      const response = await api.post('/forgot-password', {
        email,
      });
      
      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error: any) {
      const safeError = createSafeError(error);
      return {
        success: false,
        message: safeError.response?.data?.message || 'Failed to send reset email',
      };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const backendUrl = API_CONFIG.auth.replace('/api/v1/auth', '');
      const authUrl = API_CONFIG.auth;
      
      const response = await api.post('/reset-password', {
        token,
        newPassword,
      });
      
      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error: any) {
      const safeError = createSafeError(error);
      return {
        success: false,
        message: safeError.response?.data?.message || 'Password reset failed',
      };
    }
  },

  async refreshToken(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const refreshToken = await Storage.getItem('refreshToken');
      
      if (!refreshToken) {
        return {
          success: false,
          message: 'No refresh token available',
        };
      }
      
      console.log('AuthService: Manual token refresh requested...');
      
      const authUrl = API_CONFIG.auth;
      
      const response = await api.post('/refresh-token', {
        refreshToken,
      });
      
      if (response.data.success && response.data.data) {
        const { accessToken, tokenType, expiresIn } = response.data.data;
        
        // Extract tokens from the backend response structure
        const actualToken = accessToken;
        const actualRefreshToken = null; // Backend uses HttpOnly cookies for refresh tokens
        
        // Store new tokens
        if (actualToken && actualToken !== 'null' && actualToken !== 'undefined') {
          await Storage.setItem('authToken', actualToken);
          console.log('AuthService: New access token stored via manual refresh');
        }
        
        if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
          await Storage.setItem('refreshToken', actualRefreshToken);
          console.log('AuthService: New refresh token stored via manual refresh');
        }
        
        return {
          success: true,
          message: response.data.message || 'Token refreshed successfully',
          data: {
            token: actualToken,
            refreshToken: actualRefreshToken || undefined,
          },
        };
      } else {
        console.error('AuthService: Invalid manual refresh response structure:', response.data);
        return {
          success: false,
          message: response.data.message || 'Invalid refresh response',
        };
      }
    } catch (error: any) {
      const safeError = createSafeError(error);
      console.error('AuthService: Manual token refresh failed:', safeError.message);
      
      // Clear tokens on refresh failure
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      
      return {
        success: false,
        message: safeError.response?.data?.message || 'Token refresh failed',
      };
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('authToken');
      console.log('AuthService: Retrieved token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
        // Basic validation - check if it's not empty and has reasonable length
        console.log('AuthService: Valid token found, length:', token.length);
        return token;
      }
      
      console.log('AuthService: No valid token found');
      return null;
    } catch (error: any) {
      const errMsg = error?.message || 'Unknown error';
      console.error('Error getting token:', errMsg);
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      console.log('AuthService: Clearing all invalid tokens...');
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('user');
      console.log('AuthService: All tokens cleared');
    } catch (error: any) {
      const errMsg = error?.message || 'Unknown error';
      console.error('Error clearing tokens:', errMsg);
    }
  },
};

// Export both named and default exports
export { authService };
export default authService;
