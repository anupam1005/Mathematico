import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Test route (no auth required)
router.get('/test', paymentController.testPaymentService);

// Create payment order for course enrollment
router.post('/create-order', authenticate, paymentController.createPaymentOrder);

// Verify payment and complete enrollment
router.post('/verify', authenticate, paymentController.verifyPayment);

// Get payment status
router.get('/status/:paymentId', authenticate, paymentController.getPaymentStatus);

export default router;
