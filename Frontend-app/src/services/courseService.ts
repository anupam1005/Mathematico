// @ts-nocheck
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';

export type CourseLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseStatus = 'draft' | 'active' | 'archived';

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
  description: string;
  price: number;
  originalPrice: number;
  level: CourseLevel;
  category: string;
  topics: string[];
  slug?: string;
  duration?: string;
  status?: CourseStatus;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  content?: string;
  requirements?: string;
  whatYouWillLearn?: string[];
  whoIsThisFor?: string[];
}

export interface CreateCourseData extends Omit<BaseCourseData, 'status'> {
  students?: number;
  status?: CourseStatus;
}

class CourseService {
  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${API_CONFIG.mobile}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(await this.getAuthHeaders()),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(`HTTP error! status: ${response.status}`);
        (error as any).response = { status: response.status, data: errorData };
        throw error;
      }

      return response.json();
    } catch (error) {
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
      
      // Validate response
      const validation = ErrorHandler.validateApiResponse(response);
      if (!validation.success) {
        console.warn('API response validation failed, using fallback data:', validation.error);
        return {
          data: ErrorHandler.createFallbackData('courses'),
          meta: { total: 1, page, limit, totalPages: 1 }
        };
      }
      
      const backendData = response.data;
      return {
        data: backendData.courses || backendData || [],
        meta: backendData.meta || backendData.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Return fallback data when API fails
      return {
        data: ErrorHandler.createFallbackData('courses'),
        meta: { total: 1, page, limit, totalPages: 1 }
      };
    }
  }

  async getCourseById(id: string | number): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  async createCourse(courseData: CreateCourseData | FormData): Promise<any> {
    try {
      const isFormData = courseData instanceof FormData;
      const response = await this.makeRequest('/courses', {
        method: 'POST',
        body: isFormData ? courseData : JSON.stringify(courseData),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(id: string | number, courseData: Partial<CreateCourseData> | FormData): Promise<any> {
    try {
      const isFormData = courseData instanceof FormData;
      const response = await this.makeRequest(`/courses/${id}`, {
        method: 'PUT',
        body: isFormData ? courseData : JSON.stringify(courseData),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(id: string | number): Promise<void> {
    try {
      await this.makeRequest(`/courses/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  async publishCourse(id: string | number, isPublished: boolean): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      });
      return response.data;
    } catch (error) {
      console.error('Error publishing course:', error);
      throw error;
    }
  }

  async getAllCoursesAdmin(page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (status) params.append('status', status);
      
      const response = await this.makeRequest(`/courses?${params.toString()}`);
      
      if (response && response.success && response.data) {
        const backendData = response.data;
        return {
          data: backendData.courses || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: response.data || [],
        meta: response.meta || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching admin courses:', error);
      throw error;
    }
  }

  async getCourseByIdAdmin(id: string | number): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin course:', error);
      throw error;
    }
  }

  async uploadThumbnail(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await this.makeRequest('/courses/upload-thumbnail', {
        method: 'POST',
        body: formData,
        headers: {},
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  }

  async togglePublishStatus(id: number): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}/toggle-publish`, {
        method: 'PATCH',
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling publish status:', error);
      throw error;
    }
  }

  async getAllCourses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/courses');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
  }

  async getMyCourses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/my-courses');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching my courses:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string | number): Promise<void> {
    try {
      await this.makeRequest(`/course/${courseId}/enroll`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  async getCourseProgress(courseId: string | number): Promise<any> {
    try {
      const response = await this.makeRequest(`/course/${courseId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course progress:', error);
      throw error;
    }
  }

  async updateCourseProgress(courseId: string | number, progressData: any): Promise<any> {
    try {
      const response = await this.makeRequest(`/course/${courseId}/progress`, {
        method: 'PUT',
        body: JSON.stringify(progressData),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }
}

export const courseService = new CourseService();