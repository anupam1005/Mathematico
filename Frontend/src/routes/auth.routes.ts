import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
// Helpful 405 for accidental GET in browser
router.get('/login', (_req, res) => {
  res.status(405).json({ status: 'error', message: 'Method Not Allowed. Use POST /api/v1/auth/login' });
});
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getProfile);
router.post('/logout', authController.logout);
router.put('/change-password', authController.changePassword);

export default router;
