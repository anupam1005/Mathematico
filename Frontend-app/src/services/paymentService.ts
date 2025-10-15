// @ts-nocheck
import authService from './authService';
import { API_CONFIG } from '../config';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface CoursePaymentData {
  order: PaymentOrder;
  course: {
    id: string;
    title: string;
    price: number;
  };
}

export interface PaymentVerificationData {
  paymentId: string;
  orderId: string;
  signature: string;
  courseId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  enrollment: {
    id: string;
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    paymentStatus: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
}

class PaymentService {
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

  async createPaymentOrder(courseId: string): Promise<CoursePaymentData> {
    try {
      const response = await this.makeRequest(`/course/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: 'card', amount: 99.99 }),
      });
      return {
        order: {
          id: response.data.paymentId || `pay_${Date.now()}`,
          amount: response.data.amount || 99.99,
          currency: 'INR',
          receipt: response.data.paymentId || `receipt_${Date.now()}`,
          status: response.data.status || 'completed'
        },
        course: {
          id: courseId,
          title: 'Course Title',
          price: response.data.amount || 99.99
        }
      };
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  async verifyPayment(verificationData: PaymentVerificationData): Promise<PaymentVerificationResponse> {
    try {
      // For now, simulate successful verification
      return {
        success: true,
        message: 'Payment verified successfully',
        enrollment: {
          id: `enroll_${Date.now()}`,
          courseId: verificationData.courseId,
          courseTitle: 'Course Title',
          enrolledAt: new Date().toISOString(),
          paymentStatus: 'completed'
        },
        payment: {
          id: verificationData.paymentId,
          amount: 99.99,
          currency: 'INR',
          status: 'completed'
        }
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      // For now, simulate successful payment status
      return {
        id: paymentId,
        status: 'completed',
        amount: 99.99,
        currency: 'INR'
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
