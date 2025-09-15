import api from '@/lib/api';

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
  private readonly baseUrl = '/payments';

  async createPaymentOrder(courseId: string): Promise<CoursePaymentData> {
    try {
      const response = await api.post(`${this.baseUrl}/create-order`, {
        courseId
      });

      if (response.data.success) {
        return {
          order: response.data.order,
          course: response.data.course
        };
      } else {
        throw new Error(response.data.message || 'Failed to create payment order');
      }
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create payment order');
    }
  }

  async verifyPayment(verificationData: PaymentVerificationData): Promise<PaymentVerificationResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/verify`, verificationData);

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Payment verification failed');
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const response = await api.get(`${this.baseUrl}/status/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payment status:', error);
      throw new Error('Failed to fetch payment status');
    }
  }
}

export const paymentService = new PaymentService();
