import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { API_PATHS } from '../config';
import { withBasePath } from './apiClient';
import ErrorHandler from '../utils/errorHandler';

// Create a service error handler for liveClassService
const errorHandler = createServiceErrorHandler('liveClassService');

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

const mobileApi = withBasePath(API_PATHS.mobile);

class LiveClassService {
  private async makeRequest(endpoint: string, options: any = {}) {
    try {
      const response = await mobileApi.request({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('LiveClassService: Request failed');

      throw ErrorHandler.handleApiError(error);
    }
  }

  async getLiveClasses(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    subject?: string;
    level?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      
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
      errorHandler.handleError('Error fetching live classes:', error);
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
      errorHandler.handleError('Error fetching live class:', error);
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
      errorHandler.handleError('Error fetching featured live classes:', error);
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

  async getUpcomingLiveClasses(page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getLiveClasses(page, limit, { status: 'scheduled' });
      return response;
    } catch (error) {
      errorHandler.handleError('Error fetching upcoming live classes:', error);
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
      errorHandler.handleError('Error searching live classes:', error);
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
      errorHandler.handleError('Error fetching live classes by category:', error);
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
      errorHandler.handleError('Error fetching live classes by level:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

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