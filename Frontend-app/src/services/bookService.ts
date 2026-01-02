<<<<<<< HEAD
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
=======
import axios from 'axios';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import authService from './authService';
import { API_CONFIG } from '../config';
import ErrorHandler from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

<<<<<<< HEAD
// Create a service error handler for bookService
const errorHandler = createServiceErrorHandler('bookService');

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
  baseURL: API_CONFIG.mobile, // This will be updated dynamically
=======
  baseURL: API_CONFIG.mobile,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

<<<<<<< HEAD
// Update the base URL dynamically
(async () => {
  try {
    bookApi.defaults.baseURL = API_CONFIG.mobile;
    console.log('BookService: Base URL updated to:', bookApi.defaults.baseURL);
  } catch (error) {
    console.error('BookService: Failed to update base URL:', error);
  }
})();

// Request interceptor to add auth token
bookApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
=======
// Request interceptor to add auth token
bookApi.interceptors.request.use(
  async (config) => {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    const token = await authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
<<<<<<< HEAD
  (error: AxiosError) => {
=======
  (error) => {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
bookApi.interceptors.response.use(
<<<<<<< HEAD
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as InternalAxiosRequestConfig & { _retry?: boolean };
=======
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    
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
<<<<<<< HEAD
        errorHandler.handleError('BookService: Token refresh error:', refreshError);
=======
        console.error('BookService: Token refresh error:', refreshError);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      // Use API_CONFIG directly
      const fullUrl = `${API_CONFIG.mobile}${endpoint}`;
      
      console.log('BookService: Making request to:', fullUrl);
      
      const response = await bookApi({
        url: endpoint,
        baseURL: API_CONFIG.mobile,
=======
      const response = await bookApi({
        url: endpoint,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        ...options,
      });
      return response.data;
    } catch (error) {
<<<<<<< HEAD
      console.error('BookService: Request failed:', error);
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
      
<<<<<<< HEAD
      // Return the actual data from the API
      if (response && response.data) {
        return {
          data: response.data,
          meta: response.pagination || { total: response.data.length, page, limit, totalPages: 1 }
        };
      }
      
=======
      // Since database is disabled, always return empty data
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching books:', error);
=======
      console.error('Error fetching books:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      // Return empty data when API fails
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getBookById(id: string): Promise<any> {
    try {
<<<<<<< HEAD
      console.log('BookService: Fetching book with ID:', id);
      const response = await this.makeRequest(`/books/${id}`);
      console.log('BookService: Book fetched successfully');
      return response;
    } catch (error) {
      console.error('BookService: Error fetching book:', error);
      errorHandler.handleError('Error fetching book:', error);
      
      // Return a fallback book object instead of throwing
      return {
        id: id,
        title: 'Book not found',
        description: 'This book could not be loaded. Please try again later.',
        author: 'Unknown',
        pages: 0,
        downloads: 0,
        level: 'Unknown Level',
        category: 'general'
      };
=======
      const response = await this.makeRequest(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw ErrorHandler.handleApiError(error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    }
  }

  async getFeaturedBooks(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/featured');
      return response.data?.books || [];
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching featured books:', error);
=======
      console.error('Error fetching featured books:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error searching books:', error);
=======
      console.error('Error searching books:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching books by category:', error);
=======
      console.error('Error fetching books by category:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching books by level:', error);
=======
      console.error('Error fetching books by level:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  }
}

export const bookService = new BookService();
<<<<<<< HEAD
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
=======
export default bookService;
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
