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
// Create a service error handler for liveClassService
const errorHandler = createServiceErrorHandler('liveClassService');

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
export type LiveClassLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
export type LiveClassStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BaseLiveClassData {
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  level?: LiveClassLevel;
  scheduledAt?: Date;
  duration?: number;
  maxStudents?: number;
  meetingLink?: string;
  thumbnailUrl?: string;
  tags?: string[];
  prerequisites?: string[];
  learningObjectives?: string[];
}

export interface CreateLiveClassData extends BaseLiveClassData {
  status?: LiveClassStatus;
}

export interface UpdateLiveClassData extends Partial<BaseLiveClassData> {
  status?: LiveClassStatus;
  isPublished?: boolean;
  isFeatured?: boolean;
}

// Create axios instance for live class endpoints
const liveClassApi = axios.create({
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
    liveClassApi.defaults.baseURL = API_CONFIG.mobile;
    console.log('LiveClassService: Base URL updated to:', liveClassApi.defaults.baseURL);
  } catch (error) {
    console.error('LiveClassService: Failed to update base URL:', error);
  }
})();

// Request interceptor to add auth token
liveClassApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
=======
// Request interceptor to add auth token
liveClassApi.interceptors.request.use(
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
liveClassApi.interceptors.response.use(
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
          console.log('LiveClassService: Token refreshed successfully, retrying request...');
          return liveClassApi(originalRequest);
        } else {
          console.log('LiveClassService: Token refresh failed, clearing tokens...');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      } catch (refreshError) {
<<<<<<< HEAD
        errorHandler.handleError('LiveClassService: Token refresh error:', refreshError);
=======
        console.error('LiveClassService: Token refresh error:', refreshError);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

class LiveClassService {
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
      // Ensure we're using the correct backend URL
      const backendUrl = API_CONFIG.mobile.replace(/\/$/, '');
      const fullUrl = `${backendUrl}${endpoint}`;
      
      console.log('LiveClassService: Making request to:', fullUrl);
      
      const response = await liveClassApi({
        url: endpoint,
        baseURL: backendUrl,
=======
      const response = await liveClassApi({
        url: endpoint,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        ...options,
      });
      return response.data;
    } catch (error) {
<<<<<<< HEAD
      console.error('LiveClassService: Request failed:', error);
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getLiveClasses(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    subject?: string;
    level?: string;
    status?: string;
<<<<<<< HEAD
    search?: string;
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.status) params.append('status', filters.status);
<<<<<<< HEAD
      if (filters?.search) params.append('search', filters.search);
      
      const response = await this.makeRequest(`/live-classes?${params.toString()}`);
      
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
=======
      
      const response = await this.makeRequest(`/live-classes?${params.toString()}`);
      
      // Since database is disabled, always return empty data
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching live classes:', error);
=======
      console.error('Error fetching live classes:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getLiveClassById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}`);
<<<<<<< HEAD
      
      if (response && response.data) {
        return {
          success: true,
          data: response.data,
          message: 'Live class fetched successfully'
        };
      }
      
      return {
        success: false,
        data: null,
        message: 'Live class not found'
      };
    } catch (error) {
      errorHandler.handleError('Error fetching live class:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to fetch live class'
      };
=======
      return response.data;
    } catch (error) {
      console.error('Error fetching live class:', error);
      throw ErrorHandler.handleApiError(error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    }
  }

  async getFeaturedLiveClasses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.liveClasses || [];
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching featured live classes:', error);
=======
      console.error('Error fetching featured live classes:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return [];
    }
  }

<<<<<<< HEAD
  async startLiveClass(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}/start`, {
        method: 'PUT'
      });
      
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Live class started successfully'
        };
      }
      
      return {
        success: false,
        data: null,
        message: 'Failed to start live class'
      };
    } catch (error) {
      errorHandler.handleError('Error starting live class:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to start live class'
      };
    }
  }

  async endLiveClass(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}/end`, {
        method: 'PUT'
      });
      
      if (response && response.success) {
        return {
          success: true,
          data: response.data,
          message: 'Live class ended successfully'
        };
      }
      
      return {
        success: false,
        data: null,
        message: 'Failed to end live class'
      };
    } catch (error) {
      errorHandler.handleError('Error ending live class:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to end live class'
      };
    }
  }

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  async getUpcomingLiveClasses(page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getLiveClasses(page, limit, { status: 'scheduled' });
      return response;
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching upcoming live classes:', error);
=======
      console.error('Error fetching upcoming live classes:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async searchLiveClasses(query: string, filters?: {
    category?: string;
    level?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ search: query });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.level) params.append('level', filters.level);
      
      const response = await this.makeRequest(`/live-classes?${params.toString()}`);
      
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
      errorHandler.handleError('Error searching live classes:', error);
=======
      console.error('Error searching live classes:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    }
  }

  async getLiveClassesByCategory(category: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getLiveClasses(page, limit, { category });
      return response;
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching live classes by category:', error);
=======
      console.error('Error fetching live classes by category:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getLiveClassesByLevel(level: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getLiveClasses(page, limit, { level });
      return response;
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching live classes by level:', error);
=======
      console.error('Error fetching live classes by level:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

<<<<<<< HEAD
  // Admin methods
  async createLiveClass(liveClassData: CreateLiveClassData): Promise<any> {
    try {
      const response = await this.makeRequest('/live-classes', {
        method: 'POST',
        data: liveClassData
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error creating live class:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async updateLiveClass(id: string, liveClassData: UpdateLiveClassData): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}`, {
        method: 'PUT',
        data: liveClassData
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error updating live class:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async deleteLiveClass(id: string): Promise<void> {
    try {
      await this.makeRequest(`/live-classes/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      errorHandler.handleError('Error deleting live class:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async uploadLiveClassThumbnail(liveClassId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('thumbnail', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'thumbnail.jpg',
      } as any);

      const response = await this.makeRequest(`/live-classes/${liveClassId}/thumbnail`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.thumbnailUrl;
    } catch (error) {
      errorHandler.handleError('Error uploading live class thumbnail:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async joinLiveClass(liveClassId: string): Promise<{ joinLink?: string; meetingLink?: string; message?: string }> {
    try {
      const response = await this.makeRequest(`/live-classes/${liveClassId}/join`, {
        method: 'POST'
      });
      // Backend mobile route currently returns { success, data: { joinLink, message } }
      // Normalize to an object containing joinLink/meetingLink regardless of structure.
      if (response?.data) {
        return {
          joinLink: response.data.joinLink || response.data.meetingLink,
          meetingLink: response.data.meetingLink || response.data.joinLink,
          message: response.data.message || response.message
        };
      }

      return {
        joinLink: response?.joinLink,
        meetingLink: response?.meetingLink,
        message: response?.message
      };
    } catch (error) {
      errorHandler.handleError('Error joining live class:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async enrollInLiveClass(liveClassId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${liveClassId}/enroll`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error enrolling in live class:', error);
      throw ErrorHandler.handleApiError(error);
    }
=======
  // Admin methods (will return errors since database is disabled)
  async createLiveClass(liveClassData: CreateLiveClassData): Promise<any> {
    throw new Error('Live class creation is not available. Database functionality has been removed.');
  }

  async updateLiveClass(id: string, liveClassData: UpdateLiveClassData): Promise<any> {
    throw new Error('Live class update is not available. Database functionality has been removed.');
  }

  async deleteLiveClass(id: string): Promise<void> {
    throw new Error('Live class deletion is not available. Database functionality has been removed.');
  }

  async uploadLiveClassThumbnail(liveClassId: string, imageUri: string): Promise<string> {
    throw new Error('Live class thumbnail upload is not available. Database functionality has been removed.');
  }

  async joinLiveClass(liveClassId: string): Promise<string> {
    throw new Error('Live class joining is not available. Database functionality has been removed.');
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  }
}

export const liveClassService = new LiveClassService();
<<<<<<< HEAD
export default liveClassService;

// Export LiveClass type for use in components
export type LiveClass = BaseLiveClassData & {
  _id?: string;
  id?: string;
  Id?: string;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  level?: LiveClassLevel;
  scheduled_at?: string;
  startTime?: string;
  duration?: number;
  max_students?: number;
  enrolled_students?: number;
  meetingLink?: string;
  thumbnail_url?: string;
  price?: number;
  original_price?: number;
  status?: LiveClassStatus;
  subject?: string;
  class?: string;
  topics?: string[];
  prerequisites?: string;
  materials?: string;
  notes?: string;
  recording_url?: string;
  isAvailable?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
=======
export default liveClassService;
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
