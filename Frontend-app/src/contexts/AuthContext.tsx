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
  register: (name: string, email: string, password: string) => Promise<boolean>;
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
      console.log('AuthContext: Checking authentication status...');

      const token = await authService.getToken();
      console.log('AuthContext: Token retrieved:', token ? 'YES' : 'NO');
      
      if (token && token.length > 10) {
        // Token is valid, try to get user data from storage
        const storedUser = await Storage.getItem<string>('user', false);
        console.log('AuthContext: Stored user data:', storedUser ? 'YES' : 'NO');
        
        if (storedUser) {
          try {
            const userData = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
            console.log('AuthContext: User data parsed successfully');
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
          console.log('AuthContext: No user data found, clearing tokens');
          await Storage.deleteItem('authToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('AuthContext: No valid token found');
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
          if (Platform.OS !== 'web') {
            await Storage.setItem('refreshToken', refreshToken);
            console.log('AuthContext: Refresh token stored after login');
          }
        }
        
        // Convert backend user data to our User interface
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
        
        // Store user data in SecureStore
        await Storage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        // Return failure with message so UI can display appropriate error
        return { success: false, message: response.message || 'Invalid credentials' };
      }
    } catch (error: any) {
      // NEVER access error properties - use generic message
      const errorMessage = 'An error occurred during login. Please try again.';
      safeCatch('AuthContext.login')(error);
      return { success: false, message: errorMessage };
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
        console.log('AuthContext: Registration response data:', response.data);
        const { user: userData, token, refreshToken } = response.data;
        
        // Extract the access token from the response
        const accessToken = token;
        console.log('AuthContext: Extracted access token:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');
        
        // Store the real JWT token only if it exists
        if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
          await Storage.setItem('authToken', accessToken);
          console.log('AuthContext: Access token stored after registration');
        }
        
        // Store refresh token if available
        if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
          if (Platform.OS !== 'web') {
            await Storage.setItem('refreshToken', refreshToken);
            console.log('AuthContext: Refresh token stored after registration');
          }
        }
        
        // Convert backend user data to our User interface
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
        
        // Store user data in SecureStore
        console.log('AuthContext: Storing user data:', user);
        await Storage.setItem('user', JSON.stringify(user));
        
        // Verify user data was stored
        const storedUser = await Storage.getItem('user');
        console.log('AuthContext: Verification - stored user:', storedUser ? 'YES' : 'NO');
        
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
    } catch (error: any) {
      // NEVER access error properties - use generic message
      const errorMessage = 'An error occurred during registration. Please try again.';
      safeCatch('AuthContext.register', () => {
        Alert.alert('Registration Error', errorMessage);
      })(error);
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
    } catch (error: any) {
      safeCatch('AuthContext.logout')(error);
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
      const response = await authService.refreshToken();
      
      if (response.success && response.data) {
        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens
        if (newAccessToken) {
          await Storage.setItem('authToken', newAccessToken);
        }
        if (newRefreshToken && Platform.OS !== 'web') {
          await Storage.setItem('refreshToken', newRefreshToken);
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
      console.log('AuthContext: Starting profile update with data:', data);
      const response = await authService.updateProfile(data);
      console.log('AuthContext: Profile update response:', response);
      
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
        
        console.log('AuthContext: Updated user object:', updatedUser);
        
        // Update state immediately
        setUser(updatedUser);
        console.log('AuthContext: User state updated');
        
        // Persist to SecureStore
        await Storage.setItem('user', JSON.stringify(updatedUser));
        console.log('AuthContext: User data persisted to storage');
        
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
