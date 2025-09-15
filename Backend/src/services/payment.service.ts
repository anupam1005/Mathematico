import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { Course } from '../entities/Course';
import { User } from '../entities/User';

export class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    console.log('PaymentService constructor - Environment check:');
    console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
    console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not found in environment variables');
    }
    
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(amount: number, currency: string = 'INR', receipt: string) {
    try {
      console.log('Razorpay createOrder called with:', { amount, currency, receipt });
      console.log('Razorpay key_id:', process.env.RAZORPAY_KEY_ID);
      console.log('Razorpay key_secret exists:', !!process.env.RAZORPAY_KEY_SECRET);
      
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
        payment_capture: 1, // Auto capture payment
      };

      console.log('Razorpay options:', options);
      const order = await this.razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order);
      return order;
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        response: error.response
      });
      
      // Handle Razorpay specific errors
      if (error.statusCode === 400 && error.error) {
        const razorpayError = error.error;
        throw new Error(`Razorpay Error: ${razorpayError.description || razorpayError.reason || 'Invalid request'}`);
      }
      
      throw new Error(`Failed to create payment order: ${error.message || 'Unknown error'}`);
    }
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<boolean> {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  async createCoursePaymentOrder(courseId: string, userId: string) {
    try {
      console.log('Payment Service - createCoursePaymentOrder called');
      console.log('Course ID:', courseId);
      console.log('User ID:', userId);
      
      const courseRepository = AppDataSource.getRepository(Course);
      const userRepository = AppDataSource.getRepository(User);

      console.log('Fetching course...');
      const course = await courseRepository.findOne({ where: { id: courseId } });
      console.log('Course found:', course ? 'Yes' : 'No');
      
      console.log('Fetching user...');
      const user = await userRepository.findOne({ where: { id: userId } });
      console.log('User found:', user ? 'Yes' : 'No');

      if (!course) {
        throw new Error('Course not found');
      }

      if (!user) {
        throw new Error('User not found');
      }

      const coursePrice = Number(course.price);
      console.log('Course price check:', {
        price: course.price,
        priceType: typeof course.price,
        priceAsNumber: coursePrice,
        isFree: coursePrice <= 0
      });
      
      if (coursePrice <= 0) {
        throw new Error('Course is free, no payment required');
      }

      // Create a shorter receipt (Razorpay limit is 40 characters)
      const receipt = `course_${courseId.substring(0, 8)}_${Date.now()}`;
      console.log('Creating Razorpay order with:', {
        amount: coursePrice,
        currency: 'INR',
        receipt
      });
      
      const order = await this.createOrder(coursePrice, 'INR', receipt);
      console.log('Razorpay order created:', order);

      return {
        order,
        course,
        user,
        receipt
      };
    } catch (error) {
      console.error('Error creating course payment order:', error);
      throw error;
    }
  }
}
