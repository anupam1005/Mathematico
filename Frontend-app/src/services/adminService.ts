// src/services/adminService.ts
import axios from "axios";
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";
import { API_CONFIG } from "../config";
import { Storage } from "../utils/storage";

// Create a service error handler for adminService
const errorHandler = createServiceErrorHandler('adminService');

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
  }>;
}

// --- Utility: map snake_case <-> camelCase --- //
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/([-_][a-z])/gi, (s) => s.toUpperCase().replace(/[-_]/g, "")),
        toCamelCase(v),
      ])
    );
  }
  return obj;
}

function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/[A-Z]/g, (s) => `_${s.toLowerCase()}`),
        toSnakeCase(v),
      ])
    );
  }
  return obj;
}

// ----------------- AXIOS INSTANCE -----------------
const adminApi = axios.create({
  baseURL: API_CONFIG.admin, // This will be updated dynamically
  timeout: 30000, // 30 seconds timeout
  validateStatus: (status) => status < 500,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Update the base URL dynamically
(async () => {
  try {
    const { getBackendUrl } = await import('../config');
    const backendUrl = await getBackendUrl();
    adminApi.defaults.baseURL = `${backendUrl}/api/v1/admin`;
    console.log('AdminService: Base URL updated to:', adminApi.defaults.baseURL);
  } catch (error) {
    console.error('AdminService: Failed to update base URL:', error);
  }
})();

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      errorHandler.handleError('AdminService: Error getting token:', error);
    }
    return config;
  },
  (error) => {
    errorHandler.handleError('AdminService: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          console.log('AdminService: Token refreshed successfully, retrying request...');
          return adminApi(originalRequest);
        } else {
          console.log('AdminService: Token refresh failed, clearing tokens...');
          await Storage.deleteItem('authToken');
          await Storage.deleteItem('refreshToken');
        }
      } catch (refreshError) {
        errorHandler.handleError('AdminService: Token refresh error:', refreshError);
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
      }
    }
    
    return Promise.reject(error);
  }
);

// ----------------- ADMIN SERVICE CLASS -----------------
class AdminService {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get('/dashboard');
      return {
        success: true,
        data: response.data.data || {
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
      const response = await adminApi.get(`/users?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, page, limit, totalPages: 0 }
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
      const response = await adminApi.get(`/users/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching user:', error);
      return { success: false, error: 'Failed to fetch user' };
    }
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    throw new Error('User creation is not available. Database functionality has been removed.');
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    throw new Error('User update is not available. Database functionality has been removed.');
  }

  async updateUserStatus(id: string, status: boolean): Promise<ApiResponse<any>> {
    throw new Error('User status update is not available. Database functionality has been removed.');
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    throw new Error('User deletion is not available. Database functionality has been removed.');
  }

  // Books
  async getAllBooks(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get(`/books?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, page, limit, totalPages: 0 }
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
      const response = await adminApi.get(`/books/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching book:', error);
      return { success: false, error: 'Failed to fetch book' };
    }
  }

  async createBook(bookData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Creating book with data:', bookData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if bookData is FormData or regular object
      const isFormData = bookData instanceof FormData;
      
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };
      
      let body: any;
      
      if (isFormData) {
        // For FormData, don't set Content-Type, let the browser set it with boundary
        body = bookData;
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(bookData);
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/books`, {
        method: 'POST',
        headers,
        body
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Book created successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Book creation failed:', result);
        return { success: false, error: result.message || 'Failed to create book' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book creation error:', error);
      return { success: false, error: error.message || 'Failed to create book' };
    }
  }

  async updateBook(id: string, bookData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating book with ID:', id, 'data:', bookData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if bookData is FormData or regular object
      const isFormData = bookData instanceof FormData;
      
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };
      
      let body: any;
      
      if (isFormData) {
        // For FormData, don't set Content-Type, let the browser set it with boundary
        body = bookData;
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(bookData);
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/books/${id}`, {
        method: 'PUT',
        headers,
        body
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Book updated successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Book update failed:', result);
        return { success: false, error: result.message || 'Failed to update book' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book update error:', error);
      return { success: false, error: error.message || 'Failed to update book' };
    }
  }

  async updateBookStatus(id: string, status: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating book status for ID:', id, 'status:', status);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/books/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Book status updated successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Book status update failed:', result);
        return { success: false, error: result.message || 'Failed to update book status' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book status update error:', error);
      return { success: false, error: error.message || 'Failed to update book status' };
    }
  }

  async deleteBook(id: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Deleting book with ID:', id);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/books/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Book deleted successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Book deletion failed:', result);
        return { success: false, error: result.message || 'Failed to delete book' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Book deletion error:', error);
      return { success: false, error: error.message || 'Failed to delete book' };
    }
  }

  // Courses
  async getAllCourses(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get(`/courses?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, page, limit, totalPages: 0 }
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
      const response = await adminApi.get(`/courses/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching course:', error);
      return { success: false, error: 'Failed to fetch course' };
    }
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Creating course with data:', courseData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if courseData is FormData or regular object
      const isFormData = courseData instanceof FormData;
      
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };
      
      let body: any;
      
      if (isFormData) {
        // For FormData, don't set Content-Type, let the browser set it with boundary
        body = courseData;
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(courseData);
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      errorHandler.logInfo('AdminService: Making request to:', `${adminUrl}/courses`);
      errorHandler.logInfo('AdminService: Request headers:', headers);
      errorHandler.logInfo('AdminService: Request body type:', typeof body);
      
      const response = await fetch(`${adminUrl}/courses`, {
        method: 'POST',
        headers,
        body
      });
      
      errorHandler.logInfo('AdminService: Response status:', response.status);
      errorHandler.logInfo('AdminService: Response ok:', response.ok);

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Course created successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Course creation failed:', result);
        return { success: false, error: result.message || 'Failed to create course' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Course creation error:', error);
      
      // Handle specific network errors
      if (error.message === 'Network request failed') {
        return { 
          success: false, 
          error: 'Network connection failed. Please check if the backend server is running and accessible.' 
        };
      }
      
      return { success: false, error: error.message || 'Failed to create course' };
    }
  }

  async updateCourse(id: string, courseData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating course with ID:', id, 'data:', courseData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if courseData is FormData or regular object
      const isFormData = courseData instanceof FormData;
      
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };
      
      let body: any;
      
      if (isFormData) {
        // For FormData, don't set Content-Type, let the browser set it with boundary
        body = courseData;
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(courseData);
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/courses/${id}`, {
        method: 'PUT',
        headers,
        body
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Course updated successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Course update failed:', result);
        return { success: false, error: result.message || 'Failed to update course' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Course update error:', error);
      return { success: false, error: error.message || 'Failed to update course' };
    }
  }

  async updateCourseStatus(id: string, status: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating course status for ID:', id, 'status:', status);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/courses/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Course status updated successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Course status update failed:', result);
        return { success: false, error: result.message || 'Failed to update course status' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Course status update error:', error);
      return { success: false, error: error.message || 'Failed to update course status' };
    }
  }

  async deleteCourse(id: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Deleting course with ID:', id);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/courses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Course deleted successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Course deletion failed:', result);
        return { success: false, error: result.message || 'Failed to delete course' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Course deletion error:', error);
      return { success: false, error: error.message || 'Failed to delete course' };
    }
  }

  // Live Classes
  async getAllLiveClasses(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get(`/live-classes?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, page, limit, totalPages: 0 }
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
      const response = await adminApi.get(`/live-classes/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching live class:', error);
      return { success: false, error: 'Failed to fetch live class' };
    }
  }

  async createLiveClass(liveClassData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Creating live class with data:', liveClassData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if liveClassData is FormData or regular object
      const isFormData = liveClassData instanceof FormData;
      
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };
      
      let body: any;
      
      if (isFormData) {
        // For FormData, don't set Content-Type, let the browser set it with boundary
        body = liveClassData;
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(liveClassData);
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/live-classes`, {
        method: 'POST',
        headers,
        body
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Live class created successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Live class creation failed:', result);
        return { success: false, error: result.message || 'Failed to create live class' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Live class creation error:', error);
      return { success: false, error: error.message || 'Failed to create live class' };
    }
  }

  async updateLiveClass(id: string, liveClassData: any): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating live class with ID:', id, 'data:', liveClassData);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if liveClassData is FormData or regular object
      const isFormData = liveClassData instanceof FormData;
      
      const headers: any = {
        'Authorization': `Bearer ${token}`
      };
      
      let body: any;
      
      if (isFormData) {
        // For FormData, don't set Content-Type, let the browser set it with boundary
        body = liveClassData;
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(liveClassData);
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/live-classes/${id}`, {
        method: 'PUT',
        headers,
        body
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Live class updated successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Live class update failed:', result);
        return { success: false, error: result.message || 'Failed to update live class' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Live class update error:', error);
      return { success: false, error: error.message || 'Failed to update live class' };
    }
  }

  async updateLiveClassStatus(id: string, status: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Updating live class status for ID:', id, 'status:', status);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/live-classes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Live class status updated successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Live class status update failed:', result);
        return { success: false, error: result.message || 'Failed to update live class status' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Live class status update error:', error);
      return { success: false, error: error.message || 'Failed to update live class status' };
    }
  }

  async deleteLiveClass(id: string): Promise<ApiResponse<any>> {
    try {
      errorHandler.logInfo('AdminService: Deleting live class with ID:', id);
      
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const adminUrl = `${backendUrl}/api/v1/admin`;
      
      const response = await fetch(`${adminUrl}/live-classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Live class deleted successfully:', result);
        return { success: true, data: result.data };
      } else {
        errorHandler.handleError('AdminService: Live class deletion failed:', result);
        return { success: false, error: result.message || 'Failed to delete live class' };
      }
    } catch (error: any) {
      errorHandler.handleError('AdminService: Live class deletion error:', error);
      return { success: false, error: error.message || 'Failed to delete live class' };
    }
  }

  // Payments
  async getPayments(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get(`/payments?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      errorHandler.handleError('Error fetching payments:', error);
      return {
        success: false,
        error: 'Failed to fetch payments',
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      };
    }
  }

  async getPaymentById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get(`/payments/${id}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching payment:', error);
      return { success: false, error: 'Failed to fetch payment' };
    }
  }

  // Admin Info
  async getAdminInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get('/info');
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching admin info:', error);
      return {
        success: true,
        data: {
          adminName: 'Admin User',
          email: 'admin@mathematico.com',
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          database: 'disabled',
          features: {
            userManagement: false,
            bookManagement: false,
            courseManagement: false,
            liveClassManagement: false,
            paymentManagement: false
          },
          message: 'Database functionality has been removed. Only authentication is available.'
        }
      };
    }
  }

  // Settings methods
  async getSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get('/settings');
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error fetching settings:', error);
      return {
        success: true,
        data: {
          site_name: 'Mathematico',
          site_description: 'Educational Platform',
          contact_email: 'admin@mathematico.com',
          maintenance_mode: false,
          allow_registration: false,
          database: 'disabled',
          message: 'Database functionality has been removed. Settings are not persistent.'
        }
      };
    }
  }

  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.put('/settings', settings);
      return { success: true, data: response.data.data };
    } catch (error) {
      errorHandler.handleError('Error updating settings:', error);
      return {
        success: true,
        data: settings,
        message: 'Settings updated locally. Database functionality has been removed.'
      };
    }
  }
}

export const adminService = new AdminService();
export default adminService;