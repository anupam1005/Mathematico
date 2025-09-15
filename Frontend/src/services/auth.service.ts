import { RegisterData, AuthResponse, User } from '@/types';
import api from '@/lib/api';

// Storage keys
export const TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'user';

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private _refreshToken: string | null = null;
  private refreshTokenTimeout: number | null = null;

  // User Management
  public getCurrentUser(): User | null {
    if (this.user) return this.user;
    
    const userStr = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        this.user = JSON.parse(userStr) as User;
        return this.user;
      } catch (e) {
        console.error('Failed to parse user from storage', e);
        this.clearSession();
      }
    }
    return null;
  }

  // Token Management
  public getToken(): string | null {
    // First check instance variable
    if (this.token) return this.token;
    
    // Then check both storage types
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      // Basic JWT shape check: three dot-separated parts
      const isJwtLike = token.split('.').length === 3;
      if (!isJwtLike) {
        // Clear legacy/fake tokens that will cause 401 loops
        this.clearSession();
        return null;
      }
      this.token = token;
    }
    return token;
  }

  public setToken(token: string): void {
    this.token = token;
    // The actual storage is handled in setSession
  }

  public setRefreshToken(refreshToken: string): void {
    this._refreshToken = refreshToken;
    // The actual storage is handled in setSession
  }

  public setUser(user: User): void {
    this.user = user;
    // The actual storage is handled in setSession
  }

  public getRefreshToken(): string | null {
    // First check instance variable
    if (this._refreshToken) return this._refreshToken;
    
    // Then check both storage types
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this._refreshToken = refreshToken;
    }
    return refreshToken;
  }

  // Authentication State
  public isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin || false;
  }

  // Session Management
  private setSession(authData: AuthResponse & { rememberMe?: boolean }): void {
    const { user, tokens, rememberMe = true } = authData;
    const { accessToken, refreshToken, expiresIn } = tokens;
    
    // Update instance state
    this.token = accessToken;
    this._refreshToken = refreshToken;
    this.user = user;

    // Ensure isAdmin is properly set
    if (user) {
      // Handle both boolean and string representations of admin status
      if (typeof user.isAdmin === 'boolean') {
        this.user.isAdmin = user.isAdmin;
      } else if (user.role === 'admin') {
        this.user.isAdmin = true;
      } else {
        this.user.isAdmin = false;
      }
      
      console.log('Setting session for user:', {
        email: user.email,
        isAdmin: this.user.isAdmin,
        role: user.role
      });
    }

    // Store tokens and user data in both storage types for redundancy
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    
    try {
      // Store in primary storage
      storage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) {
        storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      storage.setItem(USER_KEY, JSON.stringify(this.user));
      
      // Clear from other storage to prevent conflicts
      otherStorage.removeItem(TOKEN_KEY);
      otherStorage.removeItem(REFRESH_TOKEN_KEY);
      otherStorage.removeItem(USER_KEY);
      
      // Set up token refresh if expiresIn is provided
      if (expiresIn) {
        this.startRefreshTokenTimer(expiresIn);
      }
      
      // Notify all listeners about auth state change
      window.dispatchEvent(new Event('authStateChanged'));
      
      console.log('Session updated for user:', user.email, 'isAdmin:', this.user.isAdmin);
    } catch (error) {
      console.error('Failed to update session:', error);
      // If storage fails, clear everything to prevent inconsistent state
      this.clearSession();
      throw new Error('Failed to update session storage');
    }
  }

  public clearSession(): void {
    this.token = null;
    this._refreshToken = null;
    this.user = null;
    
    // Clear from both storage types to be safe
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    
    // Clear any pending refresh
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  // Token Refresh
  private startRefreshTokenTimer(expiresIn: number): void {
    // Clear any existing timeout
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Set a timeout to refresh the token 1 minute before it expires
    const timeout = Math.max(0, (expiresIn - 60) * 1000);
    
    this.refreshTokenTimeout = window.setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        this.clearSession();
      }
    }, timeout);
  }

  // Authentication Methods
  public async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<AuthResponse> {
    // Input validation
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Please provide a valid email address');
    }

    try {
      // Format the request data to match backend expectations
      const loginData = {
        email: credentials.email.trim(),
        password: credentials.password
      };
      
      console.log('Attempting login with:', { 
        email: loginData.email,
        password: '[REDACTED]' // Don't log actual password
      });

      // Make the login request with proper error handling
      const response = await api.post('/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });

      console.log('Login response status:', response.status, 'Data:', response.data);
      
      // Handle error responses
      if (response.status >= 400) {
        let errorMessage = 'Login failed. Please check your credentials and try again.';
        
        if (response.data) {
          // Handle different error response formats
          if (typeof response.data === 'string') {
            errorMessage = response.data;
          } else if (response.data.error) {
            errorMessage = response.data.error;
          } else if (response.data.message) {
            errorMessage = response.data.message;
          } else if (response.data.data?.error) {
            errorMessage = response.data.data.error;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Handle successful response
      const responseData = response.data;
      
      // Log the full response for debugging
      console.log('Login response data:', responseData);

      // Check if the response has the expected structure
      if (!responseData) {
        throw new Error('Invalid response format: empty response');
      }

      // Handle the nested response structure from backend
      const data = responseData.data;
      if (!data) {
        console.error('Missing data in response:', responseData);
        throw new Error('Invalid response format: missing data');
      }
      
      // Extract user and tokens from the nested structure
      const { user, tokens } = data;
      const { accessToken, refreshToken, expiresIn } = tokens || {};
      
      if (!user || !accessToken) {
        console.error('Missing user or access token in response:', { data });
        throw new Error('Invalid response format: missing user or access token');
      }

      // Ensure user has both isAdmin and role properties
      const userWithAdmin = {
        ...user,
        isAdmin: user.isAdmin || user.role === 'admin' || false,
        role: user.role || (user.isAdmin ? 'admin' : 'user')
      };

      console.log('Login successful, user data:', {
        id: user.id,
        email: user.email,
        isAdmin: userWithAdmin.isAdmin,
        role: userWithAdmin.role
      });

      const authResponse: AuthResponse = {
        user: userWithAdmin,
        tokens: {
          accessToken,
          refreshToken: refreshToken || '',
          expiresIn: expiresIn || 3600
        }
      };
      
      // Set the session with rememberMe flag
      this.setSession({
        ...authResponse,
        rememberMe: !!credentials.rememberMe
      });
      
      return authResponse;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         error.message || 
                         'Login failed';
      throw new Error(errorMessage);
    }
  }

  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('Attempting registration with:', { 
        name: userData.name,
        email: userData.email,
        password: '[REDACTED]'
      });

      const response = await api.post('/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password
      });

      console.log('Registration response:', response.data);

      const responseData = response.data;
      console.log('Full registration response:', responseData);
      
      // Handle both success and data properties
      if (!responseData) {
        throw new Error('Empty response from server');
      }

      // Check if response has success property
      if (responseData.success === false) {
        throw new Error(responseData.message || 'Registration failed');
      }

      // Extract data from response
      const data = responseData.data || responseData;
      const { user, tokens } = data;
      
      if (!user) {
        console.error('Missing user in response:', data);
        throw new Error('Invalid registration response: missing user data');
      }

      // Handle both nested and flat token structure
      let accessToken, refreshToken, expiresIn;
      if (tokens) {
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
        expiresIn = tokens.expiresIn;
      } else {
        // Fallback to flat structure
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        expiresIn = data.expiresIn;
      }
      
      if (!accessToken) {
        console.error('Missing access token in response:', data);
        throw new Error('Invalid registration response: missing access token');
      }

      const authResponse: AuthResponse = {
        user,
        tokens: {
          accessToken,
          refreshToken: refreshToken || '',
          expiresIn: expiresIn || 3600
        }
      };
      
      this.setSession({
        ...authResponse,
        rememberMe: true
      });
      
      return authResponse;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }
        
        // Handle specific HTTP status codes
        if (error.response.status === 409) {
          errorMessage = 'An account with this email already exists. Please use a different email or try logging in instead.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  public async logout(): Promise<void> {
    try {
      // Call the logout endpoint to invalidate the refresh token
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with cleanup even if the API call fails
    } finally {
      // Clear all auth-related data
      this.clearSession();
      
      // Reset any application state if needed
      if (typeof window !== 'undefined') {
        // Redirect to login page
        window.location.href = '/login';
      }
    }
  }

  public async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post<{ data: AuthResponse }>(
        '/auth/refresh-token',
        { refreshToken }
      );
      
      if (response.data?.data) {
        this.setSession(response.data.data);
      }
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  // Backward compatibility
  public getCurrentUserFromStorage(): User | null {
    return this.getCurrentUser();
  }

  public getRefreshTokenFromStorage(): string | null {
    return this.getRefreshToken();
  }

  // Validate token format and clear if corrupted
  public validateAndCleanToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token has proper JWT format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format detected, clearing token');
      this.clearSession();
      return false;
    }
    
    // Check if token is not empty or just whitespace
    if (!token.trim()) {
      console.warn('Empty token detected, clearing session');
      this.clearSession();
      return false;
    }
    
    return true;
  }

  // Forgot Password
  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please provide a valid email address');
      }

      const response = await api.post('/auth/forgot-password', {
        email: email.toLowerCase().trim()
      });

      return {
        success: response.data.success || true,
        message: response.data.message || 'Password reset email sent successfully'
      };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset email';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'No account found with this email address';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please try again later';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Reset Password
  public async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!token) {
        throw new Error('Reset token is required');
      }

      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await api.post('/auth/reset-password', {
        token,
        password: newPassword
      });

      return {
        success: response.data.success || true,
        message: response.data.message || 'Password reset successfully'
      };
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to reset password';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset token';
      } else if (error.response?.status === 404) {
        errorMessage = 'Reset token not found';
      }
      
      throw new Error(errorMessage);
    }
  }

  // Force re-authentication by clearing all tokens
  public forceReAuth(): void {
    console.warn('Forcing re-authentication due to token corruption');
    this.clearSession();
    
    // Clear from both storage types
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    
    // Reset instance variables
    this.token = null;
    this._refreshToken = null;
    this.user = null;
    
    // Dispatch event to notify components
    window.dispatchEvent(new Event('authStateChanged'));
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
