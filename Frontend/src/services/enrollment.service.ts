import api from '@/lib/api';

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
  private readonly baseUrl = '/enrollments';

  async checkEnrollmentStatus(): Promise<EnrollmentStatus> {
    try {
      const response = await api.get(`${this.baseUrl}/status`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking enrollment status:', error);
      // Return default status if error occurs
      return {
        hasEnrollment: false,
        isAdmin: false,
        enrollments: []
      };
    }
  }

  async getUserEnrollments(): Promise<Enrollment[]> {
    try {
      const response = await api.get(`${this.baseUrl}/my-enrollments`);
      return response.data.data.enrollments;
    } catch (error: any) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }
  }
}

export const enrollmentService = new EnrollmentService();
