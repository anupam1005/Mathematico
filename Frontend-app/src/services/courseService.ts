import axios from 'axios';
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Create axios instance for course endpoints
const courseApi = axios.create({
  baseURL: API_CONFIG.mobile,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
courseApi.interceptors.request.use(
  async (config) => {
    const token = await authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
courseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          console.log('CourseService: Token refreshed successfully, retrying request...');
          return courseApi(originalRequest);
        } else {
          console.log('CourseService: Token refresh failed, clearing tokens...');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      } catch (refreshError) {
        console.error('CourseService: Token refresh error:', refreshError);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

class CourseService {
  private async getAuthHeaders() {
    let token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    try {
      const response = await courseApi({
        url: endpoint,
        ...options,
      });
      return response.data;
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
      
      // Since database is disabled, always return empty data
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
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
      console.error('Error fetching course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getFeaturedCourses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.courses || [];
    } catch (error) {
      console.error('Error fetching featured courses:', error);
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
      
      // Since database is disabled, always return empty data
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error searching courses:', error);
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
      console.error('Error fetching courses by category:', error);
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
      console.error('Error fetching courses by level:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  // Admin methods (will return errors since database is disabled)
  async createCourse(courseData: CreateCourseData): Promise<any> {
    throw new Error('Course creation is not available. Database functionality has been removed.');
  }

  async updateCourse(id: string, courseData: UpdateCourseData): Promise<any> {
    throw new Error('Course update is not available. Database functionality has been removed.');
  }

  async deleteCourse(id: string): Promise<void> {
    throw new Error('Course deletion is not available. Database functionality has been removed.');
  }

  async uploadCourseThumbnail(courseId: string, imageUri: string): Promise<string> {
    throw new Error('Course thumbnail upload is not available. Database functionality has been removed.');
  }

  async uploadCourseVideo(courseId: string, videoUri: string): Promise<string> {
    throw new Error('Course video upload is not available. Database functionality has been removed.');
  }

  async enrollInCourse(courseId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${courseId}/enroll`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error enrolling in course:', error);
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