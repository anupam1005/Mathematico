import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/data-source';
import { Enrollment, PaymentStatus, EnrollmentStatus } from '../entities/Enrollment';
import { sendResponse } from '../utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const requireEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return sendResponse(res, StatusCodes.UNAUTHORIZED, null, 'Authentication required');
    }

    const user = req.user as TokenPayload;

    // Admin users have access to everything
    if (user.role === 'admin' || user.role === 'instructor') {
      return next();
    }

    // Check if user has any completed enrollments
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);
    const enrollment = await enrollmentRepository.findOne({
      where: {
        user: { id: user.id },
        paymentStatus: PaymentStatus.COMPLETED,
        status: EnrollmentStatus.ACTIVE
      }
    });

    if (!enrollment) {
      return sendResponse(res, StatusCodes.FORBIDDEN, null, 'You need to purchase a course to access this content');
    }

    // User has valid enrollment, allow access
    next();
  } catch (error) {
    console.error('Enrollment check error:', error);
    return sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to verify enrollment');
  }
};

export const checkEnrollmentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return sendResponse(res, StatusCodes.UNAUTHORIZED, null, 'Authentication required');
    }

    const user = req.user as TokenPayload;

    // Admin users have access to everything
    if (user.role === 'admin' || user.role === 'instructor') {
      return next();
    }

    // Check if user has any completed enrollments
    const enrollmentRepository = AppDataSource.getRepository(Enrollment);
    const enrollments = await enrollmentRepository.find({
      where: {
        user: { id: user.id },
        paymentStatus: PaymentStatus.COMPLETED,
        status: EnrollmentStatus.ACTIVE
      },
      relations: ['course']
    });

    // Add enrollment info to request for use in controllers
    (req as any).userEnrollments = enrollments;
    (req as any).hasEnrollment = enrollments.length > 0;

    next();
  } catch (error) {
    console.error('Enrollment status check error:', error);
    return sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to check enrollment status');
  }
};
