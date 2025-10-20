import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

// Create axios instance for auth endpoints
const api = axios.create({
  baseURL: API_CONFIG.auth,
  timeout: 30000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
    
    const token = await AsyncStorage.getItem('authToken');
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
    console.error('AuthService: Response error:', error.message);
    console.error('AuthService: Error code:', error.code);
    console.error('AuthService: Error response:', error.response?.data);
    console.error('AuthService: Error status:', error.response?.status);
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          console.log('AuthService: Attempting token refresh...');
          
          const response = await axios.post(`${API_CONFIG.auth}/refresh-token`, {
            refreshToken,
          });
          
          if (response.data.success && response.data.data) {
            const { tokens } = response.data.data;
            
            // Extract tokens from the backend response structure
            const actualToken = tokens?.accessToken;
            const actualRefreshToken = tokens?.refreshToken;
            
            // Store new tokens
            if (actualToken && actualToken !== 'null' && actualToken !== 'undefined') {
              await AsyncStorage.setItem('authToken', actualToken);
              console.log('AuthService: New access token stored via interceptor');
            }
            
            if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
              await AsyncStorage.setItem('refreshToken', actualRefreshToken);
              console.log('AuthService: New refresh token stored via interceptor');
            }
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${actualToken}`;
            return api(originalRequest);
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
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
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
    refreshToken: string;
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
      console.log('AuthService: Attempting login to:', API_CONFIG.auth);
      const response = await api.post('/login', {
        email,
        password,
      });
      
      console.log('AuthService: Login response received:', response.data);
      
      if (response.data.success && response.data.data) {
        const { user, tokens } = response.data.data;
        
        // Extract tokens from the backend response structure
        const actualToken = tokens?.accessToken;
        const actualRefreshToken = tokens?.refreshToken;
        
        // Validate tokens before storing
        if (!actualToken || actualToken === 'null' || actualToken === 'undefined') {
          console.error('AuthService: Login failed - No valid access token received');
          return {
            success: false,
            message: 'Login failed - No valid access token received',
          };
        }
        
        // Store access token
        await AsyncStorage.setItem('authToken', actualToken);
        console.log('AuthService: Access token stored successfully');
        
        // Store refresh token if available
        if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
          await AsyncStorage.setItem('refreshToken', actualRefreshToken);
          console.log('AuthService: Refresh token stored successfully');
        }
        
        // Return normalized response structure
        return {
          success: true,
          message: response.data.message || 'Login successful',
          data: {
            user: user,
            token: actualToken,
            refreshToken: actualRefreshToken
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
      
      // Provide more specific error messages
      let errorMessage = 'Login failed';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Server not found. Please check if the backend server is running.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  async register(name: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      console.log('AuthService: Attempting registration to:', API_CONFIG.auth);
      console.log('AuthService: Full registration URL:', `${API_CONFIG.auth}/register`);
      console.log('AuthService: Registration payload:', { name, email, password: '***' });
      
      const response = await api.post('/register', {
        name,
        email,
        password,
      });
      
      console.log('AuthService: Registration response received:', response.data);
      
      if (response.data.success && response.data.data) {
        const { user, tokens } = response.data.data;
        
        // Extract tokens from the backend response structure
        const actualToken = tokens?.accessToken;
        const actualRefreshToken = tokens?.refreshToken;
        
        // Store tokens if available
        if (actualToken && actualToken !== 'null' && actualToken !== 'undefined') {
          await AsyncStorage.setItem('authToken', actualToken);
          console.log('AuthService: Access token stored after registration');
        }
        
        if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
          await AsyncStorage.setItem('refreshToken', actualRefreshToken);
          console.log('AuthService: Refresh token stored after registration');
        }
        
        return {
          success: true,
          message: response.data.message || 'Registration successful',
          data: {
            user: user,
            token: actualToken,
            refreshToken: actualRefreshToken
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
      
      // Provide more specific error messages
      let errorMessage = 'Registration failed';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Server not found. Please check if the backend server is running.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Email already exists. Please use a different email address.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/logout');
      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed',
      };
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      // Backend exposes /api/v1/auth/profile
      const response = await api.get('/profile');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user data');
    }
  },


  async updateProfile(data: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await api.put('/profile', data);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed',
      };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.put('/change-password', {
        currentPassword,
        newPassword,
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
      const response = await api.post('/forgot-password', {
        email,
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
      const response = await api.post('/reset-password', {
        token,
        newPassword,
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
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return {
          success: false,
          message: 'No refresh token available',
        };
      }
      
      console.log('AuthService: Manual token refresh requested...');
      
      const response = await axios.post(`${API_CONFIG.auth}/refresh-token`, {
        refreshToken,
      });
      
      if (response.data.success && response.data.data) {
        const { tokens } = response.data.data;
        
        // Extract tokens from the backend response structure
        const actualToken = tokens?.accessToken;
        const actualRefreshToken = tokens?.refreshToken;
        
        // Store new tokens
        if (actualToken && actualToken !== 'null' && actualToken !== 'undefined') {
          await AsyncStorage.setItem('authToken', actualToken);
          console.log('AuthService: New access token stored via manual refresh');
        }
        
        if (actualRefreshToken && actualRefreshToken !== 'null' && actualRefreshToken !== 'undefined') {
          await AsyncStorage.setItem('refreshToken', actualRefreshToken);
          console.log('AuthService: New refresh token stored via manual refresh');
        }
        
        return {
          success: true,
          message: response.data.message || 'Token refreshed successfully',
          data: {
            token: actualToken,
            refreshToken: actualRefreshToken,
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
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      return {
        success: false,
        message: error.response?.data?.message || 'Token refresh failed',
      };
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('AuthService: Retrieved token:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (token && token !== 'null' && token !== 'undefined') {
        // Basic validation - check if it's not empty and not a dummy token
        if (token.startsWith('admin-token-') || token.startsWith('user-token-')) {
          console.error('AuthService: Dummy token detected, removing');
          await AsyncStorage.removeItem('authToken');
          return null;
        }
        
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
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      console.log('AuthService: All tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Export both named and default exports
export { authService };
export default authService;
