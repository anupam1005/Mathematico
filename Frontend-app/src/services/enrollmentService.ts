// Enrollment Service - Handles course enrollment operations
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from './apiClient';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { tokenStorage } from './tokenStorage';

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

const buildRequestHeaders = (authToken?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

const toEnrollmentError = (error: any, fallbackMessage: string): EnrollmentResponse => {
  if (!error?.response) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
    };
  }

  const status = error.response.status;
  const apiMessage = error.response.data?.message || error.response.data?.error;
  return {
    success: false,
    error: `HTTP_${status}`,
    message: apiMessage || fallbackMessage,
  };
};

class EnrollmentService {
  /**
   * Enroll in a course (after payment verification)
   */
  async enrollInCourse(courseId: string): Promise<EnrollmentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.post(`/courses/${courseId}/enroll`, {}, {
        headers: buildRequestHeaders(authToken),
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
        ...toEnrollmentError(error, 'Failed to enroll in course'),
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
        headers: buildRequestHeaders(authToken),
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
        ...toEnrollmentError(error, 'Failed to fetch enrollments'),
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
        headers: buildRequestHeaders(authToken),
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
        ...toEnrollmentError(error, 'Failed to fetch enrollment'),
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
        headers: buildRequestHeaders(authToken),
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
        ...toEnrollmentError(error, 'Failed to update enrollment'),
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
        headers: buildRequestHeaders(authToken),
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
        ...toEnrollmentError(error, 'Failed to cancel enrollment'),
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
        headers: buildRequestHeaders(authToken),
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
        headers: buildRequestHeaders(authToken),
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
        ...toEnrollmentError(error, 'Failed to mark lesson complete'),
      };
    }
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string> {
    try {
      await tokenStorage.hydrate();
      const token = await tokenStorage.getAccessToken();
      return typeof token === 'string' ? token : '';
    } catch (error) {
      errorHandler.handleError('EnrollmentService: Error getting auth token:', error);
      return '';
    }
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;