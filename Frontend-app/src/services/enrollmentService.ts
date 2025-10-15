// Enrollment Service - Handles course enrollment operations (No Database Version)

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

class EnrollmentService {
  async enrollInCourse(courseId: string): Promise<EnrollmentResponse> {
    throw new Error('Course enrollment is not available. Database functionality has been removed.');
  }

  async getEnrollments(userId?: string): Promise<EnrollmentResponse> {
    return {
      success: true,
      data: [],
      message: 'Database functionality has been removed'
    };
  }

  async getEnrollmentById(enrollmentId: string): Promise<EnrollmentResponse> {
    throw new Error('Enrollment not found. Database functionality has been removed.');
  }

  async updateEnrollmentStatus(enrollmentId: string, status: string): Promise<EnrollmentResponse> {
    throw new Error('Enrollment update is not available. Database functionality has been removed.');
  }

  async cancelEnrollment(enrollmentId: string): Promise<EnrollmentResponse> {
    throw new Error('Enrollment cancellation is not available. Database functionality has been removed.');
  }

  async getEnrollmentProgress(enrollmentId: string): Promise<EnrollmentResponse> {
    return {
      success: true,
      data: {
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
        lastAccessed: null
      },
      message: 'Database functionality has been removed'
    };
  }

  async markLessonComplete(enrollmentId: string, lessonId: string): Promise<EnrollmentResponse> {
    throw new Error('Lesson completion tracking is not available. Database functionality has been removed.');
  }
}

export const enrollmentService = new EnrollmentService();
export default enrollmentService;