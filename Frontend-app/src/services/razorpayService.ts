// Razorpay payment service — WebView Checkout.js only (no native SDK).
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from './apiClient';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { Platform } from 'react-native';
import { tokenStorage } from './tokenStorage';

const errorHandler = createServiceErrorHandler('razorpayService');
const mobileApi = withBasePath(API_PATHS.mobile);

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

const toPaymentError = (error: any, fallbackMessage: string): RazorpayPaymentResponse => {
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

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPaymentResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface PaymentOptions {
  amount: number;
  currency: string;
  receipt: string;
  notes?: {
    courseId?: string;
    bookId?: string;
    userId?: string;
    itemType?: string;
  };
}

/** Serializable object passed to Razorpay Checkout.js in the WebView (no functions). */
export interface RazorpayWebCheckoutPayload {
  key: string;
  amount: string;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
  method: {
    upi: boolean;
    card: boolean;
    netbanking: boolean;
    wallet: boolean;
  };
}

export interface PrepareWebCheckoutInput {
  orderId: string;
  amountRupees: number;
  currency: string;
  description: string;
  customerName: string;
  email: string;
  contact?: string;
}

class RazorpayService {
  private config: any = null;

  async createOrder(paymentOptions: PaymentOptions): Promise<RazorpayPaymentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.post('/payments/create-order', paymentOptions, {
        headers: buildRequestHeaders(authToken),
      });
      const data = response.data;

      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: 'Order created successfully',
        };
      } else {
        return {
          success: false,
          error: data.error || data.message || 'Failed to create order',
          message: data.message || 'Failed to create payment order',
        };
      }
    } catch (error: any) {
      errorHandler.handleError('RazorpayService: Error creating order:', error);
      return {
        ...toPaymentError(error, 'Failed to create payment order'),
      };
    }
  }

  async verifyPayment(paymentData: any): Promise<RazorpayPaymentResponse> {
    try {
      const response = await mobileApi.post('/payments/verify', paymentData, {
        headers: buildRequestHeaders(await this.getAuthToken()),
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: 'Payment verified successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Payment verification failed',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('RazorpayService: Error verifying payment:', error);
      return {
        ...toPaymentError(error, 'Failed to verify payment'),
      };
    }
  }

  async getPaymentHistory(): Promise<RazorpayPaymentResponse> {
    try {
      const response = await mobileApi.get('/payments/history', {
        headers: buildRequestHeaders(await this.getAuthToken()),
      });

      const data = response.data;

      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: 'Payment history retrieved successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to fetch payment history',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('RazorpayService: Error fetching payment history:', error);
      return {
        ...toPaymentError(error, 'Failed to fetch payment history'),
      };
    }
  }

  private async getConfig(): Promise<any> {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await mobileApi.get('/payments/config', {
        headers: {
          Accept: 'application/json',
        },
      });
      const data = response.data;
      if (data.success && data.data) {
        this.config = data.data;
        return this.config;
      } else {
        throw new Error(data.message || 'Failed to load Razorpay configuration');
      }
    } catch (error) {
      errorHandler.handleError('RazorpayService: Error loading configuration:', error);
      throw new Error('Payment service configuration failed. Please contact support.');
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      await tokenStorage.hydrate();
      const token = await tokenStorage.getAccessToken();
      return token || '';
    } catch (error) {
      errorHandler.handleError('RazorpayService: Error getting auth token:', error);
      return '';
    }
  }

  formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  formatDisplayAmount(amount: number): number {
    return amount / 100;
  }

  /**
   * Builds options for Razorpay Checkout.js (WebView). Call after createOrder succeeds.
   * Uses public key_id from your backend — never embed key_secret in the app.
   */
  async prepareWebCheckoutOptions(input: PrepareWebCheckoutInput): Promise<{
    success: boolean;
    data?: RazorpayWebCheckoutPayload;
    message?: string;
    error?: string;
  }> {
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Web platform not supported',
        message: 'Use the mobile app to complete payment.',
      };
    }

    try {
      const config = await this.getConfig();
      if (!config.keyId) {
        return {
          success: false,
          error: 'Configuration error',
          message: 'Razorpay is not configured. Please contact support.',
        };
      }

      const amountPaise = this.formatAmount(input.amountRupees);
      const payload: RazorpayWebCheckoutPayload = {
        key: config.keyId,
        amount: String(amountPaise),
        currency: input.currency || config.currency || 'INR',
        order_id: input.orderId,
        name: config.name || 'Mathematico',
        description: input.description,
        image: 'https://mathematico.com/logo.png',
        prefill: {
          name: input.customerName,
          email: input.email || '',
          contact: input.contact || '',
        },
        theme: {
          color: config?.theme?.color || '#3399cc',
        },
        method: {
          upi: false,
          card: true,
          netbanking: true,
          wallet: true,
        },
      };

      return { success: true, data: payload };
    } catch (error: any) {
      errorHandler.handleError('RazorpayService: prepareWebCheckoutOptions:', error);
      return {
        success: false,
        error: 'CONFIG_ERROR',
        message: error?.message || 'Could not prepare checkout',
      };
    }
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
