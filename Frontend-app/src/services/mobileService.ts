import axios from 'axios';
import { API_CONFIG } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance for mobile endpoints
const mobileApi = axios.create({
  baseURL: API_CONFIG.mobile,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
}

export interface Book {
  _id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  coverImageUrl: string;
  pdfUrl: string;
  pages: number;
  isbn: string;
  status: string;
  is_featured: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  thumbnailUrl: string;
  duration: number;
  level: string;
  price: number;
  status: string;
  is_featured: boolean;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
}

export interface LiveClass {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  thumbnailUrl: string;
  startTime: string;
  endTime: string;
  status: string;
  is_featured: boolean;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeaturedContent {
  books: Book[];
  courses: Course[];
  liveClasses: LiveClass[];
}

export interface Categories {
  books: string[];
  courses: string[];
  liveClasses: string[];
}

const mobileService = {
  // Health check
  async getHealth(): Promise<MobileApiResponse<{ message: string; database: string }>> {
    try {
      const response = await mobileApi.get('/health');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Health check failed');
    }
  },

  // Books
  async getBooks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<MobileApiResponse<Book[]>> {
    try {
      const response = await mobileApi.get('/books', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch books');
    }
  },

  async getBookById(id: string): Promise<MobileApiResponse<Book>> {
    try {
      const response = await mobileApi.get(`/books/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch book');
    }
  },

  // Courses
  async getCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<MobileApiResponse<Course[]>> {
    try {
      const response = await mobileApi.get('/courses', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch courses');
    }
  },

  async getCourseById(id: string): Promise<MobileApiResponse<Course>> {
    try {
      const response = await mobileApi.get(`/courses/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch course');
    }
  },

  // Live Classes
  async getLiveClasses(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<MobileApiResponse<LiveClass[]>> {
    try {
      const response = await mobileApi.get('/live-classes', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live classes');
    }
  },

  async getLiveClassById(id: string): Promise<MobileApiResponse<LiveClass>> {
    try {
      const response = await mobileApi.get(`/live-classes/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live class');
    }
  },

  // Search
  async searchContent(params: {
    q: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<MobileApiResponse<{
    books: Book[];
    courses: Course[];
    liveClasses: LiveClass[];
  }>> {
    try {
      const response = await mobileApi.get('/search', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  },

  // Featured content
  async getFeaturedContent(): Promise<MobileApiResponse<FeaturedContent>> {
    try {
      const response = await mobileApi.get('/featured');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch featured content');
    }
  },

  // Categories
  async getCategories(): Promise<MobileApiResponse<Categories>> {
    try {
      const response = await mobileApi.get('/categories');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },
};

export default mobileService;
