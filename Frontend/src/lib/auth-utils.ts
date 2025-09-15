/**
 * Utility functions for handling authentication tokens and user sessions
 */

/**
 * Decode a JWT token without verification
 * @param token JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeJwt<T = unknown>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token JWT token to check
 * @returns True if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJwt<{ exp?: number }>(token);
    if (!decoded || typeof decoded.exp !== 'number') return true;
    
    // Convert exp (seconds since epoch) to milliseconds
    const expiryTime = decoded.exp * 1000;
    return Date.now() >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Calculate time until token expiration in milliseconds
 * @param token JWT token to check
 * @returns Time in milliseconds until token expires, or 0 if expired/invalid
 */
export function getTokenExpiryTime(token: string): number {
  try {
    const decoded = decodeJwt<{ exp?: number }>(token);
    if (!decoded || typeof decoded.exp !== 'number') return 0;
    
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    return Math.max(0, expiryTime - now);
  } catch (error) {
    console.error('Error getting token expiry time:', error);
    return 0;
  }
}

/**
 * Parse JWT token and return user information if valid
 * @param token JWT token to parse
 * @returns User information from token or null if invalid
 */
export function getUserFromToken(token: string) {
  try {
    const decoded = decodeJwt<{
      sub: string;
      email?: string;
      name?: string;
      role?: string;
      [key: string]: any;
    }>(token);

    if (!decoded) return null;

    return {
      id: decoded.sub,
      email: decoded.email || '',
      name: decoded.name || '',
      role: decoded.role || 'user',
      ...decoded,
    };
  } catch (error) {
    console.error('Error parsing user from token:', error);
    return null;
  }
}

/**
 * Store authentication tokens securely
 */
class TokenStorage {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  /**
   * Store tokens and user data
   */
  public static setTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    user?: any;
  }): void {
    try {
      // Store tokens in localStorage
      localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      
      // If user data is provided, store it
      if (tokens.user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(tokens.user));
      }
    } catch (error) {
      console.error('Error storing auth tokens:', error);
    }
  }

  /**
   * Get the stored access token
   */
  public static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get the stored refresh token
   */
  public static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get the stored user data
   */
  public static getUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Clear all stored authentication data
   */
  public static clear(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  /**
   * Check if there is an authenticated user
   */
  public static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !isTokenExpired(token);
  }
}

export { TokenStorage };
