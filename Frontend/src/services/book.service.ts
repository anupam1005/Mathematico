import api from '@/lib/api';
import { Book } from '@/types';
import { toast } from 'sonner';

// API endpoints - using the correct backend routes
const BOOKS_ENDPOINT = '/books';
const ADMIN_ENDPOINT = '/admin/books';

// Types
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

// Helper function to handle API errors
const handleApiError = (error: unknown, context: string): never => {
  console.error(`Error in bookService.${context}:`, error);
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : `Failed to ${context}`;
  toast.error(errorMessage);
  throw new Error(errorMessage);
};

export const bookService = {
  /**
   * Get all published books with pagination (for students)
   */
  async getBooks(page: number = 1, limit: number = 10, filters?: {
    category?: string;
    subject?: string;
    level?: string;
    search?: string;
  }): Promise<PaginatedResponse<Book>> {
    try {
      const params: Record<string, any> = { page, limit };
      if (filters?.category) params.category = filters.category;
      if (filters?.subject) params.subject = filters.subject;
      if (filters?.level) params.level = filters.level;
      if (filters?.search) params.search = filters.search;
      
      const response = await api.get(BOOKS_ENDPOINT, { 
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
        // Backend returns data in format: { success: true, data: { books: [...], meta: {...} } }
        const backendData = response.data.data;
        return {
          data: backendData.books || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      // Fallback for other response formats
      return {
        data: response.data.books || response.data || [],
        meta: response.data.meta || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books. Please try again.');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  /**
   * Get a single book by ID (for students)
   */
  async getBookById(id: string): Promise<Book> {
    try {
      const response = await api.get(`${BOOKS_ENDPOINT}/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid book data received from server');
      }
      
      // Handle backend response format (using sendResponse utility)
      if (response.data && response.data.success && response.data.data) {
        return response.data.data.book;
      }
      
      // Fallback for other response formats
      return response.data.book || response.data;
    } catch (error) {
      return handleApiError(error, `fetch book with ID ${id}`);
    }
  },

  /**
   * Get all books (admin only)
   */
  async getAllBooksAdmin(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PaginatedResponse<Book>> {
    try {
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
      
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      
      console.log('Raw response data:', response.data);
      console.log('Response structure:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        dataKeys: response.data?.data ? Object.keys(response.data.data) : [],
        directBooks: !!response.data?.books
      });
      
      // Handle backend response format (using sendResponse utility)
      if (response.data && response.data.success && response.data.data) {
        // Backend returns data in format: { success: true, data: { books: [...], meta: {...} } }
        const backendData = response.data.data;
        console.log('Backend data structure:', backendData);
        
        const result = {
          data: backendData.books || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
        
        console.log('Processed result:', result);
        return result;
      }
      
      // Fallback for other response formats
      const fallbackResult = {
        data: response.data.books || response.data || [],
        meta: response.data.meta || { total: 0, page, limit, totalPages: 0 }
      };
      
      console.log('Fallback result:', fallbackResult);
      return fallbackResult;
    } catch (error) {
      console.error('Error fetching admin books:', error);
      toast.error('Failed to fetch books. Please try again.');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  /**
   * Get a single book by ID (admin version)
   */
  async getBookByIdAdmin(id: string): Promise<Book> {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid book data received from server');
      }
      
      return response.data.book;
    } catch (error) {
      return handleApiError(error, `fetch book with ID ${id}`);
    }
  },

  /**
   * Create a new book (admin only)
   */
  async createBook(bookData: CreateBookData | FormData): Promise<Book> {
    try {
      console.log('Creating book with data:', bookData);
      console.log('API endpoint:', ADMIN_ENDPOINT);
      
      const response = await api.post(ADMIN_ENDPOINT, bookData, {
        headers: {
          'Content-Type': bookData instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      });
      
      console.log('Book creation response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        toast.success('Book created successfully');
        return response.data.data;
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Book creation error:', error);
      return handleApiError(error, 'create book');
    }
  },

  /**
   * Update an existing book (admin only)
   */
  async updateBook(id: string, bookData: UpdateBookData | FormData): Promise<Book> {
    try {
      const response = await api.put(`${ADMIN_ENDPOINT}/${id}`, bookData, {
        headers: {
          'Content-Type': bookData instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      });
      
      if (response.data && response.data.success && response.data.data) {
        toast.success('Book updated successfully');
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'update book');
    }
  },

  /**
   * Delete a book (admin only)
   */
  async deleteBook(id: string): Promise<void> {
    try {
      await api.delete(`${ADMIN_ENDPOINT}/${id}`);
      toast.success('Book deleted successfully');
    } catch (error) {
      handleApiError(error, 'delete book');
    }
  },

  /**
   * Publish/Unpublish a book (admin only)
   */
  async togglePublishStatus(id: string, isPublished: boolean): Promise<Book> {
    try {
      const response = await api.patch(`${ADMIN_ENDPOINT}/${id}/publish`, { isPublished });
      const message = isPublished ? 'Book published successfully' : 'Book unpublished successfully';
      toast.success(message);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'toggle book publish status');
    }
  },

  /**
   * Get book statistics (admin only)
   */
  async getBookStats(): Promise<{
    totalBooks: number;
    publishedBooks: number;
    draftBooks: number;
    activeBooks: number;
  }> {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/stats/overview`);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data.stats;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      return handleApiError(error, 'fetch book statistics');
    }
  }
};
