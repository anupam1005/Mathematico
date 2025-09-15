import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import courseRoutes from './course.routes';
import bookRoutes from './book.routes';
import liveClassRoutes from './liveClass.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';
import enrollmentRoutes from './enrollment.routes';
import { sendResponse } from '../utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  sendResponse(res, StatusCodes.OK, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1'
  }, 'Server is running');
});

// Simple test endpoint that doesn't require database
router.get('/test', (_req, res) => {
  sendResponse(res, StatusCodes.OK, {
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL === '1'
  }, 'Test endpoint working');
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/books', bookRoutes);
router.use('/live-classes', liveClassRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/enrollments', enrollmentRoutes);

// 404 handler for unmatched routes
router.use('*', (_req, res) => {
  sendResponse(res, StatusCodes.NOT_FOUND, null, 'Route not found');
});

export default router;
