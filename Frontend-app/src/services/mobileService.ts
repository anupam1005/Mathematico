import axios from 'axios';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { API_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a service error handler for mobileService
const errorHandler = createServiceErrorHandler('mobileService');

// Create axios instance for mobile endpoints
const mobileApi = axios.create({
  baseURL: API_CONFIG.mobile, // This will be updated dynamically
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update the base URL dynamically
(async () => {
  try {
    const backendUrl = API_CONFIG.mobile.replace(/\/$/, '');
    mobileApi.defaults.baseURL = `${backendUrl}/api/v1/mobile`;
    console.log('MobileService: Base URL updated to:', mobileApi.defaults.baseURL);
  } catch (error) {
    console.error('MobileService: Failed to update base URL:', error);
  }
})();

// Request interceptor to add auth token
mobileApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
mobileApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear invalid tokens
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

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
}

export interface Categories {
  books: string[];
  courses: string[];
  liveClasses: string[];
}

class MobileService {
  async getBooks(page: number = 1, limit: number = 10): Promise<MobileApiResponse<any[]>> {
    try {
      const response = await mobileApi.get(`/books?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching books:', error);
      return {
        success: true,
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        timestamp: new Date().toISOString()
      };
    }
  }

  async getCourses(page: number = 1, limit: number = 10): Promise<MobileApiResponse<any[]>> {
    try {
      const response = await mobileApi.get(`/courses?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching courses:', error);
      return {
        success: true,
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        timestamp: new Date().toISOString()
      };
    }
  }

  async getLiveClasses(page: number = 1, limit: number = 10): Promise<MobileApiResponse<any[]>> {
    try {
      const response = await mobileApi.get(`/live-classes?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching live classes:', error);
      return {
        success: true,
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        timestamp: new Date().toISOString()
      };
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
      errorHandler.handleError('Error fetching featured content:', error);
      return {
        success: true,
        data: {
          books: [],
          courses: [],
          liveClasses: []
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  async getCategories(): Promise<MobileApiResponse<Categories>> {
    try {
      const response = await mobileApi.get('/categories');
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching categories:', error);
      return {
        success: true,
        data: {
          books: [],
          courses: [],
          liveClasses: []
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  async searchContent(query: string, type?: string): Promise<MobileApiResponse<any[]>> {
    try {
      const params = new URLSearchParams({ query });
      if (type) params.append('type', type);
      
      const response = await mobileApi.get(`/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error searching content:', error);
      return {
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  async getBookById(id: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get(`/books/${id}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching book:', error);
      throw error;
    }
  }

  async getCourseById(id: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get(`/courses/${id}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching course:', error);
      throw error;
    }
  }

  async getLiveClassById(id: string): Promise<MobileApiResponse<any>> {
    try {
      const response = await mobileApi.get(`/live-classes/${id}`);
      return response.data;
    } catch (error) {
      errorHandler.handleError('Error fetching live class:', error);
      throw error;
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
      errorHandler.handleError('Error fetching mobile info:', error);
      return {
        success: true,
        data: {
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
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const mobileService = new MobileService();
export default mobileService;