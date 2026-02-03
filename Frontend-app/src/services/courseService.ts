import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from './apiClient';
import ErrorHandler from '../utils/errorHandler';

// Create a service error handler for courseService
const errorHandler = createServiceErrorHandler('courseService');

export type CourseLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseStatus = 'draft' | 'published' | 'archived';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BaseCourseData {
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  level?: CourseLevel;
  price?: number;
  originalPrice?: number;
  duration?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  materialsUrl?: string;
  tags?: string[];
  prerequisites?: string[];
  learningObjectives?: string[];
}

export interface CreateCourseData extends BaseCourseData {
  status?: CourseStatus;
}

export interface UpdateCourseData extends Partial<BaseCourseData> {
  status?: CourseStatus;
  isPublished?: boolean;
  isFeatured?: boolean;
}

const mobileApi = withBasePath(API_PATHS.mobile);
const adminApi = withBasePath(API_PATHS.admin);

class CourseService {
  private async makeRequest(endpoint: string, options: any = {}) {
    try {
      const response = await mobileApi.request({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('CourseService: Request failed');
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getCourses(
    page: number = 1,
    limit: number = 10,
    filters?: { status?: string; category?: string; level?: string; search?: string }
  ): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await this.makeRequest(`/courses?${params.toString()}`);
      
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching courses:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getCourseById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}`);
      return response;
    } catch (error) {
      errorHandler.handleError('Error fetching course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getFeaturedCourses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.courses || [];
    } catch (error) {
      errorHandler.handleError('Error fetching featured courses:', error);
      return [];
    }
  }

  async searchCourses(query: string, filters?: {
    category?: string;
    level?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ search: query });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.level) params.append('level', filters.level);
      
      const response = await this.makeRequest(`/courses?${params.toString()}`);
      
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
        };
      }
      
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error searching courses:', error);
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    }
  }

  async getCoursesByCategory(category: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getCourses(page, limit, { category });
      return response;
    } catch (error) {
      errorHandler.handleError('Error fetching courses by category:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getCoursesByLevel(level: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getCourses(page, limit, { level });
      return response;
    } catch (error) {
      errorHandler.handleError('Error fetching courses by level:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  // Admin methods
  async createCourse(courseData: CreateCourseData): Promise<any> {
    try {
      const isFormData = courseData instanceof FormData;
      const config = isFormData ? undefined : { headers: { 'Content-Type': 'application/json' } };
      const response = await adminApi.post('/courses', courseData, config);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error creating course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async updateCourse(id: string, courseData: UpdateCourseData): Promise<any> {
    try {
      const isFormData = courseData instanceof FormData;
      const config = isFormData ? undefined : { headers: { 'Content-Type': 'application/json' } };
      const response = await adminApi.put(`/courses/${id}`, courseData, config);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error updating course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async deleteCourse(id: string): Promise<void> {
    try {
      await adminApi.delete(`/courses/${id}`);
    } catch (error) {
      errorHandler.handleError('Error deleting course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async uploadCourseThumbnail(courseId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'thumbnail.jpg',
      } as any);

      const response = await adminApi.post('/courses/upload-thumbnail', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const payload = response.data;
      return payload?.data?.thumbnailUrl || payload?.data?.thumbnail || payload?.thumbnailUrl || '';
    } catch (error) {
      errorHandler.handleError('Error uploading course thumbnail:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async uploadCourseVideo(courseId: string, videoUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'course-video.mp4',
      } as any);

      const response = await this.makeRequest(`/courses/${courseId}/video`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.videoUrl;
    } catch (error) {
      errorHandler.handleError('Error uploading course video:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async enrollInCourse(courseId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}/enroll`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error enrolling in course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }
}

export const courseService = new CourseService();
export default courseService;

// Export Course type for use in components
export type Course = BaseCourseData & {
  _id?: string;
  id?: string;
  Id?: string;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  level?: CourseLevel;
  price?: number;
  original_price?: number;
  duration?: string;
  thumbnail_url?: string;
  videoUrl?: string;
  materialsUrl?: string;
  students?: number;
  enrolledStudents?: number;
  subject?: string;
  class?: string;
  what_you_will_learn?: string[];
  who_is_this_for?: string[];
  requirements?: string;
  topics?: string[];
  status?: CourseStatus;
  isAvailable?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
