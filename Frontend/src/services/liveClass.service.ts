import api from '@/lib/api';
import { LiveClass } from '@/types';
import { toast } from 'sonner';

// Use relative URLs since the API base URL already includes /api/v1
const LIVE_CLASSES_ENDPOINT = '/live-classes';
const ADMIN_ENDPOINT = '/admin/live-classes';

// Types
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

// Helper function to handle API errors
const handleApiError = (error: unknown, context: string): never => {
  console.error(`Error in liveClassService.${context}:`, error);
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : `Failed to ${context}`;
  toast.error(errorMessage);
  throw new Error(errorMessage);
};

export const liveClassService = {
  /**
   * Get all published live classes with pagination (for students)
   */
  async getLiveClasses(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    subject?: string;
    level?: string;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<LiveClass>> {
    try {
      const params: Record<string, any> = { page, limit, _t: Date.now() };
      if (filters?.category) params.category = filters.category;
      if (filters?.subject) params.subject = filters.subject;
      if (filters?.level) params.level = filters.level;
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      
      const response = await api.get(LIVE_CLASSES_ENDPOINT, { 
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Handle backend response format (using sendResponse utility)
      if (response.data && response.data.success && response.data.data) {
        // Backend returns data in format: { success: true, data: { liveClasses: [...], meta: {...} } }
        const backendData = response.data.data;
        return {
          data: backendData.liveClasses || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: response.data.liveClasses || response.data || [],
        meta: response.data.meta || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching live classes:', error);
      toast.error('Failed to fetch live classes. Please try again.');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  /**
   * Get a single live class by ID (for students)
   */
  async getLiveClassById(id: string): Promise<LiveClass> {
    try {
      console.log('🔍 Service: Fetching live class with ID:', id);
      const response = await api.get(`${LIVE_CLASSES_ENDPOINT}/${id}?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('📊 Service: Full response:', response);
      console.log('📋 Service: Response data:', response.data);
      console.log('📋 Service: Response data keys:', response.data ? Object.keys(response.data) : 'null');
      console.log('📋 Service: Response data.data.liveClass:', response.data?.data?.liveClass);
      console.log('📋 Service: Response data structure:', JSON.stringify(response.data, null, 2));
      
      if (!response.data) {
        throw new Error('Invalid live class data received from server');
      }
      
      if (!response.data.data?.liveClass) {
        throw new Error('Live class data not found in response');
      }
      
      console.log('✅ Service: Returning live class:', response.data.data.liveClass);
      return response.data.data.liveClass;
    } catch (error) {
      console.error('❌ Service: Error in getLiveClassById:', error);
      return handleApiError(error, `fetch live class with ID ${id}`);
    }
  },

  /**
   * Get all live classes (admin only)
   */
  async getAllLiveClassesAdmin(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<LiveClass>> {
    try {
      // Debug authentication state
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      console.log('🔐 Live Class Service - Authentication Debug:', {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
        endpoint: ADMIN_ENDPOINT,
        page,
        limit,
        filters
      });

      const params: Record<string, any> = { page, limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.category) params.category = filters.category;
      if (filters?.search) params.search = filters.search;
      
      const response = await api.get(ADMIN_ENDPOINT, { 
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('✅ Live Class Service - Admin response received:', response.data);
      
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Handle backend response format (using sendResponse utility)
      if (response.data && response.data.success && response.data.data) {
        // Backend returns data in format: { success: true, data: { liveClasses: [...], meta: {...} } }
        const backendData = response.data.data;
        return {
          data: backendData.liveClasses || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: response.data.liveClasses || response.data || [],
        meta: response.data.meta || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error: any) {
      console.error('❌ Error fetching admin live classes:', error);
      
      // Enhanced error handling for authentication issues
      if (error.response?.status === 401) {
        console.error('🔐 Authentication failed - Token may be expired or invalid');
        toast.error('Please log in again to access live classes');
        
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        
        // Dispatch auth state change event
        window.dispatchEvent(new Event('authStateChanged'));
        
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.error('🚫 Access denied - Admin privileges required');
        toast.error('Admin access required to view live classes');
      } else {
        toast.error('Failed to fetch live classes. Please try again.');
      }
      
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  /**
   * Get a single live class by ID (admin version)
   */
  async getLiveClassByIdAdmin(id: string): Promise<LiveClass> {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid live class data received from server');
      }
      
      return response.data.liveClass;
    } catch (error) {
      return handleApiError(error, `fetch live class with ID ${id}`);
    }
  },

  /**
   * Create a new live class (admin only)
   */
  async createLiveClass(liveClassData: CreateLiveClassData | FormData): Promise<LiveClass> {
    try {
      const isFormData = liveClassData instanceof FormData;
      const headers = isFormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' };
      
      const response = await api.post(ADMIN_ENDPOINT, liveClassData, { headers });
      
      if (response.data && response.data.success && response.data.data) {
        toast.success('Live class created successfully');
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'create live class');
    }
  },

  /**
   * Update an existing live class (admin only)
   */
  async updateLiveClass(id: string, liveClassData: UpdateLiveClassData | FormData): Promise<LiveClass> {
    try {
      const isFormData = liveClassData instanceof FormData;
      const headers = isFormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' };
      
      const response = await api.put(`${ADMIN_ENDPOINT}/${id}`, liveClassData, { headers });
      
      if (response.data && response.data.success && response.data.data) {
        toast.success('Live class updated successfully');
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'update live class');
    }
  },

  /**
   * Delete a live class (admin only)
   */
  async deleteLiveClass(id: string): Promise<void> {
    try {
      await api.delete(`${ADMIN_ENDPOINT}/${id}`);
      toast.success('Live class deleted successfully');
    } catch (error) {
      handleApiError(error, 'delete live class');
    }
  },

  /**
   * Publish/Unpublish a live class (admin only)
   */
  async togglePublishStatus(id: string, isPublished: boolean): Promise<LiveClass> {
    try {
      const response = await api.patch(`${ADMIN_ENDPOINT}/${id}/publish`, { isPublished });
      const message = isPublished ? 'Live class published successfully' : 'Live class unpublished successfully';
      toast.success(message);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'toggle live class publish status');
    }
  },

  /**
   * Start a live class (admin/instructor only)
   */
  async startLiveClass(id: string): Promise<LiveClass> {
    try {
      const response = await api.patch(`${ADMIN_ENDPOINT}/${id}/start`);
      toast.success('Live class started successfully');
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'start live class');
    }
  },

  /**
   * End a live class (admin/instructor only)
   */
  async endLiveClass(id: string): Promise<LiveClass> {
    try {
      const response = await api.patch(`${ADMIN_ENDPOINT}/${id}/end`);
      toast.success('Live class ended successfully');
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'end live class');
    }
  },

  /**
   * Get live class statistics (admin only)
   */
  async getLiveClassStats(): Promise<{
    totalLiveClasses: number;
    publishedLiveClasses: number;
    scheduledLiveClasses: number;
    liveLiveClasses: number;
    completedLiveClasses: number;
  }> {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/stats/overview`);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data.stats;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'fetch live class statistics');
    }
  }
};
