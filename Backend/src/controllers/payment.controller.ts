import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppDataSource } from '../config/data-source';
import { Course } from '../entities/Course';
import { Enrollment, PaymentStatus } from '../entities/Enrollment';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  // Test endpoint to check if payment service is working
  testPaymentService = async (_req: Request, res: Response) => {
    try {
      console.log('Testing payment service...');
      console.log('Environment variables:');
      console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
      console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
      
      // Test creating a simple order
      const testOrder = await this.paymentService.createOrder(5, 'INR', 'test_receipt');
      
      return res.status(200).json({
        success: true,
        message: 'Payment service is working',
        testOrder
      });
    } catch (error: any) {
      console.error('Payment service test failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Payment service test failed',
        error: error.message
      });
    }
  }

  // Create payment order for course enrollment
  createPaymentOrder = async (req: Request, res: Response) => {
    try {
      console.log('Payment Controller - createPaymentOrder called');
      console.log('Request body:', req.body);
      console.log('Request user:', req.user);
      
      if (!req.user) {
        console.log('No user found in request');
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const { courseId } = req.body;
      const user = req.user as TokenPayload;
      
      console.log('Course ID:', courseId);
      console.log('User ID:', user.id);

      if (!courseId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Course ID is required' 
        });
      }

      // Check if course exists and is published
      console.log('Checking if course exists...');
      const courseRepository = AppDataSource.getRepository(Course);
      const course = await courseRepository.findOne({ 
        where: { id: courseId, isPublished: true } 
      });

      console.log('Course query result:', course ? 'Found' : 'Not found');
      if (course) {
        console.log('Course details:', {
          id: course.id,
          title: course.title,
          price: course.price,
          isPublished: course.isPublished
        });
      }

      if (!course) {
        console.log('Course not found or not published');
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found or not published' 
        });
      }

      // Check if already enrolled
      const enrollmentRepository = AppDataSource.getRepository(Enrollment);
      const existingEnrollment = await enrollmentRepository.findOne({
        where: { 
          userId: user.id, 
          courseId: courseId 
        }
      });

      if (existingEnrollment) {
        return res.status(400).json({ 
          success: false, 
          message: 'Already enrolled in this course' 
        });
      }

      // If course is free, enroll directly
      if (course.price <= 0) {
        const enrollment = new Enrollment();
        enrollment.userId = user.id;
        enrollment.courseId = courseId;
        enrollment.enrolledAt = new Date();
        enrollment.paymentStatus = PaymentStatus.COMPLETED;
        enrollment.paymentMethod = 'free';

        await enrollmentRepository.save(enrollment);

        return res.status(200).json({
          success: true,
          message: 'Successfully enrolled in free course',
          enrollment: {
            id: enrollment.id,
            courseId: course.id,
            courseTitle: course.title,
            price: course.price
          }
        });
      }

      // Create payment order for paid course
      console.log('Creating payment order...');
      let paymentData;
      try {
        paymentData = await this.paymentService.createCoursePaymentOrder(courseId, user.id);
        console.log('Payment order created successfully');
      } catch (paymentError) {
        console.error('Payment service error:', paymentError);
        throw paymentError;
      }

      return res.status(200).json({
        success: true,
        message: 'Payment order created successfully',
        order: {
          id: paymentData.order.id,
          amount: paymentData.order.amount,
          currency: paymentData.order.currency,
          receipt: paymentData.order.receipt,
          status: paymentData.order.status
        },
        course: {
          id: paymentData.course.id,
          title: paymentData.course.title,
          price: paymentData.course.price
        }
      });

    } catch (error: any) {
      console.error('Error creating payment order:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create payment order',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

  // Verify payment and complete enrollment
  verifyPayment = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const { paymentId, orderId, signature, courseId } = req.body;
      const user = req.user as TokenPayload;

      if (!paymentId || !orderId || !signature || !courseId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment verification data is incomplete' 
        });
      }

      // Verify payment signature
      const isValidPayment = await this.paymentService.verifyPayment(paymentId, orderId, signature);

      if (!isValidPayment) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid payment signature' 
        });
      }

      // Get payment details from Razorpay
      const paymentDetails = await this.paymentService.getPaymentDetails(paymentId);

      if (paymentDetails.status !== 'captured') {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment not captured' 
        });
      }

      // Check if course exists
      const courseRepository = AppDataSource.getRepository(Course);
      const course = await courseRepository.findOne({ 
        where: { id: courseId, isPublished: true } 
      });

      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }

      // Check if already enrolled
      const enrollmentRepository = AppDataSource.getRepository(Enrollment);
      const existingEnrollment = await enrollmentRepository.findOne({
        where: { 
          userId: user.id, 
          courseId: courseId 
        }
      });

      if (existingEnrollment) {
        return res.status(400).json({ 
          success: false, 
          message: 'Already enrolled in this course' 
        });
      }

      // Create enrollment record
      const enrollment = new Enrollment();
      enrollment.userId = user.id;
      enrollment.courseId = courseId;
      enrollment.enrolledAt = new Date();
      enrollment.paymentStatus = PaymentStatus.COMPLETED;
      enrollment.paymentMethod = 'razorpay';
      enrollment.paymentId = paymentId;
      enrollment.orderId = orderId;
      enrollment.amount = Number(course.price);

      await enrollmentRepository.save(enrollment);

      // Update course student count
      course.students = (course.students || 0) + 1;
      await courseRepository.save(course);

      return res.status(200).json({
        success: true,
        message: 'Payment verified and enrollment completed successfully',
        enrollment: {
          id: enrollment.id,
          courseId: course.id,
          courseTitle: course.title,
          enrolledAt: enrollment.enrolledAt,
          paymentStatus: enrollment.paymentStatus
        },
        payment: {
          id: paymentId,
          amount: Number(paymentDetails.amount) / 100, // Convert from paise to rupees
          currency: paymentDetails.currency,
          status: paymentDetails.status
        }
      });

    } catch (error) {
      console.error('Error verifying payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to verify payment' 
      });
    }
  };

  // Get payment status
  getPaymentStatus = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Payment ID is required' 
        });
      }

      const paymentDetails = await this.paymentService.getPaymentDetails(paymentId);

      return res.status(200).json({
        success: true,
        payment: {
          id: paymentDetails.id,
          amount: Number(paymentDetails.amount) / 100,
          currency: paymentDetails.currency,
          status: paymentDetails.status,
          method: paymentDetails.method,
          created_at: paymentDetails.created_at
        }
      });

    } catch (error) {
      console.error('Error fetching payment status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch payment status' 
      });
    }
  };
}
