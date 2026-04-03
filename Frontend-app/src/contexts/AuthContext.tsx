import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import authService from '../services/authService';
import { safeCatch } from '../utils/safeCatch';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_admin: boolean;
  isAdmin: boolean; // Alias for compatibility
  // Backend returns `student` / `admin` (and may return other roles like `teacher`)
  role: 'student' | 'admin' | 'teacher' | 'instructor' | 'user';
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
  ) => Promise<{ success: boolean; message?: string; user?: User }>;
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
  const bootstrapRef = useRef<Promise<void> | null>(null);
  const logoutRef = useRef<Promise<void> | null>(null);
  const loginInFlightRef = useRef(false);

  const restoreAuthState = async (): Promise<{ user: User | null; isAuthenticated: boolean }> => {
    try {
      const restored = await authService.restoreSession();
      const nextUser = (restored.user || null) as User | null;
      const nextIsAuthenticated = Boolean(restored.isAuthenticated);
      if (loginInFlightRef.current) {
        return { user, isAuthenticated };
      }
      setUser(nextUser);
      setIsAuthenticated(nextIsAuthenticated);
      console.log('[AUTH] restore session applied:', {
        isAuthenticated: nextIsAuthenticated,
        hasUser: Boolean(nextUser),
      });
      return { user: nextUser, isAuthenticated: nextIsAuthenticated };
    } catch (error: any) {
      safeCatch('AuthContext.restoreAuthState')(error);
      setUser(null);
      setIsAuthenticated(false);
      return { user: null, isAuthenticated: false };
    }
  };

  const normalizeUser = (rawUser: any): User | null => {
    if (!rawUser || typeof rawUser !== 'object') return null;
    const role = rawUser.role || (rawUser.is_admin ? 'admin' : 'student');
    const isAdmin = role === 'admin' || Boolean(rawUser.is_admin) || Boolean(rawUser.isAdmin);
    return {
      ...rawUser,
      role,
      isAdmin,
      is_admin: isAdmin,
    } as User;
  };

  const bootstrap = async (): Promise<void> => {
    if (bootstrapRef.current) {
      await bootstrapRef.current;
      return;
    }

    bootstrapRef.current = (async () => {
      try {
        setIsLoading(true);
        await restoreAuthState();
      } finally {
        setIsLoading(false);
      }
    })();

    try {
      await bootstrapRef.current;
    } finally {
      bootstrapRef.current = null;
    }
  };

  useEffect(() => {
    bootstrap().catch(safeCatch('AuthContext.bootstrap.useEffect'));
  }, []);

  const checkAuthStatus = async () => {
    await bootstrap();
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      loginInFlightRef.current = true;
      setIsLoading(true);
      const response = await authService.login(email, password);

      if (response.success) {
        const nextUser = normalizeUser(response.data?.user);
        if (!nextUser) {
          return { success: false, message: 'Invalid login user payload' };
        }
        // Immediate in-memory auth update to avoid login screen loop.
        setUser(nextUser);
        setIsAuthenticated(true);
        console.log('AUTH STATE: authenticated=true');
        return { success: true, message: response.message, user: nextUser };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      safeCatch('AuthContext.login')(error);
      return { success: false, message: error?.message };
    } finally {
      loginInFlightRef.current = false;
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

      if (response.success) {
        // Registration should not auto-authenticate; continue to login flow.
        setUser(null);
        setIsAuthenticated(false);
        return { success: true, message: response.message };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      safeCatch('AuthContext.register')(error);
      return { success: false, message: error?.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (logoutRef.current) {
      await logoutRef.current;
      return;
    }

    logoutRef.current = (async () => {
      try {
        await authService.logout();
      } catch (error: any) {
        safeCatch('AuthContext.logout')(error);
      } finally {
        setUser(null);
        setIsAuthenticated(false);
      }
    })();

    try {
      await logoutRef.current;
    } finally {
      logoutRef.current = null;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const restored = await restoreAuthState();
      return restored.isAuthenticated;
    } catch (error: any) {
      safeCatch('AuthContext.refreshToken')(error);
      return false;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await authService.updateProfile(data);

      if (response.success) {
        await restoreAuthState();
        return true;
      }

      safeCatch('AuthContext.updateProfile.response', () => {
        Alert.alert('Update Failed', response.message || 'Profile update failed');
      })(new Error('Profile update failed'));
      return false;
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
