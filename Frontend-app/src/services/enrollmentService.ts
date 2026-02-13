// Enrollment Service - Handles course enrollment operations
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from './apiClient';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';

// Create a service error handler for enrollmentService
const errorHandler = createServiceErrorHandler('enrollmentService');
const mobileApi = withBasePath(API_PATHS.mobile);

export interface EnrollmentData {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface EnrollmentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class EnrollmentService {
  /**
   * Enroll in a course (after payment verification)
   */
  async enrollInCourse(courseId: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.post(`/courses/${courseId}/enroll`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Enrolled successfully',
        };
      } else {
        return {
          success: false,
          error: data.error || data.message || 'Failed to enroll',
          message: data.message || 'Enrollment failed',
        };
      }
    } catch (error: any) {
      errorHandler.handleError('EnrollmentService: Error enrolling in course:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Already enrolled',
          message: 'You are already enrolled in this course',
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Course not found',
          message: 'The course you are trying to enroll in is not available',
        };
      }
      
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to enroll in course. Please check your connection.',
      };
    }
  }

  /**
   * Get user's enrollments
   */
  async getEnrollments(userId?: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const endpoint = userId ? `/enrollments?userId=${userId}` : '/enrollments';
      
      const response = await mobileApi.get(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: data.data || [],
          message: data.message || 'Enrollments retrieved successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to fetch enrollments',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error fetching enrollments:', error);
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to fetch enrollments. Please check your connection.',
      };
    }
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.get(`/enrollments/${enrollmentId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Enrollment retrieved successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Enrollment not found',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error fetching enrollment:', error);
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to fetch enrollment. Please check your connection.',
      };
    }
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(enrollmentId: string, status: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.put(`/enrollments/${enrollmentId}`, { status }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Enrollment updated successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to update enrollment',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error updating enrollment:', error);
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to update enrollment. Please check your connection.',
      };
    }
  }

  /**
   * Cancel enrollment
   */
  async cancelEnrollment(enrollmentId: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.delete(`/enrollments/${enrollmentId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Enrollment cancelled successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to cancel enrollment',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error cancelling enrollment:', error);
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to cancel enrollment. Please check your connection.',
      };
    }
  }

  /**
   * Get enrollment progress
   */
  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.get(`/enrollments/${enrollmentId}/progress`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: {
            progress: data.data?.progress || 0,
            completedLessons: data.data?.completedLessons || 0,
            totalLessons: data.data?.totalLessons || 0,
            lastAccessed: data.data?.lastAccessed || null
          },
          message: data.message || 'Progress retrieved successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to fetch progress',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error fetching progress:', error);
      return {
        success: true,
        data: {
          progress: 0,
          completedLessons: 0,
          totalLessons: 0,
          lastAccessed: null
        },
        message: 'Progress data not available',
      };
    }
  }

  /**
   * Mark lesson as complete
   */
  async markLessonComplete(enrollmentId: string, lessonId: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = response.data;
      
      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message || 'Lesson marked as complete',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to mark lesson complete',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error marking lesson complete:', error);
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to mark lesson complete. Please check your connection.',
      };
    }
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string> {
    try {
      const { Storage } = await import('../utils/storage');
      const token = await Storage.getItem('authToken');
      return token || '';
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error getting auth token:', error);
      return '';
    }
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;