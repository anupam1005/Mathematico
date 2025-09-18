import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Check enrollment status
router.get('/status', authenticate, EnrollmentController.checkEnrollmentStatus);

// Get user's enrollments
router.get('/my-enrollments', authenticate, EnrollmentController.getUserEnrollments);

export default router;
