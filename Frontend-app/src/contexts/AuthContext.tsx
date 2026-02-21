import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import authService from '../services/authService';
import { Storage } from '../utils/storage';
import { safeCatch } from '../utils/safeCatch';

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
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
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
    (async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        safeCatch('AuthContext.checkAuthStatus.useEffect')(error);
      }
    })();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await authService.getToken();
      
      if (token && token.length > 10) {
        // Token is valid, try to get user data from storage
        const storedUser = await Storage.getItem<string>('user', false);
        if (storedUser) {
          try {
            const userData = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
            setUser(userData);
            setIsAuthenticated(true);
          } catch (parseError: any) {
            safeCatch('AuthContext.checkAuthStatus.parseUser')(parseError);
            // Clear invalid data and logout
            await Storage.deleteItem('user');
            await Storage.deleteItem('authToken');
            setUser(null);
            setIsAuthenticated(false);
          }
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
    } catch (error: any) {
      safeCatch('AuthContext.checkAuthStatus')(error);
      // Clear invalid tokens
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      await Storage.deleteItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data;
        
        if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
          await Storage.setItem('authToken', accessToken);
        }
        
        if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
          if (Platform.OS !== 'web') {
            await Storage.setItem('refreshToken', refreshToken);
          }
        }
        
        const user: User = {
          id: userData.id?.toString() || userData._id?.toString() || 'unknown',
          name: userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email || email,
          is_admin: userData.isAdmin || userData.is_admin || userData.role === 'admin',
          isAdmin: userData.isAdmin || userData.is_admin || userData.role === 'admin',
          role: userData.role || 'user',
          email_verified: userData.email_verified !== undefined ? userData.email_verified : (userData.isEmailVerified || false),
          is_active: userData.is_active !== undefined ? userData.is_active : (userData.isActive !== false),
          created_at: userData.created_at || userData.createdAt || new Date().toISOString(),
          updated_at: userData.updated_at || userData.updatedAt || new Date().toISOString(),
        };
        
        await Storage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        // Return failure with message so UI can display appropriate error
        return { success: false, message: response.message || 'Invalid credentials' };
      }
    } catch (error: any) {
      const errorMessage = 'An error occurred during login. Please try again.';
      safeCatch('AuthContext.login')(error);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const response = await authService.register(name, email, password);
      
      if (response.success && response.data) {
        const { user: userData, accessToken, refreshToken } = response.data;
        
        // Extract the access token from the response
        if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
          await Storage.setItem('authToken', accessToken);
        }
        
        if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
          if (Platform.OS !== 'web') {
            await Storage.setItem('refreshToken', refreshToken);
          }
        }
        
        const user: User = {
          id: userData.id?.toString() || userData._id?.toString() || 'unknown',
          name: userData.name || userData.email?.split('@')[0] || 'User',
          email: userData.email || email,
          is_admin: userData.isAdmin || userData.is_admin || userData.role === 'admin',
          isAdmin: userData.isAdmin || userData.is_admin || userData.role === 'admin',
          role: userData.role || 'user',
          email_verified: userData.email_verified !== undefined ? userData.email_verified : (userData.isEmailVerified || false),
          is_active: userData.is_active !== undefined ? userData.is_active : (userData.isActive !== false),
          created_at: userData.created_at || userData.createdAt || new Date().toISOString(),
          updated_at: userData.updated_at || userData.updatedAt || new Date().toISOString(),
        };
        
        await Storage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        Alert.alert(
          'Registration Successful', 
          'Welcome to Mathematico! You are now logged in.',
          [{ text: 'OK' }]
        );
        return { success: true, message: response.message };
      } else {
        const message = response.message || 'Registration failed. Please try again.';
        Alert.alert('Registration Failed', message);
        return { success: false, message };
      }
    } catch (error: any) {
      const errorMessage = 'An error occurred during registration. Please try again.';
      safeCatch('AuthContext.register', () => {
        Alert.alert('Registration Error', errorMessage);
      })(error);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error: any) {
      safeCatch('AuthContext.logout')(error);
    } finally {
      await Storage.deleteItem('user');
      await Storage.deleteItem('authToken');
      await Storage.deleteItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await authService.refreshToken();
      
      if (response.success && response.data) {
        const { accessToken } = response.data;
        
        // Update access token
        if (accessToken) {
          await Storage.setItem('authToken', accessToken);
        }
        
        return true;
      } else {
        // Refresh failed, logout user
        await logout();
        return false;
      }
    } catch (error: any) {
      safeCatch('AuthContext.refreshToken')(error);
      await logout();
      return false;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await authService.updateProfile(data);
      
      if (response.success) {
        // Merge the update data with current user and response data
        // This ensures that even if backend doesn't return all fields, we preserve them
        const updatedUser = {
          ...user,
          ...response.data,
          // Explicitly include the data we sent (in case backend doesn't return it)
          ...data,
          // Ensure admin flags are set correctly
          isAdmin: response.data?.isAdmin || response.data?.role === 'admin' || user?.isAdmin || false,
          is_admin: response.data?.isAdmin || response.data?.role === 'admin' || user?.is_admin || false,
        };
        
        // Update state immediately
        setUser(updatedUser);
        // Persist to SecureStore
        await Storage.setItem('user', JSON.stringify(updatedUser));
        
        return true;
      } else {
        safeCatch('AuthContext.updateProfile.response', () => {
          Alert.alert('Update Failed', response.message || 'Profile update failed');
        })(new Error('Profile update failed'));
        return false;
      }
    } catch (error: any) {
      safeCatch('AuthContext.updateProfile', () => {
        Alert.alert('Update Error', 'An error occurred while updating profile. Please try again.');
      })(error);
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
    checkAuthStatus,
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
