import type { Request, Response, NextFunction } from 'express';
import { JwtService, TokenPayload } from '../utils/new-jwt';
import { UnauthorizedError, ForbiddenError } from './error.middleware';

export type AuthUser = TokenPayload & { isAdmin?: boolean };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    console.log('🔐 Authentication middleware called');
    console.log('Request URL:', req.url);
    console.log('Authorization header:', req.headers.authorization);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      throw new UnauthorizedError('No token provided', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ No token in authorization header');
      throw new UnauthorizedError('No token provided', 'NO_TOKEN');
    }

    console.log('🔑 Token extracted:', token.substring(0, 20) + '...');

    // Verify token
    const payload = await JwtService.verifyAccessToken(token) as TokenPayload;
    console.log('✅ Token verified, payload:', payload);
    
    // Attach user to request object
    req.user = { ...(payload as any) } as AuthUser;
    console.log('👤 User attached to request:', req.user);

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token', 'INVALID_TOKEN'));
    }
  }
};

// Export authenticate as authMiddleware for backward compatibility
export const authMiddleware = authenticate;

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  try {
    console.log('👑 Admin check middleware called');
    console.log('User object:', req.user);
    console.log('User isAdmin:', (req.user as AuthUser)?.isAdmin);
    
    // First check if user is authenticated
    if (!req.user) {
      console.log('❌ No user object found');
      throw new UnauthorizedError('Authentication required');
    }
    
    // Then check if user is admin
    if (!(req.user as AuthUser)?.isAdmin) {
      console.log('❌ User is not admin');
      throw new ForbiddenError('Admin access required');
    }
    
    console.log('✅ User is admin, proceeding');
    next();
  } catch (error) {
    console.error('❌ Admin check error:', error);
    next(error);
  }
};
