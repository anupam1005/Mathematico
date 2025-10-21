import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import authService from '../services/authService';
import { Storage } from '../utils/storage';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  isAdmin: boolean; // Alias for compatibility
  role: 'user' | 'admin' | 'instructor';
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Clear any invalid tokens first
      await authService.clearInvalidTokens();
      
      const token = await authService.getToken();
      
      if (token) {
        // Token is valid, try to get user data from storage
        const storedUser = await Storage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // If no user data, clear token and logout
          await Storage.deleteItem('authToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use the real backend authentication
      const response = await authService.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, token: accessToken, refreshToken } = response.data;
        
        // Store the real JWT token only if it exists
        if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
          await Storage.setItem('authToken', accessToken);
          console.log('AuthContext: Access token stored after login');
        }
        
        // Store refresh token if available
        if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
          await Storage.setItem('refreshToken', refreshToken);
          console.log('AuthContext: Refresh token stored after login');
        }
        
        // Convert backend user data to our User interface
        const user: User = {
          id: userData.id?.toString() || 'unknown',
          name: userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email || email,
          is_admin: userData.isAdmin || userData.role === 'admin',
          isAdmin: userData.isAdmin || userData.role === 'admin',
          role: userData.role || 'user',
          email_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Store user data in SecureStore
        await Storage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        return true;
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'An error occurred during login. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use the real backend authentication
      const response = await authService.register(name, email, password);
      
      if (response.success && response.data) {
        const { user: userData, token, tokens } = response.data;
        
        // Extract the access token from the response
        const accessToken = token || tokens?.accessToken;
        const refreshToken = tokens?.refreshToken;
        
        // Store the real JWT token only if it exists
        if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
          await Storage.setItem('authToken', accessToken);
          console.log('AuthContext: Access token stored after registration');
        }
        
        // Store refresh token if available
        if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
          await Storage.setItem('refreshToken', refreshToken);
          console.log('AuthContext: Refresh token stored after registration');
        }
        
        // Convert backend user data to our User interface
        const user: User = {
          id: userData.id?.toString() || 'unknown',
          name: userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email || email,
          is_admin: userData.isAdmin || userData.role === 'admin',
          isAdmin: userData.isAdmin || userData.role === 'admin',
          role: userData.role || 'user',
          email_verified: userData.email_verified || false,
          is_active: userData.is_active !== false,
          created_at: userData.created_at || new Date().toISOString(),
          updated_at: userData.updated_at || new Date().toISOString(),
        };
        
        // Store user data in SecureStore
        await Storage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        Alert.alert(
          'Registration Successful', 
          'Welcome to Mathematico! You are now logged in.',
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert('Registration Failed', response.message || 'Registration failed. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', 'An error occurred during registration. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('AuthContext: Starting logout process');
      // Call logout API to invalidate tokens
      console.log('AuthContext: Calling authService.logout()');
      await authService.logout();
      console.log('AuthContext: Backend logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
    } finally {
      console.log('AuthContext: Clearing local storage');
      // Clear all local storage
      console.log('AuthContext: Deleting user from storage');
      await Storage.deleteItem('user');
      console.log('AuthContext: Deleting authToken from storage');
      await Storage.deleteItem('authToken');
      console.log('AuthContext: Deleting refreshToken from storage');
      await Storage.deleteItem('refreshToken');
      
      console.log('AuthContext: Updating state - setting user to null');
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      console.log('AuthContext: State updated - user:', null, 'isAuthenticated:', false);
      console.log('AuthContext: Logout process completed');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = await Storage.getItem('refreshToken');
      if (!refreshTokenValue) {
        return false;
      }

      const response = await authService.refreshToken();
      
      if (response.success && response.data) {
        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens
        if (newAccessToken) {
          await Storage.setItem('authToken', newAccessToken);
        }
        if (newRefreshToken) {
          await Storage.setItem('refreshToken', newRefreshToken);
        }
        
        return true;
      } else {
        // Refresh failed, logout user
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return false;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      console.log('AuthContext: Starting profile update with data:', data);
      const response = await authService.updateProfile(data);
      console.log('AuthContext: Profile update response:', response);
      
      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          ...response.data,
          isAdmin: response.data.isAdmin || response.data.role === 'admin',
          is_admin: response.data.isAdmin || response.data.role === 'admin',
        };
        
        console.log('AuthContext: Updated user object:', updatedUser);
        
        // Update state
        setUser(updatedUser);
        console.log('AuthContext: User state updated');
        
        // Persist to SecureStore
        await Storage.setItem('user', JSON.stringify(updatedUser));
        console.log('AuthContext: User data persisted to storage');
        
        return true;
      } else {
        console.error('AuthContext: Profile update failed:', response.message);
        Alert.alert('Update Failed', response.message || 'Profile update failed');
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Profile update error:', error);
      Alert.alert('Update Error', 'An error occurred while updating profile. Please try again.');
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
