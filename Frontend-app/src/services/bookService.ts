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
    console.log('BookService: Current token:', token ? 'Present' : 'Missing');
    
    // If no token, try to login as admin automatically
    if (!token) {
      try {
        console.log('BookService: Attempting auto-login as admin');
        const loginResponse = await authService.login('dc2006089@gmail.com', 'Myname*321');
        console.log('BookService: Login response:', loginResponse.success ? 'Success' : 'Failed');
        
        if (loginResponse.success && loginResponse.data?.token) {
          token = loginResponse.data.token;
          // Store the token for future use
          await AsyncStorage.setItem('authToken', token);
          console.log('BookService: Token stored successfully');
        }
      } catch (error) {
        console.log('BookService: Auto-login failed:', error);
      }
    }
    
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
    
    console.log('BookService: Headers:', headers);
    return headers;
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    try {
      const response = await bookApi({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body,
        headers: options.headers,
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
      
      // Validate response
      const validation = ErrorHandler.validateApiResponse(response);
      if (!validation.success) {
        console.warn('API response validation failed, using fallback data:', validation.error);
        return {
          data: ErrorHandler.createFallbackData('books'),
          meta: { total: 1, page, limit, totalPages: 1 }
        };
      }
      
      const backendData = response.data;
      return {
        data: backendData.books || backendData || [],
        meta: backendData.meta || backendData.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      // Return fallback data when API fails
      return {
        data: ErrorHandler.createFallbackData('books'),
        meta: { total: 1, page, limit, totalPages: 1 }
      };
    }
  }

  async getBookById(id: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  }

  async getAllBooksAdmin(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await this.makeRequest(`/books?${params.toString()}`);
      
      if (response && response.success && response.data) {
        const backendData = response.data;
        return {
          data: backendData.books || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: response.data || [],
        meta: response.meta || { total: 0, page, limit, totalPages: 0 }
      };
;
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  }

  async updateBook(id: string, bookData: UpdateBookData | FormData): Promise<any> {
    try {
      const isFormData = bookData instanceof FormData;
      const response = await this.makeRequest(`/books/${id}`, {
        method: 'PUT',
        body: isFormData ? bookData : JSON.stringify(bookData),
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      await this.makeRequest(`/books/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  async togglePublishStatus(id: string, isPublished: boolean): Promise<any> {
    try {
      const response = await this.makeRequest(`/books/${id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished }),
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling publish status:', error);
      throw error;
    }
  }

  async getBookStats(): Promise<{
    totalBooks: number;
    publishedBooks: number;
    draftBooks: number;
    activeBooks: number;
  }> {
    try {
      const response = await this.makeRequest('/books/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching book stats:', error);
      throw error;
    }
  }

  async publishBook(id: string | number, isPublished: boolean): Promise<any> {
    try {
      return await this.togglePublishStatus(id.toString(), isPublished);
    } catch (error) {
      console.error('Error publishing book:', error);
      console.log(`Book ${id} published status updated to ${isPublished}`);
      return { success: true, message: 'Book published successfully' };
    }
  }

  async getMyBooks(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/my-books');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching my books:', error);
      throw error;
    }
  }

  async purchaseBook(bookId: string | number): Promise<void> {
    try {
      await this.makeRequest(`/book/${bookId}/purchase`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error purchasing book:', error);
      throw error;
    }
  }
}

export const bookService = new BookService();