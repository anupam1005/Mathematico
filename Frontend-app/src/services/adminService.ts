// src/services/adminService.ts
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import authService from './authService';
import { API_PATHS } from '../constants/apiPaths';
import { API_BASE_URL } from '../config';

// Create a service error handler for adminService
const errorHandler = createServiceErrorHandler('adminService');

// Helper function for admin API calls using fetch to avoid React Native frozen object issues
const adminFetch = async (method: string, path: string, data?: any): Promise<any> => {
  try {
    const token = await authService.getToken();
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token && typeof token === 'string') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = `${API_BASE_URL}${API_PATHS.admin}${path}`;
    console.log('ADMIN_FETCH_URL:', url);
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    console.log('ADMIN_FETCH_STATUS:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('ADMIN_FETCH_ERROR:', error);
    throw error;
  }
};

// Generic API response type
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Dashboard stats interface
export interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  totalCourses: number;
  totalLiveClasses: number;
  totalRevenue: number;
  courseStats: {
    total: number;
    published: number;
    draft: number;
  };
  liveClassStats: {
    total: number;
    upcoming: number;
    completed: number;
  };
  recentUsers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  recentCourses?: Array<{
    id: string;
    title: string;
    category: string;
    author: string;
  }>;
}

// Helper function to process fetch responses
const processResponse = (response: any): ApiResponse<any> => {
  if (response && response.success === false) {
    throw new Error(response.message || response.error || 'Request failed');
  }
  
  return response || { success: true };
};

// ----------------- ADMIN SERVICE CLASS -----------------
class AdminService {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', '/dashboard');
      const payload = processResponse(response);
      return {
        success: true,
        data: payload.data || {
          totalUsers: 0,
          totalBooks: 0,
          totalCourses: 0,
          totalLiveClasses: 0,
          totalRevenue: 0,
          courseStats: { total: 0, published: 0, draft: 0 },
          liveClassStats: { total: 0, upcoming: 0, completed: 0 }
        }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching dashboard:', error);
      return {
        success: false,
        error: 'Failed to fetch dashboard data',
        data: {
          totalUsers: 0,
          totalBooks: 0,
          totalCourses: 0,
          totalLiveClasses: 0,
          totalRevenue: 0,
          courseStats: { total: 0, published: 0, draft: 0 },
          liveClassStats: { total: 0, upcoming: 0, completed: 0 }
        }
      };
    }
  }

  // Dashboard Stats (alias for getDashboard)
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.getDashboard();
  }

  // Users
  async getAllUsers(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/users?page=${page}&limit=${limit}`);
      const payload = processResponse(response);
      return {
        success: true,
        data: payload.data || [],
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching users:', error);
      return {
        success: false,
        error: 'Failed to fetch users',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getUserById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error fetching user:', error);
      return { success: false, error: 'Failed to fetch user' };
    }
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('POST', '/users', userData);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', `/users/${id}`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  async updateUserStatus(id: string, status: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', `/users/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error updating user status:', error);
      return { success: false, error: 'Failed to update user status' };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('DELETE', `/users/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  }

  // Books
  async getAllBooks(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/books?page=${page}&limit=${limit}`);
      const payload = processResponse(response);
      return {
        success: true,
        data: payload.data || [],
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching books:', error);
      return {
        success: false,
        error: 'Failed to fetch books',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getBookById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/books/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error fetching book:', error);
      return { success: false, error: 'Failed to fetch book' };
    }
  }

  async createBook(bookData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Creating book with data:', bookData);
      
      // Check if bookData is FormData or regular object
      const isFormData = bookData instanceof FormData;
      
      let response;
      if (isFormData) {
        // For FormData, we need special handling
        const token = await authService.getToken();
        if (!token) {
          return { success: false, error: 'No authentication token found' };
        }
        
        const headers: { [key: string]: string } = {};
        if (token && typeof token === 'string') {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = `${API_BASE_URL}${API_PATHS.admin}/books`;
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers,
          body: bookData
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }
        
        response = await fetchResponse.json();
      } else {
        response = await adminFetch('POST', '/books', bookData);
      }
      
      errorHandler.logInfo('AdminService: Book created successfully:', response);
      return { success: true, data: response.data };
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book creation error:', error);
      return { success: false, error: 'Failed to create book' };
    }
  }

  async updateBook(id: string, bookData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating book with ID:', id, 'data:', bookData);
      
      // Check if bookData is FormData or regular object
      const isFormData = bookData instanceof FormData;
      
      let response;
      if (isFormData) {
        // For FormData, we need special handling
        const token = await authService.getToken();
        if (!token) {
          return { success: false, error: 'No authentication token found' };
        }
        
        const headers: { [key: string]: string } = {};
        if (token && typeof token === 'string') {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = `${API_BASE_URL}${API_PATHS.admin}/books/${id}`;
        const fetchResponse = await fetch(url, {
          method: 'PUT',
          headers,
          body: bookData
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }
        
        response = await fetchResponse.json();
      } else {
        response = await adminFetch('PUT', `/books/${id}`, bookData);
      }
      
      errorHandler.logInfo('AdminService: Book updated successfully:', response);
      return { success: true, data: response.data };
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book update error:', error);
      return { success: false, error: 'Failed to update book' };
    }
  }

  async updateBookStatus(id: string, status: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating book status for ID:', id, 'status:', status);
      const response = await adminFetch('PUT', `/books/${id}/status`, { status });
      errorHandler.logInfo('AdminService: Book status updated successfully:', response);
      return { success: true, data: response.data };
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book status update error:', error);
      return { success: false, error: 'Failed to update book status' };
    }
  }

  async deleteBook(id: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Deleting book with ID:', id);
      const response = await adminFetch('DELETE', `/books/${id}`);
      errorHandler.logInfo('AdminService: Book deleted successfully:', response);
      return { success: true, data: response.data };
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book deletion error:', error);
      return { success: false, error: 'Failed to delete book' };
    }
  }

  // Add placeholder methods for other functionality
  // These can be implemented as needed following the same pattern
  async getAllCourses(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/courses?page=${page}&limit=${limit}`);
      const payload = processResponse(response);
      return {
        success: true,
        data: payload.data || [],
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching courses:', error);
      return {
        success: false,
        error: 'Failed to fetch courses',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getCourseById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/courses/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error fetching course:', error);
      return { success: false, error: 'Failed to fetch course' };
    }
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('POST', '/courses', courseData);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error creating course:', error);
      return { success: false, error: 'Failed to create course' };
    }
  }

  async updateCourse(id: string, courseData: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', `/courses/${id}`, courseData);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error updating course:', error);
      return { success: false, error: 'Failed to update course' };
    }
  }

  async deleteCourse(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('DELETE', `/courses/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error deleting course:', error);
      return { success: false, error: 'Failed to delete course' };
    }
  }

  // Live Classes
  async getAllLiveClasses(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/live-classes?page=${page}&limit=${limit}`);
      const payload = processResponse(response);
      return {
        success: true,
        data: payload.data || [],
        pagination: payload.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching live classes:', error);
      return {
        success: false,
        error: 'Failed to fetch live classes',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getLiveClassById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/live-classes/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error fetching live class:', error);
      return { success: false, error: 'Failed to fetch live class' };
    }
  }

  async createLiveClass(liveClassData: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('POST', '/live-classes', liveClassData);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error creating live class:', error);
      return { success: false, error: 'Failed to create live class' };
    }
  }

  async updateLiveClass(id: string, liveClassData: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', `/live-classes/${id}`, liveClassData);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error updating live class:', error);
      return { success: false, error: 'Failed to update live class' };
    }
  }

  async deleteLiveClass(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('DELETE', `/live-classes/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error deleting live class:', error);
      return { success: false, error: 'Failed to delete live class' };
    }
  }
}

// Export a singleton instance
const adminService = new AdminService();
export default adminService;
export { AdminService };
