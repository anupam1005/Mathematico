import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { API_PATHS } from '../constants/apiPaths';

import { withBasePath } from './apiClient';
import { createSafeError } from '../utils/safeError';
import type { ApiError } from '../utils/errorHandler';

// Create a service error handler for mobileService
const errorHandler = createServiceErrorHandler('mobileService');

const mobileApi = withBasePath(API_PATHS.mobile);

export interface MobileApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
  fallback?: boolean;
  error?: ApiError;
}

export interface Categories {
  books: string[];
  courses: string[];
  liveClasses: string[];
}

class MobileService {
  private createFailureResponse<T>(data: T, message: string, code: string = 'NETWORK_ERROR'): MobileApiResponse<T> {
    return {
      success: false,
      data,
      timestamp: new Date().toISOString(),
      fallback: true,
      error: {
        message,
        code,
      },
    };
  }

  async getBooks(page: number = 1, limit: number = 10): Promise<MobileApiResponse<any[]>> {
    try {
      const response = await mobileApi.get(`/books?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching books:', safeError);
      return this.createFailureResponse([], safeError.message || 'Failed to fetch books');
    }
  }

  async getCourses(page: number = 1, limit: number = 10): Promise<MobileApiResponse<any[]>> {
    try {
      const response = await mobileApi.get(`/courses?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching courses:', safeError);
      return this.createFailureResponse([], safeError.message || 'Failed to fetch courses');
    }
  }

  async getLiveClasses(page: number = 1, limit: number = 10): Promise<MobileApiResponse<any[]>> {
    try {
      const response = await mobileApi.get(`/live-classes?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching live classes:', safeError);
      return this.createFailureResponse([], safeError.message || 'Failed to fetch live classes');
    }
  }

  async getFeaturedContent(): Promise<MobileApiResponse<{
    books: any[];
    courses: any[];
    liveClasses: any[];
  }>> {
    try {
      const response = await mobileApi.get('/featured');
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching featured content:', safeError);
      return this.createFailureResponse({
        books: [],
        courses: [],
        liveClasses: []
      }, safeError.message || 'Failed to fetch featured content');
    }
  }

  async getCategories(): Promise<MobileApiResponse<Categories>> {
    try {
      const response = await mobileApi.get('/categories');
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching categories:', safeError);
      return this.createFailureResponse({
        books: [],
        courses: [],
        liveClasses: []
      }, safeError.message || 'Failed to fetch categories');
    }
  }

  async searchContent(query: string, type?: string): Promise<MobileApiResponse<any[]>> {
    try {
      const params = new URLSearchParams({ query });
      if (type) params.append('type', type);
      
      const response = await mobileApi.get(`/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error searching content:', safeError);
      return this.createFailureResponse([], safeError.message || 'Failed to search content');
    }
  }

  async getBookById(id: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get(`/books/${id}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching book:', safeError);
      return this.createFailureResponse(null, safeError.message || 'Failed to fetch book');
    }
  }

  async getCourseById(id: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get(`/courses/${id}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching course:', safeError);
      return this.createFailureResponse(null, safeError.message || 'Failed to fetch course');
    }
  }

  async getLiveClassById(id: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get(`/live-classes/${id}`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching live class:', safeError);
      return this.createFailureResponse(null, safeError.message || 'Failed to fetch live class');
    }
  }

  async getMobileInfo(): Promise<MobileApiResponse<{
    appName: string;
    version: string;
    database: string;
    features: {
      books: boolean;
      courses: boolean;
      liveClasses: boolean;
      userRegistration: boolean;
      userProfiles: boolean;
    };
    message: string;
  }>> {
    try {
      const response = await mobileApi.get('/info');
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching mobile info:', safeError);
      return this.createFailureResponse({
        appName: 'Mathematico',
        version: '2.0.0',
        database: 'disabled',
        features: {
          books: false,
          courses: false,
          liveClasses: false,
          userRegistration: false,
          userProfiles: false
        },
        message: 'Database functionality has been removed. Only admin authentication is available.'
      }, safeError.message || 'Failed to fetch mobile info');
    }
  }

  async getStats(): Promise<MobileApiResponse<{
    totalBooks: number;
    totalCourses: number;
    totalLiveClasses: number;
    totalStudents: number;
    activeUsers: number;
  }>> {
    try {
      const response = await mobileApi.get('/stats');
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching stats:', safeError);
      return this.createFailureResponse({
        totalBooks: 0,
        totalCourses: 0,
        totalLiveClasses: 0,
        totalStudents: 0,
        activeUsers: 0
      }, safeError.message || 'Failed to fetch stats');
    }
  }

  async getSettings(): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get('/settings');
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching settings:', safeError);
      return this.createFailureResponse({
        pushNotifications: true,
        emailNotifications: true,
        courseUpdates: true,
        liveClassReminders: true,
        darkMode: false,
        autoPlayVideos: true,
        downloadQuality: 'High',
        language: 'en',
        timezone: 'UTC',
        theme: 'light'
      }, safeError.message || 'Failed to fetch settings');
    }
  }

  async updateSettings(settings: any): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.put('/settings', settings);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error updating settings:', safeError);
      return this.createFailureResponse(settings, safeError.message || 'Failed to update settings');
    }
  }

  async getSecurePdfViewer(bookId: string): Promise<MobileApiResponse<{
    viewerUrl: string;
    title: string;
    restrictions: {
      download: boolean;
      print: boolean;
      copy: boolean;
      screenshot: boolean;
    };
  }>> {
    try {
      const response = await mobileApi.get(`/books/${bookId}/viewer`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error fetching PDF viewer:', safeError);
      return this.createFailureResponse({
        viewerUrl: '',
        title: '',
        restrictions: {
          download: false,
          print: false,
          copy: false,
          screenshot: false,
        },
      }, safeError.message || 'Failed to load secure PDF viewer');
    }
  }

  async joinLiveClass(classId: string): Promise<MobileApiResponse<{
    joinLink: string;
    message: string;
  }>> {
    try {
      const response = await mobileApi.post(`/live-classes/${classId}/join`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error joining live class:', safeError);
      return this.createFailureResponse({
        joinLink: '',
        message: 'Live class unavailable',
      }, safeError.message || 'Failed to join live class');
    }
  }

  async startLiveClass(classId: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.put(`/live-classes/${classId}/start`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error starting live class:', safeError);
      return this.createFailureResponse(null, safeError.message || 'Failed to start live class');
    }
  }

  async endLiveClass(classId: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.put(`/live-classes/${classId}/end`);
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error ending live class:', safeError);
      return this.createFailureResponse(null, safeError.message || 'Failed to end live class');
    }
  }

  async checkHealth(): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get('/health');
      return response.data;
    } catch (error) {
      const safeError = createSafeError(error);
      errorHandler.handleError('Error checking health:', safeError);
      return this.createFailureResponse(null, safeError.message || 'Failed to check health');
      errorHandler.handleError('Error checking health:', error);
      return {
        success: false,
        data: null,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const mobileService = new MobileService();
export default mobileService;