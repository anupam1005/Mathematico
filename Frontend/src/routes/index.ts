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

// Root API endpoint
router.get('/', (_req, res) => {
  sendResponse(res, StatusCodes.OK, {
    message: 'Mathematico API v1 running',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      courses: '/api/v1/courses',
      liveClasses: '/api/v1/live-classes',
      admin: '/api/v1/admin',
      payments: '/api/v1/payments',
      enrollments: '/api/v1/enrollments'
    }
  }, 'API is running');
});

// Health check endpoint
router.get('/health', (_req, res) => {
  sendResponse(res, StatusCodes.OK, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, 'Server is running');
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
