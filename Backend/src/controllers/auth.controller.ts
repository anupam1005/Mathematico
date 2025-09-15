import { Request, Response } from 'express';
import { User } from '../entities/User';
import { AppDataSource } from '../config/data-source';
import { JwtService } from '../utils/new-jwt';
import { compare, hash } from 'bcrypt';
import { validate } from 'class-validator';
import { RefreshToken } from '../entities/RefreshToken';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { ApiResponse, sendResponse } from '../utils/apiResponse';
import { StatusCodes } from 'http-status-codes';
import { ApiError, AppError, BadRequestError, ConflictError, UnauthorizedError } from '../middleware/error.middleware';
import { createHash, randomBytes } from 'crypto';
import { emailService } from '../services/email.service';

// Initialize repositories
const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const passwordResetTokenRepository = AppDataSource.getRepository(PasswordResetToken);

export class AuthController {

  async register(req: Request, res: Response<ApiResponse>) {
    try {
      const { email, password, name, role } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        throw new BadRequestError('Email, password, and name are required', 'MISSING_REQUIRED_FIELDS');
      }

      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        console.log('User already exists:', { email, existingUserId: existingUser.id });
        throw new ConflictError('Email already registered', 'EMAIL_ALREADY_EXISTS');
      }

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Create user with role
      const user = new User();
      user.name = name;
      user.email = email;
      user.password = hashedPassword; // This maps to password_hash column
      user.isAdmin = role === 'admin';
      user.role = role === 'admin' ? 'admin' : 'user';

      // Validate user
      const errors = await validate(user);
      if (errors.length > 0) {
        console.error('User validation errors:', errors);
        const validationErrors = errors.map(error => ({
          field: error.property,
          errors: Object.values(error.constraints || {})
        }));
        throw new BadRequestError('Validation failed', 'VALIDATION_ERROR', { errors: validationErrors });
      }

      // Save user to database
      console.log('Saving user to database:', { 
        name: user.name, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        role: user.role,
        hasPassword: !!user.password
      });
      
      const savedUser = await userRepository.save(user);
      console.log('User saved successfully:', { id: savedUser.id, email: savedUser.email });

      if (!savedUser) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Unable to create user", true, "UNAVAILABLE_TO_CREATE_USER");
      }

      // Generate tokens
      const { accessToken, refreshToken, expiresIn } = await JwtService.generateTokens(
        user.id,
        user.email,
        user.isAdmin
      );

      // Save refresh token
      const newRefreshToken = new RefreshToken();
      newRefreshToken.token = refreshToken;
      newRefreshToken.tokenId = createHash('sha256').update(refreshToken).digest('hex');
      newRefreshToken.userId = user.id;
      newRefreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await refreshTokenRepository.save(newRefreshToken);

      return sendResponse(res, StatusCodes.CREATED, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          role: user.isAdmin ? 'admin' : 'user'
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn
        }
      }, 'User registered successfully');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // Handle specific database errors
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new ConflictError('Email already exists', 'EMAIL_ALREADY_EXISTS');
        }
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
          throw new BadRequestError('Invalid reference data', 'INVALID_REFERENCE');
        }
      }
      
      console.error('Unknown error type:', error);
      
      throw new AppError(
        'Registration failed',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'REGISTRATION_FAILED'
      );
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new BadRequestError('Email and password are required', 'MISSING_CREDENTIALS');
      }

      // Find user by email
      let user = await userRepository.findOne({ where: { email } });
      console.log('User lookup result:', { email, userFound: !!user, userIsAdmin: user?.isAdmin });

      // Hardcoded admin credentials
      const adminEmail = 'dc2006089@gmail.com';
      const adminPassword = 'Myname*321';

      if (!user) {
        if (adminEmail && adminPassword && email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
          console.log('Creating admin user on-the-fly...');
          // Create the admin user on-the-fly
          const newUser = new User();
          newUser.email = adminEmail;
          newUser.name = 'Admin User';
          newUser.isAdmin = true;
          newUser.role = 'admin';
          newUser.password = await hash(adminPassword, 10);
          user = await userRepository.save(newUser);
          console.log('Admin user created successfully:', { id: user.id, email: user.email, isAdmin: user.isAdmin, role: user.role });
        } else {
          // Auto-register regular user on first login with provided credentials
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new BadRequestError('Invalid email format', 'INVALID_EMAIL');
          }
          
          console.log('Creating regular user on-the-fly...');
          const newUser = new User();
          newUser.email = email;
          newUser.name = (email?.split('@')?.[0] || 'User').toString();
          newUser.isAdmin = false;
          newUser.role = 'user';
          newUser.password = await hash(password, 10);
          user = await userRepository.save(newUser);
          console.log('Regular user created successfully:', { id: user.id, email: user.email, isAdmin: user.isAdmin, role: user.role });
        }
      }

      // Check password with defensive guards
      let isPasswordValid = false;
      try {
        // Special handling for admin user with hardcoded credentials
        if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
          isPasswordValid = true;
          console.log('Admin password validation: SUCCESS (hardcoded match)');
        } else if (user.password && typeof user.password === 'string') {
          // For existing users, compare with hashed password
          isPasswordValid = await compare(password, user.password);
          console.log('Password validation result:', { isPasswordValid, hasPassword: !!user.password });
        }
      } catch (error) {
        console.error('Password validation error:', error);
        isPasswordValid = false;
      }
      if (!isPasswordValid) {
        console.log('Password validation failed for email:', email);
        throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Generate tokens
      const { accessToken, refreshToken, expiresIn } = await JwtService.generateTokens(
        user.id,
        user.email,
        user.isAdmin
      );

      // Save refresh token
      const newRefreshToken = new RefreshToken();
      newRefreshToken.token = refreshToken;
      newRefreshToken.tokenId = createHash('sha256').update(refreshToken).digest('hex');
      newRefreshToken.userId = user.id;
      newRefreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await refreshTokenRepository.save(newRefreshToken);

      // Prepare user response with all necessary fields
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.isAdmin ? 'admin' : 'user', // Map to frontend expected values
        emailVerified: user.emailVerified || false,
        avatar: user.avatarUrl || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      // If this is the hardcoded admin user, ensure they have admin role
      if (user.email.toLowerCase() === 'dc2006089@gmail.com') {
        userResponse.isAdmin = true;
        userResponse.role = 'admin';
      }

      console.log('Login response user data:', userResponse);
      console.log('Final user object:', { 
        id: user.id, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        role: user.role,
        hasPassword: !!user.password 
      });

      const responseData = {
        success: true,
        status: StatusCodes.OK,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn
          }
        }
      };

      console.log('Sending login response:', JSON.stringify(responseData, null, 2));
      return res.status(StatusCodes.OK).json(responseData);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Login failed',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'LOGIN_FAILED'
      );
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
      }

      // Verify refresh token
      const tokenPayload = await JwtService.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      const token = await refreshTokenRepository.findOne({
        where: { tokenId: tokenHash },
        relations: ['user'],
      });

      if (!token || token.isRevoked) {
        throw new UnauthorizedError('Refresh token is invalid or revoked', 'REFRESH_TOKEN_INVALID');
      }

      // Check if token is expired
      if (token.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
      }

      // Validate that the token payload matches the stored user
      if (tokenPayload.id !== token.user.id) {
        throw new UnauthorizedError('Refresh token mismatch', 'REFRESH_TOKEN_MISMATCH');
      }

      // Generate new tokens
      const user = token.user;
      const { 
        accessToken, 
        refreshToken: newRefreshToken,
        expiresIn
      } = await JwtService.generateTokens(
        user.id,
        user.email,
        user.isAdmin
      );

      // Revoke old refresh token
      token.isRevoked = true;
      token.revokedAt = new Date();
      await refreshTokenRepository.save(token);

      // Save new refresh token
      const newToken = new RefreshToken();
      newToken.token = newRefreshToken;
      newToken.tokenId = createHash('sha256').update(newRefreshToken).digest('hex');
      newToken.userId = user.id;
      newToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await refreshTokenRepository.save(newToken);

      return sendResponse(
        res,
        StatusCodes.OK,
        { accessToken, refreshToken: newRefreshToken, expiresIn },
        'Token refreshed successfully'
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to refresh token',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'REFRESH_TOKEN_FAILED'
      );
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        // Revoke the refresh token
        const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
        const token = await refreshTokenRepository.findOne({ where: { tokenId: tokenHash } });
        if (token) {
          token.isRevoked = true;
          token.revokedAt = new Date();
          await refreshTokenRepository.save(token);
        }
      }
      return sendResponse(res, StatusCodes.OK, null, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Logout failed',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'LOGOUT_FAILED'
      );
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      // User is attached to request by auth middleware
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      // Get fresh user data from database
      const userData = await userRepository.findOne({
        where: { id: (user as any).id },
        select: ['id', 'email', 'name', 'isAdmin', 'createdAt', 'updatedAt'],
      });

      if (!userData) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND, true, 'USER_NOT_FOUND');
      }

      return sendResponse(
        res,
        StatusCodes.OK,
        userData,
        'User profile retrieved successfully'
      );
    } catch (error) {
      console.error('Get profile error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to get user profile',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'GET_PROFILE_FAILED'
      );
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!user) {
        throw new UnauthorizedError('User not authenticated', 'NOT_AUTHENTICATED');
      }

      // Get user with password
      const userWithPassword = await userRepository.findOne({
        where: { id: (user as any).id },
        select: ['id', 'password'],
      });

      if (!userWithPassword) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND, true, 'USER_NOT_FOUND');
      }

      // Verify current password
      const isPasswordValid = await compare(currentPassword, userWithPassword.password);
      if (!isPasswordValid) {
        throw new BadRequestError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }

      // Update password
      userWithPassword.password = await hash(newPassword, 10);
      await userRepository.save(userWithPassword);

      return sendResponse(
        res,
        StatusCodes.OK,
        null,
        'Password updated successfully'
      );
    } catch (error) {
      console.error('Change password error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to change password',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'CHANGE_PASSWORD_FAILED'
      );
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
      }

      // Find user by email
      const user = await userRepository.findOne({ where: { email: email.toLowerCase().trim() } });

      if (user) {
        // Generate a secure random token
        const resetToken = randomBytes(32).toString('hex');
        
        // Set expiration time (1 hour from now)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate any existing reset tokens for this user
        await passwordResetTokenRepository.update(
          { userId: user.id, isUsed: false },
          { isUsed: true }
        );

        // Create new reset token
        const resetTokenEntity = new PasswordResetToken();
        resetTokenEntity.token = resetToken;
        resetTokenEntity.userId = user.id;
        resetTokenEntity.expiresAt = expiresAt;
        resetTokenEntity.isUsed = false;

        await passwordResetTokenRepository.save(resetTokenEntity);

        // Send password reset email
        const emailSent = await emailService.sendPasswordResetEmail(user.email, resetToken);
        
        if (!emailSent) {
          console.error('Failed to send password reset email to:', user.email);
          // Don't throw error here to prevent email enumeration
        } else {
          console.log('Password reset email sent successfully to:', user.email);
        }
      }

      // Always return success to prevent email enumeration
      return sendResponse(
        res,
        StatusCodes.OK,
        null,
        'If an account with that email exists, a password reset link has been sent'
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to process forgot password request',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'FORGOT_PASSWORD_FAILED'
      );
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password: newPassword } = req.body;

      if (!token) {
        throw new BadRequestError('Reset token is required', 'RESET_TOKEN_REQUIRED');
      }

      if (!newPassword) {
        throw new BadRequestError('New password is required', 'NEW_PASSWORD_REQUIRED');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters long', 'WEAK_PASSWORD');
      }

      // Find the reset token
      const resetToken = await passwordResetTokenRepository.findOne({
        where: { token, isUsed: false },
        relations: ['user']
      });

      if (!resetToken) {
        throw new BadRequestError('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        // Mark token as used
        resetToken.isUsed = true;
        await passwordResetTokenRepository.save(resetToken);
        throw new BadRequestError('Reset token has expired', 'EXPIRED_RESET_TOKEN');
      }

      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);

      // Update user's password
      const user = resetToken.user;
      user.password = hashedPassword;
      await userRepository.save(user);

      // Mark the reset token as used
      resetToken.isUsed = true;
      await passwordResetTokenRepository.save(resetToken);

      console.log('Password reset successfully for user:', user.email);

      return sendResponse(
        res,
        StatusCodes.OK,
        null,
        'Password has been reset successfully'
      );
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to reset password',
        StatusCodes.INTERNAL_SERVER_ERROR,
        true,
        'RESET_PASSWORD_FAILED'
      );
    }
  }
}
