import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';
import { Storage } from '../utils/storage';

// Utility function to safely handle errors and prevent NONE property assignment
const createSafeError = (error: any) => {
  try {
    return {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      response: error?.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null,
      config: error?.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: { ...error.config.headers },
        _retry: error.config._retry || false
      } : null
    };
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
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
});

// Request interceptor to add auth token and debug
api.interceptors.request.use(
  async (config) => {
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
  (error) => {
    console.error('AuthService: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('AuthService: Response received:', response.status, response.statusText);
    console.log('AuthService: Response data:', response.data);
    return response;
  },
  async (error) => {
    // Create a completely safe error object to prevent NONE property assignment issues
    const safeError = createSafeError(error);
    
    console.error('AuthService: Response error:', safeError.message);
    console.error('AuthService: Error code:', safeError.code);
    console.error('AuthService: Error response:', safeError.response?.data);
    console.error('AuthService: Error status:', safeError.response?.status);
    
    // Create a new request object to avoid modifying the original
    const originalRequest = safeError.config ? {
      ...safeError.config,
      headers: { ...safeError.config.headers }
    } : null;
    
    if (safeError.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await Storage.getItem('refreshToken');
        if (refreshToken) {
          console.log('AuthService: Attempting token refresh...');
          
          const response = await axios.post(`${API_CONFIG.auth}/refresh-token`, {
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
            const retryRequest = {
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
        console.error('AuthService: Token refresh failed:', refreshError.message);
        // Refresh failed, clear tokens and redirect to login
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
        console.log('AuthService: Tokens cleared, user needs to login again');
      }
    }
    
    return Promise.reject(error);
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
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const authUrl = `${backendUrl}/api/v1/auth`;
      
      console.log('AuthService: Attempting login to:', authUrl);
      console.log('AuthService: Full login URL:', `${authUrl}/login`);
      console.log('AuthService: Backend URL:', backendUrl);
      
      // Use the full URL for the serverless backend
      const response = await axios.post(`${authUrl}/login`, {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
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
      console.error('AuthService: Login error:', error);
      
      // Create a safe error object to prevent property assignment issues
      const safeError = createSafeError(error);
      
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
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const authUrl = `${backendUrl}/api/v1/auth`;
      
      console.log('AuthService: Attempting registration to:', authUrl);
      console.log('AuthService: Full registration URL:', `${authUrl}/register`);
      console.log('AuthService: Registration payload:', { name, email, password: '***' });
      
      // Use the full URL for the serverless backend
      const response = await axios.post(`${authUrl}/register`, {
        name,
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
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
      console.error('AuthService: Registration error:', error);
      
      // Create a safe error object to prevent property assignment issues
      const safeError = createSafeError(error);
      
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
      console.log('AuthService: Starting logout request to:', `${API_CONFIG.auth}/logout`);
      const response = await axios.post(`${API_CONFIG.auth}/logout`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('AuthService: Logout response:', response.data);
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error: any) {
      console.error('AuthService: Logout error:', error);
      console.error('AuthService: Error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed',
      };
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      // Backend exposes /api/v1/auth/profile
      const token = await this.getToken();
      const response = await axios.get(`${API_CONFIG.auth}/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user data');
    }
  },


  async updateProfile(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('AuthService: Starting profile update request with data:', data);
      const token = await this.getToken();
      console.log('AuthService: Using token for profile update:', token ? 'Token present' : 'No token');
      
      const response = await axios.put(`${API_CONFIG.auth}/profile`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('AuthService: Profile update response:', response.data);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('AuthService: Profile update error:', error);
      console.error('AuthService: Error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed',
      };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getToken();
      const response = await axios.put(`${API_CONFIG.auth}/change-password`, {
        currentPassword,
        newPassword,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed',
      };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${API_CONFIG.auth}/forgot-password`, {
        email,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send reset email',
      };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${API_CONFIG.auth}/reset-password`, {
        token,
        newPassword,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
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
      
      const response = await axios.post(`${API_CONFIG.auth}/refresh-token`, {
        refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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
      console.error('AuthService: Manual token refresh failed:', error.message);
      
      // Clear tokens on refresh failure
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      
      return {
        success: false,
        message: error.response?.data?.message || 'Token refresh failed',
      };
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await Storage.getItem('authToken');
      console.log('AuthService: Retrieved token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token && token !== 'null' && token !== 'undefined') {
        // Basic validation - check if it's not empty
        console.log('AuthService: Valid token found');
        return token;
      }
      
      console.log('AuthService: No valid token found');
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async clearInvalidTokens(): Promise<void> {
    try {
      console.log('AuthService: Clearing all invalid tokens...');
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('user');
      console.log('AuthService: All tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Export both named and default exports
export { authService };
export default authService;
