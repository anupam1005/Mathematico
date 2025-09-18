// import type { Request, Response, NextFunction } from 'express';
import { isAdmin } from './auth.middleware';

// Export the admin middleware function
export const adminMiddleware = isAdmin;

// Also export as a default for compatibility
export default isAdmin;
