<<<<<<< HEAD
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
=======
import axios from 'axios';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

<<<<<<< HEAD
// Create a service error handler for courseService
const errorHandler = createServiceErrorHandler('courseService');

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
  baseURL: API_CONFIG.mobile, // This will be updated dynamically
=======
  baseURL: API_CONFIG.mobile,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

<<<<<<< HEAD
// Update the base URL dynamically
(async () => {
  try {
    courseApi.defaults.baseURL = API_CONFIG.mobile;
    console.log('CourseService: Base URL updated to:', courseApi.defaults.baseURL);
  } catch (error) {
    console.error('CourseService: Failed to update base URL:', error);
  }
})();

// Request interceptor to add auth token
courseApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
=======
// Request interceptor to add auth token
courseApi.interceptors.request.use(
  async (config) => {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    const token = await authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
<<<<<<< HEAD
  (error: AxiosError) => {
=======
  (error) => {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
courseApi.interceptors.response.use(
<<<<<<< HEAD
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as InternalAxiosRequestConfig & { _retry?: boolean };
=======
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    
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
<<<<<<< HEAD
        errorHandler.handleError('CourseService: Token refresh error:', refreshError);
=======
        console.error('CourseService: Token refresh error:', refreshError);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      // Use API_CONFIG directly
      const fullUrl = `${API_CONFIG.mobile}${endpoint}`;
      
      console.log('CourseService: Making request to:', fullUrl);
      
      const response = await courseApi({
        url: endpoint,
        baseURL: API_CONFIG.mobile,
=======
      const response = await courseApi({
        url: endpoint,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        ...options,
      });
      return response.data;
    } catch (error) {
<<<<<<< HEAD
      console.error('CourseService: Request failed:', error);
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
      
<<<<<<< HEAD
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
=======
      // Since database is disabled, always return empty data
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching courses:', error);
=======
      console.error('Error fetching courses:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getCourseById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}`);
<<<<<<< HEAD
      return response;
    } catch (error) {
      errorHandler.handleError('Error fetching course:', error);
=======
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getFeaturedCourses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.courses || [];
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching featured courses:', error);
=======
      console.error('Error fetching featured courses:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
      
<<<<<<< HEAD
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
        };
      }
      
=======
      // Since database is disabled, always return empty data
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error searching courses:', error);
=======
      console.error('Error searching courses:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching courses by category:', error);
=======
      console.error('Error fetching courses by category:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching courses by level:', error);
=======
      console.error('Error fetching courses by level:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

<<<<<<< HEAD
  // Admin methods
  async createCourse(courseData: CreateCourseData): Promise<any> {
    try {
      const response = await this.makeRequest('/courses', {
        method: 'POST',
        data: courseData
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error creating course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async updateCourse(id: string, courseData: UpdateCourseData): Promise<any> {
    try {
      const response = await this.makeRequest(`/courses/${id}`, {
        method: 'PUT',
        data: courseData
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error updating course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async deleteCourse(id: string): Promise<void> {
    try {
      await this.makeRequest(`/courses/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      errorHandler.handleError('Error deleting course:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async uploadCourseThumbnail(courseId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('thumbnail', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'thumbnail.jpg',
      } as any);

      const response = await this.makeRequest(`/courses/${courseId}/thumbnail`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.thumbnailUrl;
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
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  }
}

export const courseService = new CourseService();
<<<<<<< HEAD
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
=======
export default courseService;
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
