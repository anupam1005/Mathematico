import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Enrollment, PaymentStatus, EnrollmentStatus } from '../entities/Enrollment';
import { sendResponse } from '../utils/apiResponse';
import { StatusCodes } from 'http-status-codes';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class EnrollmentController {
  // Check if user has any completed enrollments
  static async checkEnrollmentStatus(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, StatusCodes.UNAUTHORIZED, null, 'Authentication required');
      }

      const user = req.user as TokenPayload;

      // Admin users always have access
      if (user.role === 'admin' || user.role === 'instructor') {
        return sendResponse(res, StatusCodes.OK, {
          hasEnrollment: true,
          isAdmin: true,
          enrollments: []
        }, 'Admin access granted');
      }

      // Check if user has any completed enrollments
      const enrollmentRepository = AppDataSource.getRepository(Enrollment);
      const enrollments = await enrollmentRepository.find({
        where: {
          user: { id: user.id },
          paymentStatus: PaymentStatus.COMPLETED,
          status: EnrollmentStatus.ACTIVE
        },
        relations: ['course'],
        select: {
          id: true,
          enrolledAt: true,
          course: {
            id: true,
            title: true,
            price: true
          }
        }
      });

      return sendResponse(res, StatusCodes.OK, {
        hasEnrollment: enrollments.length > 0,
        isAdmin: false,
        enrollments: enrollments.map(enrollment => ({
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt,
          course: {
            id: enrollment.course.id,
            title: enrollment.course.title,
            price: enrollment.course.price
          }
        }))
      }, 'Enrollment status retrieved successfully');

    } catch (error) {
      console.error('Error checking enrollment status:', error);
      return sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to check enrollment status');
    }
  }

  // Get user's enrolled courses
  static async getUserEnrollments(req: Request, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, StatusCodes.UNAUTHORIZED, null, 'Authentication required');
      }

      const user = req.user as TokenPayload;

      const enrollmentRepository = AppDataSource.getRepository(Enrollment);
      const enrollments = await enrollmentRepository.find({
        where: {
          user: { id: user.id },
          paymentStatus: PaymentStatus.COMPLETED
        },
        relations: ['course'],
        order: {
          enrolledAt: 'DESC'
        }
      });

      return sendResponse(res, StatusCodes.OK, {
        enrollments: enrollments.map(enrollment => ({
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt,
          paymentStatus: enrollment.paymentStatus,
          paymentMethod: enrollment.paymentMethod,
          amount: enrollment.amount,
          course: {
            id: enrollment.course.id,
            title: enrollment.course.title,
            price: enrollment.course.price,
            thumbnailUrl: enrollment.course.thumbnailUrl
          }
        }))
      }, 'User enrollments retrieved successfully');

    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      return sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, null, 'Failed to fetch user enrollments');
    }
  }
}
