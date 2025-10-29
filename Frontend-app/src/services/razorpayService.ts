// Razorpay Payment Service
import { API_CONFIG } from '../config';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { Platform } from 'react-native';

// Create a service error handler for razorpayService
const errorHandler = createServiceErrorHandler('razorpayService');

// Safe import of RazorpayCheckout
let RazorpayCheckout: any = null;
try {
  RazorpayCheckout = require('react-native-razorpay');
  console.log('✅ RazorpayCheckout loaded successfully');
} catch (error: any) {
  errorHandler.logWarning('⚠️ RazorpayCheckout not available:', error?.message || 'Unknown error');
  RazorpayCheckout = null;
}

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
  private baseUrl = API_CONFIG.baseUrl; // This will be updated dynamically
  private config: any = null;

  constructor() {
    // Update the base URL dynamically
    this.updateBaseUrl();
  }

  private async updateBaseUrl() {
    try {
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      this.baseUrl = `${backendUrl}/api/v1`;
      console.log('RazorpayService: Base URL updated to:', this.baseUrl);
    } catch (error) {
      console.error('RazorpayService: Failed to update base URL:', error);
    }
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(paymentOptions: PaymentOptions): Promise<RazorpayPaymentResponse> {
    try {
      errorHandler.logInfo('RazorpayService: Creating order with options:', paymentOptions);
      
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const mobileUrl = `${backendUrl}/api/v1/mobile`;
      
      const response = await fetch(`${mobileUrl}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(paymentOptions),
      });

      const data = await response.json();
      errorHandler.logInfo('RazorpayService: Order creation response:', data);

      if (data.success) {
        return {
          success: true,
          data: data.data,
          message: 'Order created successfully',
        };
      } else {
        return {
          success: false,
          error: data.message || 'Failed to create order',
          message: data.message,
        };
      }
    } catch (error) {
      errorHandler.handleError('RazorpayService: Error creating order:', error);
      return {
        success: false,
        error: 'Network error occurred',
        message: 'Failed to create payment order',
      };
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentData: any): Promise<RazorpayPaymentResponse> {
    try {
      errorHandler.logInfo('RazorpayService: Verifying payment:', paymentData);
      
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const mobileUrl = `${backendUrl}/api/v1/mobile`;
      
      const response = await fetch(`${mobileUrl}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      errorHandler.logInfo('RazorpayService: Payment verification response:', data);

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
      console.log('RazorpayService: Fetching payment history');
      
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const mobileUrl = `${backendUrl}/api/v1/mobile`;
      
      const response = await fetch(`${mobileUrl}/payments/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const data = await response.json();
      errorHandler.logInfo('RazorpayService: Payment history response:', data);

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
      console.log('RazorpayService: Fetching configuration from backend...');
      
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const mobileUrl = `${backendUrl}/api/v1/mobile`;
      
      const response = await fetch(`${mobileUrl}/payments/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        this.config = data.data;
        console.log('RazorpayService: Configuration loaded successfully');
        return this.config;
      } else {
        throw new Error(data.message || 'Failed to load configuration');
      }
    } catch (error) {
      errorHandler.handleError('RazorpayService: Error loading configuration:', error);
      // Fallback to default config
      this.config = {
        keyId: 'rzp_test_your_key_id_here',
        currency: 'INR',
        name: 'Mathematico',
        description: 'Educational Platform',
        theme: { color: '#3399cc' }
      };
      return this.config;
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
      errorHandler.logInfo('RazorpayService: Opening Razorpay checkout with options:', options);
      
      // Check if running on web platform
      if (Platform.OS === 'web') {
        console.warn('RazorpayService: Running on web platform, payment not supported');
        return {
          success: false,
          error: 'Web platform not supported',
          message: 'Razorpay payment is only available on mobile devices. Please use the mobile app to complete your purchase.',
        };
      }
      
      // Check if RazorpayCheckout is available
      if (!RazorpayCheckout || !RazorpayCheckout.open) {
        console.warn('RazorpayService: RazorpayCheckout not available, using demo mode');
        
        // Demo mode - simulate successful payment
        return {
          success: true,
          data: {
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_order_id: options.order_id,
            razorpay_signature: `demo_signature_${Date.now()}`
          },
          message: 'Demo payment completed successfully',
        };
      }
      
      // Get secure configuration from backend
      const config = await this.getConfig();
      
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
        }
      };

      const data = await RazorpayCheckout.open(razorpayOptions);
      
      errorHandler.logInfo('RazorpayService: Payment successful:', data);
      
      return {
        success: true,
        data: data,
        message: 'Payment completed successfully',
      };
    } catch (error: any) {
      errorHandler.handleError('RazorpayService: Payment failed:', error);
      
      // Handle native module not available
      if (error.message && error.message.includes('_nativeModule')) {
        console.warn('RazorpayService: Native module not available, using demo mode');
        return {
          success: true,
          data: {
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_order_id: options.order_id,
            razorpay_signature: `demo_signature_${Date.now()}`
          },
          message: 'Demo payment completed successfully (native module not available)',
        };
      }
      
      // Handle user cancellation
      if (error.code === 'PAYMENT_CANCELLED') {
        return {
          success: false,
          error: 'Payment cancelled by user',
          message: 'Payment was cancelled',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Payment failed',
        message: 'Payment could not be completed',
      };
    }
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
