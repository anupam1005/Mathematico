import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { NotFoundError } from '../middleware/error.middleware';
import { BadRequestError } from '../middleware/error.middleware';
import { validateEntityRequest } from '../utils/validation';
import { User } from '../entities/User';

// Use global Request.user definition from middleware

export class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new NotFoundError('User not authenticated');
    }
    const userId = (req.user as any).id;
    const user = await this.userRepository.getUserWithRoles(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    if (!user) {
      throw new Error('User not found');
    }
    
    res.json({
      status: 'success',
      data: userData,
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    const userId = (req.user as any).id;
    const updateData = await validateEntityRequest(User, req, true);
    
    // Prevent updating sensitive fields
    if ('password' in updateData || 'isActive' in updateData || 'roles' in updateData) {
      throw new BadRequestError('Cannot update restricted fields');
    }
    
    await this.userRepository.update(userId, updateData);
    const updatedUser = await this.userRepository.getUserWithRoles(userId);
    
    if (!updatedUser) {
      throw new NotFoundError('User not found after update');
    }
    
    // Remove sensitive data
    const { password, ...userData } = updatedUser;
    
    res.json({
      status: 'success',
      data: userData,
    });
  };

  uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    
    const userId = (req.user as any).id;
    
    const file = (req as any).file as { filename: string } | undefined;
    if (!file) {
      throw new BadRequestError('No file uploaded');
    }
    
    // In a real app, you would upload to a cloud storage service like S3
    const fileUrl = `/uploads/profile-pictures/${file.filename}`;
    
    await this.userRepository.update(userId, { avatarUrl: fileUrl });
    
    res.json({
      status: 'success',
      data: {
        avatarUrl: fileUrl,
      },
    });
  };

  // Admin methods
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    
    const { data: users, meta } = await this.userRepository.searchUsers(
      search as string,
      pageNumber,
      limitNumber
    );
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    
    res.json({
      status: 'success',
      data: usersWithoutPasswords,
      meta,
    });
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const user = await this.userRepository.getUserWithRoles(id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Remove sensitive data
    const { password, ...userData } = user;
    
    res.json({
      status: 'success',
      data: userData,
    });
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = await validateEntityRequest(User, req, true);
    
    // Prevent updating password directly
    if ('password' in updateData) {
      throw new BadRequestError('Use the change password endpoint to update password');
    }
    
    await this.userRepository.update(id, updateData);
    const updatedUser = await this.userRepository.getUserWithRoles(id);
    
    if (!updatedUser) {
      throw new NotFoundError('User not found after update');
    }
    
    // Remove sensitive data
    const { password, ...userData } = updatedUser;
    
    res.json({
      status: 'success',
      data: userData,
    });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    
    // Prevent deleting own account
    if (req.user && id === (req.user as any).id) {
      throw new BadRequestError('Cannot delete your own account');
    }
    
    await this.userRepository.delete(id);
    
    res.status(204).send();
  };
}

export default new UserController();
