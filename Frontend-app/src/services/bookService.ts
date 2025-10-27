import axios from 'axios';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a service error handler for bookService
const errorHandler = createServiceErrorHandler('bookService');

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
        errorHandler.handleError('BookService: Token refresh error:', refreshError);
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
      errorHandler.handleError('Error fetching books:', error);
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
      return response;
    } catch (error) {
      errorHandler.handleError('Error fetching book:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async getFeaturedBooks(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.books || [];
    } catch (error) {
      errorHandler.handleError('Error fetching featured books:', error);
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
      errorHandler.handleError('Error searching books:', error);
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
      errorHandler.handleError('Error fetching books by category:', error);
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
      errorHandler.handleError('Error fetching books by level:', error);
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  // Admin methods
  async createBook(bookData: CreateBookData): Promise<any> {
    try {
      const response = await this.makeRequest('/books', {
        method: 'POST',
        data: bookData
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error creating book:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async updateBook(id: string, bookData: UpdateBookData): Promise<any> {
    try {
      const response = await this.makeRequest(`/books/${id}`, {
        method: 'PUT',
        data: bookData
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error updating book:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      await this.makeRequest(`/books/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      errorHandler.handleError('Error deleting book:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async uploadBookCover(bookId: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('cover', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'cover.jpg',
      } as any);

      const response = await this.makeRequest(`/books/${bookId}/cover`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.coverImageUrl;
    } catch (error) {
      errorHandler.handleError('Error uploading book cover:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async uploadBookPdf(bookId: string, pdfUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('pdf', {
        uri: pdfUri,
        type: 'application/pdf',
        name: 'book.pdf',
      } as any);

      const response = await this.makeRequest(`/books/${bookId}/pdf`, {
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.pdfUrl;
    } catch (error) {
      errorHandler.handleError('Error uploading book PDF:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }

  async downloadBook(bookId: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/books/${bookId}/download`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      errorHandler.handleError('Error downloading book:', error);
      throw ErrorHandler.handleApiError(error);
    }
  }
}

export const bookService = new BookService();
export default bookService;

// Export Book type for use in components
export type Book = BaseBookData & {
  _id?: string;
  id?: string;
  Id?: string;
  title: string;
  author?: string;
  publisher?: string;
  category?: string;
  subject?: string;
  class?: string;
  level?: BookLevel;
  cover_image_url?: string;
  pdfFile?: string;
  pages?: number;
  downloads?: number;
  downloadCount?: number;
  isbn?: string;
  tags?: string[];
  table_of_contents?: string;
  summary?: string;
  description?: string;
  status?: BookStatus;
  isAvailable?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};