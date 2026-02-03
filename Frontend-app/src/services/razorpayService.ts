// Razorpay Payment Service
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from './apiClient';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { Platform } from 'react-native';

// Create a service error handler for razorpayService
const errorHandler = createServiceErrorHandler('razorpayService');
const mobileApi = withBasePath(API_PATHS.mobile);

// LAZY LOAD: Defer native module initialization to prevent Hermes frozen object crash
let RazorpayCheckoutNative: any = null;

// Lazy-load the Razorpay native module only when needed
const getRazorpayCheckout = () => {
  if (RazorpayCheckoutNative !== null) {
    return RazorpayCheckoutNative;
  }
  
  try {
    RazorpayCheckoutNative = require('react-native-razorpay');
    return RazorpayCheckoutNative;
  } catch (error) {
    RazorpayCheckoutNative = (typeof globalThis !== 'undefined' ? (globalThis as any).RazorpayCheckout : null);
    return RazorpayCheckoutNative;
  }
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

class RazorpayService {
  private config: any = null;

  /**
   * Create a Razorpay order
   */
  async createOrder(paymentOptions: PaymentOptions): Promise<RazorpayPaymentResponse> {
    try {
      const authToken = await this.getAuthToken();
      const response = await mobileApi.post('/payments/create-order', paymentOptions, {
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
        success: false,
        error: 'Network error occurred',
        message: 'Failed to create payment order. Please check your connection.',
      };
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentData: any): Promise<RazorpayPaymentResponse> {
    try {
      const response = await mobileApi.post('/payments/verify', paymentData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
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
        success: false,
        error: 'Network error occurred',
        message: 'Failed to verify payment',
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<RazorpayPaymentResponse> {
    try {
      const response = await mobileApi.get('/payments/history', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
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
        success: false,
        error: 'Network error occurred',
        message: 'Failed to fetch payment history',
      };
    }
  }

  /**
   * Get Razorpay configuration from backend
   */
  private async getConfig(): Promise<any> {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await mobileApi.get('/payments/config', {
        headers: {
          'Content-Type': 'application/json',
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
      // Don't return empty config - throw error so user knows payment won't work
      throw new Error('Payment service configuration failed. Please contact support.');
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
      errorHandler.handleError('RazorpayService: Error getting auth token:', error);
      return '';
    }
  }

  /**
   * Format amount for Razorpay (amount in paise)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Format amount for display (amount in rupees)
   */
  formatDisplayAmount(amount: number): number {
    return amount / 100;
  }

  /**
   * Open Razorpay checkout
   */
  async openCheckout(options: any): Promise<RazorpayPaymentResponse> {
    try {
      // Check if running on web platform
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: 'Web platform not supported',
          message: 'Razorpay payment is only available on mobile devices. Please use the mobile app to complete your purchase.',
        };
      }
      
      // Lazy-load RazorpayCheckout module
      const RazorpayCheckout = getRazorpayCheckout();
      
      // Check if RazorpayCheckout is available
      if (!RazorpayCheckout || !RazorpayCheckout.open) {
        return {
          success: false,
          error: 'Razorpay SDK not available',
          message: 'Payment service is not available. Please ensure the app is properly installed.',
        };
      }
      
      // Get secure configuration from backend
      const config = await this.getConfig();
      
      if (!config.keyId) {
        return {
          success: false,
          error: 'Configuration error',
          message: 'Razorpay configuration is not available. Please contact support.',
        };
      }
      
      const razorpayOptions = {
        description: options.description || 'Payment for Mathematico',
        image: 'https://mathematico.com/logo.png',
        currency: options.currency || config.currency,
        key: config.keyId,
        amount: this.formatAmount(options.amount).toString(),
        name: config.name,
        order_id: options.order_id,
        prefill: {
          email: options.email || '',
          contact: options.contact || '',
          name: options.name || ''
        },
        theme: {
          color: config.theme.color
        },
        method: {
          upi: false,  // Disable UPI payment method
          card: true,
          netbanking: true,
          wallet: true
        }
      };

      const data = await RazorpayCheckout.open(razorpayOptions);
      
      return {
        success: true,
        data: data,
        message: 'Payment completed successfully',
      };
    } catch (error: any) {
      errorHandler.handleError('RazorpayService: Payment failed:', error);
      
      // Safely extract error message using try-catch
      let errorMsg = '';
      try {
        if (error && error.message) {
          errorMsg = String(error.message).toLowerCase();
        }
      } catch (e) {
        // Property access failed, continue with empty string
      }
      
      // Handle native module not available
      if (errorMsg.includes('_nativemodule')) {
        return {
          success: false,
          error: 'Payment service unavailable',
          message: 'Payment service is not available. Please ensure the app is properly installed and try again.',
        };
      }
      
      // Handle user cancellation
      if (errorMsg.includes('cancel') || errorMsg.includes('cancelled')) {
        return {
          success: false,
          error: 'Payment cancelled by user',
          message: 'Payment was cancelled',
        };
      }
      
      return {
        success: false,
        error: 'Payment failed',
        message: 'Payment could not be completed',
      };
    }
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
