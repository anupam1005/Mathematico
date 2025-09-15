import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKEN_KEY, USER_KEY } from '@/services/auth.service';
import { authService } from '../services/auth.service';
import { User } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<any>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const isMounted = useRef(true);
  const navigate = useNavigate();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update auth state
  const updateAuthState = useCallback((user: User | null, isAuthenticated: boolean) => {
    if (!isMounted.current) return;
    
    console.log('AuthContext - Updating auth state:', {
      isAuthenticated,
      userEmail: user?.email,
      isAdmin: user?.isAdmin,
      userRole: user?.role
    });
    
    setState(prev => ({
      ...prev,
      isAuthenticated,
      isLoading: false,
      user,
      error: null,
    }));
  }, []);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      const token = authService.getToken();
      const user = authService.getCurrentUser();

      if (token && user) {
        updateAuthState(user, true);
      } else {
        updateAuthState(null, false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      updateAuthState(null, false);
    }
  }, [updateAuthState]);

  // Effect to check auth status on mount and set up storage event listener
  useEffect(() => {
    // Initial auth check
    checkAuthStatus();
    
    // Set up storage event listener to sync auth state across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        checkAuthStatus();
      }
    };
    
    // Set up auth state change listener
    const handleAuthStateChange = () => {
      checkAuthStatus();
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, [checkAuthStatus]);

  // Login function
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('AuthContext - Attempting login for:', email);
      
      // Always authenticate against backend
      await authService.login({ email, password, rememberMe });
      
      // Get the current user after login
      const user = authService.getCurrentUser();
      if (user) {
        console.log('AuthContext - Login successful, updating state for user:', user.email);
        updateAuthState(user, true);
        
        // Force a state update before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate based on user role
        if (user.isAdmin) {
          console.log('Admin user detected, navigating to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('Student user detected, navigating to home');
          navigate('/');
        }
        
        // Dispatch auth state change event
        window.dispatchEvent(new Event('authStateChanged'));
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('AuthContext - Login failed:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [updateAuthState, navigate]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      updateAuthState(null, false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      updateAuthState(null, false);
      navigate('/login');
    }
  }, [updateAuthState, navigate]);

  // Register function
  const register = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });
      
      // Update state with the registered user
      updateAuthState(response.user, true);
      
      // Force a state update before navigation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Navigate to appropriate page based on user role
      const redirectPath = response.user.isAdmin ? '/admin/dashboard' : '/';
      navigate(redirectPath, { replace: true });
      
      // Ensure all components are updated with the new auth state
      window.dispatchEvent(new Event('authStateChanged'));
      
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    }
  }, [updateAuthState, navigate]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
      const user = authService.getCurrentUser();
      if (user) {
        updateAuthState(user, true);
      } else {
        throw new Error('Failed to refresh user session');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      updateAuthState(null, false);
      throw error;
    }
  }, [updateAuthState]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    clearError,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
