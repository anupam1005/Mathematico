import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth.middleware';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update current user profile
router.patch('/profile', userController.updateProfile);

// Upload profile picture
router.post('/profile/picture', userController.uploadProfilePicture);

// Admin routes - admin only
router.use(isAdmin);

// Get all users (admin only)
router.get('/', userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', userController.getUserById);

// Update user by ID (admin only)
router.patch('/:id', userController.updateUser);

// Delete user by ID (admin only)
router.delete('/:id', userController.deleteUser);

export default router;
