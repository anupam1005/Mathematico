import axios from 'axios';
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  baseURL: API_CONFIG.mobile,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
liveClassApi.interceptors.request.use(
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
liveClassApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
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
        console.error('LiveClassService: Token refresh error:', refreshError);
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
      const response = await liveClassApi({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getLiveClasses(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    subject?: string;
    level?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await this.makeRequest(`/live-classes?${params.toString()}`);
      
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
      console.error('Error fetching live classes:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getLiveClassById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}`);
      
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
      console.error('Error fetching live class:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to fetch live class'
      };
    }
  }

  async getFeaturedLiveClasses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.liveClasses || [];
    } catch (error) {
      console.error('Error fetching featured live classes:', error);
      return [];
    }
  }

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
      console.error('Error starting live class:', error);
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
      console.error('Error ending live class:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to end live class'
      };
    }
  }

  async getUpcomingLiveClasses(page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getLiveClasses(page, limit, { status: 'scheduled' });
      return response;
    } catch (error) {
      console.error('Error fetching upcoming live classes:', error);
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
      
      // Since database is disabled, always return empty data
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error searching live classes:', error);
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
      console.error('Error fetching live classes by category:', error);
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
      console.error('Error fetching live classes by level:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

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
  }

  async enrollInLiveClass(liveClassId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${liveClassId}/enroll`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error enrolling in live class:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }
}

export const liveClassService = new LiveClassService();
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