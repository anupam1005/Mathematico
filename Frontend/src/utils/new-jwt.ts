import * as jwt from 'jsonwebtoken';
import { SignOptions, VerifyOptions, JwtPayload as BaseJwtPayload } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { promisify } from 'util';

// Validate required environment variables
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}

// Type definitions for JWT payload
export interface JwtPayload extends BaseJwtPayload {
  id: string;
  email: string;
  isAdmin: boolean;
  jti?: string;  // JWT ID for token versioning
  type?: 'access' | 'refresh';
  iss?: string;  // Issuer
  sub?: string;  // Subject (user ID)
  aud?: string;  // Audience
}

export type TokenPayload = Omit<JwtPayload, keyof BaseJwtPayload>;

// In-memory token blacklist (in production, use Redis or similar)
const tokenBlacklist = new Set<string>();
const generateRandomString = promisify(randomBytes);

// Default JWT options
const defaultSignOptions: SignOptions = {
  algorithm: 'HS256',  // Use HMAC with SHA-256
  allowInsecureKeySizes: false,
};

export class JwtService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET as string;
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as string;
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.NODE_ENV === 'production' ? '15m' : '24h'; // 15m in production, 24h in development
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '30d'; // 30 days
  private static readonly ISSUER = 'mathematico-api';
  private static readonly AUDIENCE = 'mathematico-client';

  // Validate secrets on class load
  static {
    if (!this.JWT_SECRET || !this.REFRESH_TOKEN_SECRET) {
      throw new Error('JWT secrets are not properly configured');
    }
  }

  /**
   * Generate access and refresh tokens with rotation support
   */
  static async generateTokens(
    userId: string, 
    email: string, 
    isAdmin: boolean = false
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshTokenId: string;
  }> {
    try {
      if (!userId || !email) {
        throw new Error('User ID and email are required');
      }

      // Generate a unique ID for this refresh token
      const refreshTokenId = (await generateRandomString(16)).toString('hex');
      
      // Access token options
      const accessTokenOptions: SignOptions = {
        ...defaultSignOptions,
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        issuer: this.ISSUER,
        audience: this.AUDIENCE,
        subject: userId,
        jwtid: refreshTokenId, // Set jti in options
      };

      // Create access token
      const accessToken = await this.signToken(
        { 
          id: userId,
          email,
          isAdmin,
          type: 'access',
          iat: Math.floor(Date.now() / 1000), // Current time in seconds
        },
        this.JWT_SECRET,
        accessTokenOptions
      );

      // Create refresh token with the same ID
      const refreshToken = await this.signToken(
        { 
          id: userId,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000), // Current time in seconds
        },
        this.REFRESH_TOKEN_SECRET,
        {
          ...defaultSignOptions,
          expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
          issuer: this.ISSUER,
          audience: this.AUDIENCE,
          subject: userId,
          jwtid: refreshTokenId, // Set jti in options
        }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: this.getExpirationInSeconds(this.ACCESS_TOKEN_EXPIRES_IN),
        refreshTokenId
      };
    } catch (error) {
      console.error('Error generating tokens:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  /**
   * Verify access token
   */
  static async verifyAccessToken(token: string): Promise<JwtPayload> {
    if (!token) {
      throw new Error('No token provided');
    }

    try {
      const options: VerifyOptions = {
        issuer: this.ISSUER,
        audience: this.AUDIENCE,
        algorithms: ['HS256'],
      };

      const payload = await this.verifyToken(token, this.JWT_SECRET, options);
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        throw new Error('Token has been revoked');
      }

      return {
        id: payload.id,
        email: payload.email,
        isAdmin: payload.isAdmin || false,
        jti: payload.jti,
        iat: payload.iat,
        exp: payload.exp,
        type: 'access',
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token and check if it's blacklisted
   */
  static async verifyRefreshToken(token: string): Promise<{ id: string; jti: string }> {
    if (!token) {
      throw new Error('No refresh token provided');
    }

    try {
      const options: VerifyOptions = {
        issuer: this.ISSUER,
        audience: this.AUDIENCE,
        algorithms: ['HS256'],
      };

      const payload = await this.verifyToken(token, this.REFRESH_TOKEN_SECRET, options);
      
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Check if token is blacklisted
      if (tokenBlacklist.has(token)) {
        throw new Error('Token has been revoked');
      }

      if (!payload.jti) {
        throw new Error('Invalid token: missing token ID');
      }

      return { 
        id: payload.id, 
        jti: payload.jti 
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke a refresh token
   */
  static revokeRefreshToken(token: string): void {
    tokenBlacklist.add(token);
    
    // In a production environment, you would also want to persist this
    // to a database and set an expiration time for the blacklist entry
  }

  /**
   * Get all blacklisted tokens (for testing/management)
   */
  static getBlacklistedTokens(): Set<string> {
    return new Set(tokenBlacklist);
  }

  /**
   * Sign a JWT token
   */
  private static async signToken(
    payload: object,
    secret: string,
    options: jwt.SignOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const signOptions: jwt.SignOptions = {
        ...defaultSignOptions,
        ...options,
      };

      jwt.sign(payload, secret, signOptions, (err, token) => {
        if (err || !token) {
          console.error('Error signing token:', err);
          reject(err || new Error('Failed to sign token'));
        } else {
          resolve(token);
        }
      });
    });
  }

  /**
   * Verify a JWT token
   */
  private static async verifyToken(
    token: string,
    secret: string,
    options: jwt.VerifyOptions = {}
  ): Promise<JwtPayload> {
    return new Promise((resolve, reject) => {
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: ['HS256'],
        ...options,
      };

      jwt.verify(token, secret, verifyOptions, (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err);
          reject(err);
        } else if (!decoded || typeof decoded === 'string') {
          reject(new Error('Invalid token payload'));
        } else {
          resolve(decoded as JwtPayload);
        }
      });
    });
  }

  /**
   * Get expiration time in seconds
   */
  private static getExpirationInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}. Use format: 15m, 1h, 7d, etc.`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return value * 60; // Default to minutes if unit is not recognized
    }
  }

  /**
   * Verify if a token is valid and not blacklisted
   */
  static async verifyAccessTokenSafe(token: string): Promise<JwtPayload> {
    const payload = await this.verifyAccessToken(token);
    
    // In a real implementation, you might want to check if the token's jti is revoked
    // This would involve checking a database or cache
    
    return payload;
  }
}
