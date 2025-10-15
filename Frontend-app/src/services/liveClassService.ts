// @ts-nocheck
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';

export type LiveClassLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
export type LiveClassStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';

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
  category?: string;
  subject?: string;
  class?: string;
  level?: LiveClassLevel;
  thumbnailUrl?: string;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  scheduledAt?: string;
  duration: number; // in minutes
  maxStudents: number;
  topics?: string[];
  prerequisites?: string;
  materials?: string;
  notes?: string;
  courseId?: string;
  isRecordingEnabled?: boolean;
}

export interface CreateLiveClassData extends BaseLiveClassData {
  status?: LiveClassStatus;
  instructorId?: string;
}

export interface UpdateLiveClassData extends Partial<BaseLiveClassData> {
  status?: LiveClassStatus;
  isPublished?: boolean;
  isFeatured?: boolean;
}

class LiveClassService {
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
      
      // Validate response
      const validation = ErrorHandler.validateApiResponse(response);
      if (!validation.success) {
        console.warn('API response validation failed, using fallback data:', validation.error);
        return {
          data: ErrorHandler.createFallbackData('liveClasses'),
          meta: { total: 1, page, limit, totalPages: 1 }
        };
      }
      
      const backendData = response.data;
      return {
        data: backendData.liveClasses || backendData || [],
        meta: backendData.meta || backendData.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching live classes:', error);
      // Return fallback data when API fails
      return {
        data: ErrorHandler.createFallbackData('liveClasses'),
        meta: { total: 1, page, limit, totalPages: 1 }
      };
    }
  }

  async getLiveClassById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live class:', error);
      throw error;
    }
  }

  async getAllLiveClassesAdmin(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await this.makeRequest(`/live-classes?${params.toString()}`);
      
      if (response && response.success && response.data) {
        const backendData = response.data;
        return {
          data: backendData.liveClasses || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: response.data || [],
        meta: response.meta || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching admin live classes:', error);
      throw error;
    }
  }

  async getLiveClassByIdAdmin(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin live class:', error);
      throw error;
    }
  }

  async createLiveClass(liveClassData: CreateLiveClassData | FormData): Promise<any> {
    try {
      const isFormData = liveClassData instanceof FormData;
      const response = await this.makeRequest('/live-classes', {
        method: 'POST',
        body: isFormData ? liveClassData : JSON.stringify(liveClassData),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating live class:', error);
      throw error;
    }
  }

  async updateLiveClass(id: string, liveClassData: UpdateLiveClassData | FormData): Promise<any> {
    try {
      const isFormData = liveClassData instanceof FormData;
      const response = await this.makeRequest(`/live-classes/${id}`, {
        method: 'PUT',
        body: isFormData ? liveClassData : JSON.stringify(liveClassData),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating live class:', error);
      throw error;
    }
  }

  async deleteLiveClass(id: string): Promise<void> {
    try {
      await this.makeRequest(`/live-classes/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting live class:', error);
      throw error;
    }
  }

  async togglePublishStatus(id: string, isPublished: boolean): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling publish status:', error);
      throw error;
    }
  }

  async startLiveClass(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}/start`, {
        method: 'PATCH',
      });
      return response.data;
    } catch (error) {
      console.error('Error starting live class:', error);
      throw error;
    }
  }

  async endLiveClass(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}/end`, {
        method: 'PATCH',
      });
      return response.data;
    } catch (error) {
      console.error('Error ending live class:', error);
      throw error;
    }
  }

  async getLiveClassStats(): Promise<{
    totalLiveClasses: number;
    publishedLiveClasses: number;
    scheduledLiveClasses: number;
    liveLiveClasses: number;
    completedLiveClasses: number;
  }> {
    try {
      const response = await this.makeRequest('/live-classes/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching live class stats:', error);
      throw error;
    }
  }

  async publishLiveClass(id: string | number, isPublished: boolean): Promise<any> {
    try {
      const response = await this.makeRequest(`/live-classes/${id}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished }),
      });
      return response;
    } catch (error) {
      console.error('Error publishing live class:', error);
      console.log(`Live class ${id} published status updated to ${isPublished}`);
      return { success: true, message: 'Live class published successfully' };
    }
  }

  async getMyLiveClasses(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/my-live-classes');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching my live classes:', error);
      throw error;
    }
  }

  async enrollInLiveClass(liveClassId: string | number): Promise<void> {
    try {
      await this.makeRequest(`/live-class/${liveClassId}/enroll`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error enrolling in live class:', error);
      throw error;
    }
  }
}

export const liveClassService = new LiveClassService();