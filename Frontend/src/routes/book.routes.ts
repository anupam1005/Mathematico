import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireEnrollment } from '../middleware/enrollment.middleware';

const router = Router();

// Student routes - require authentication and enrollment
router.get('/', authenticate, requireEnrollment, BookController.getPublishedBooks);
router.get('/:id/download', authenticate, requireEnrollment, BookController.downloadPdf);
router.get('/:id', authenticate, requireEnrollment, BookController.getBookById);

// Note: Admin routes are now handled by admin.routes.ts for consistency
// This prevents duplicate routes and conflicts

export default router;
