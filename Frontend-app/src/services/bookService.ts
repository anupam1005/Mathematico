import axios from 'axios';
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BookLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
export type BookStatus = 'draft' | 'active' | 'archived';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BaseBookData {
  title: string;
  description?: string;
  author?: string;
  publisher?: string;
  category?: string;
  subject?: string;
  class?: string;
  level?: BookLevel;
  coverImageUrl?: string;
  pdfUrl?: string;
  pages?: number;
  isbn?: string;
  tags?: string[];
  tableOfContents?: string;
  summary?: string;
}

export interface CreateBookData extends BaseBookData {
  status?: BookStatus;
}

export interface UpdateBookData extends Partial<BaseBookData> {
  status?: BookStatus;
  isPublished?: boolean;
  isFeatured?: boolean;
}

// Create axios instance for book endpoints
const bookApi = axios.create({
  baseURL: API_CONFIG.mobile,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
bookApi.interceptors.request.use(
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
bookApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          console.log('BookService: Token refreshed successfully, retrying request...');
          // Retry the request with new token
          return bookApi(originalRequest);
        } else {
          console.log('BookService: Token refresh failed, clearing tokens...');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      } catch (refreshError) {
        console.error('BookService: Token refresh error:', refreshError);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

class BookService {
  private async getAuthHeaders() {
    let token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    try {
      const response = await bookApi({
        url: endpoint,
        ...options,
      });
      return response.data;
    } catch (error) {
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getBooks(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    subject?: string;
    level?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.subject) params.append('subject', filters.subject);
      if (filters?.level) params.append('level', filters.level);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await this.makeRequest(`/books?${params.toString()}`);
      
      // Return the actual data from the API
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: response.data.length, page, limit, totalPages: 1 }
        };
      }
      
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      // Return empty data when API fails
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getBookById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getFeaturedBooks(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.books || [];
    } catch (error) {
      console.error('Error fetching featured books:', error);
      return [];
    }
  }

  async searchBooks(query: string, filters?: {
    category?: string;
    level?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ search: query });
      if (filters?.category) params.append('category', filters.category);
      if (filters?.level) params.append('level', filters.level);
      
      const response = await this.makeRequest(`/books?${params.toString()}`);
      
      // Since database is disabled, always return empty data
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error searching books:', error);
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    }
  }

  async getBooksByCategory(category: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getBooks(page, limit, { category });
      return response;
    } catch (error) {
      console.error('Error fetching books by category:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getBooksByLevel(level: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.getBooks(page, limit, { level });
      return response;
    } catch (error) {
      console.error('Error fetching books by level:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  // Admin methods (will return errors since database is disabled)
  async createBook(bookData: CreateBookData): Promise<any> {
    throw new Error('Book creation is not available. Database functionality has been removed.');
  }

  async updateBook(id: string, bookData: UpdateBookData): Promise<any> {
    throw new Error('Book update is not available. Database functionality has been removed.');
  }

  async deleteBook(id: string): Promise<void> {
    throw new Error('Book deletion is not available. Database functionality has been removed.');
  }

  async uploadBookCover(bookId: string, imageUri: string): Promise<string> {
    throw new Error('Book cover upload is not available. Database functionality has been removed.');
  }

  async uploadBookPdf(bookId: string, pdfUri: string): Promise<string> {
    throw new Error('Book PDF upload is not available. Database functionality has been removed.');
  }
}

export const bookService = new BookService();
export default bookService;