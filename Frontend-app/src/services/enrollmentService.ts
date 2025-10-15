// @ts-nocheck
import authService from './authService';
import { API_CONFIG } from '../config';

export interface Enrollment {
  id: string;
  enrolledAt: string;
  paymentStatus: string;
  paymentMethod?: string;
  amount?: number;
  course: {
    id: string;
    title: string;
    price: number;
    thumbnailUrl?: string;
  };
}

export interface EnrollmentStatus {
  hasEnrollment: boolean;
  isAdmin: boolean;
  enrollments: Array<{
    id: string;
    enrolledAt: string;
    course: {
      id: string;
      title: string;
      price: number;
    };
  }>;
}

class EnrollmentService {
  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_CONFIG.student}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(await this.getAuthHeaders()),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async checkEnrollmentStatus(): Promise<EnrollmentStatus> {
    try {
      const response = await this.makeRequest('/my-courses');
      return {
        hasEnrollment: response.data && response.data.length > 0,
        isAdmin: false, // This should be determined from auth context
        enrollments: response.data || []
      };
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      // Return default status for non-authenticated users
      return {
        hasEnrollment: false,
        isAdmin: false,
        enrollments: []
      };
    }
  }

  async getUserEnrollments(): Promise<Enrollment[]> {
    try {
      const response = await this.makeRequest('/my-courses');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string): Promise<Enrollment> {
    try {
      const response = await this.makeRequest(`/course/${courseId}/enroll`, {
        method: 'POST',
      });
      return {
        id: response.data.paymentId || `enroll_${Date.now()}`,
        enrolledAt: response.data.enrolledAt || new Date().toISOString(),
        paymentStatus: response.data.status || 'completed',
        paymentMethod: 'card',
        amount: response.data.amount || 99.99,
        course: {
          id: courseId,
          title: 'Course Title',
          price: response.data.amount || 99.99,
          thumbnailUrl: ''
        }
      };
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  async purchaseBook(bookId: string): Promise<Enrollment> {
    try {
      const response = await this.makeRequest(`/book/${bookId}/purchase`, {
        method: 'POST',
      });
      return {
        id: response.data.paymentId || `purchase_${Date.now()}`,
        enrolledAt: response.data.purchasedAt || new Date().toISOString(),
        paymentStatus: response.data.status || 'completed',
        paymentMethod: 'card',
        amount: response.data.amount || 49.99,
        course: {
          id: bookId,
          title: 'Book Title',
          price: response.data.amount || 49.99,
          thumbnailUrl: ''
        }
      };
    } catch (error) {
      console.error('Error purchasing book:', error);
      throw error;
    }
  }
}

export const enrollmentService = new EnrollmentService();
