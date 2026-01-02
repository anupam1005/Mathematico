// src/services/adminService.ts
import axios from "axios";
<<<<<<< HEAD
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";
import { API_CONFIG } from "../config";
import { Storage } from "../utils/storage";

// Create a service error handler for adminService
const errorHandler = createServiceErrorHandler('adminService');
=======
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";
import { API_CONFIG } from "../config";
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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

<<<<<<< HEAD
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

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
  baseURL: API_CONFIG.admin, // This will be updated dynamically
=======
  baseURL: API_CONFIG.admin,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  timeout: 30000, // 30 seconds timeout
  validateStatus: (status) => status < 500,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

<<<<<<< HEAD
// Update the base URL dynamically
(async () => {
  try {
    adminApi.defaults.baseURL = API_CONFIG.admin;
    console.log('AdminService: Base URL updated to:', adminApi.defaults.baseURL);
  } catch (error) {
    console.error('AdminService: Failed to update base URL:', error);
    // Fallback to API_CONFIG.admin if getBackendUrl fails
    adminApi.defaults.baseURL = API_CONFIG.admin;
    console.log('AdminService: Using fallback base URL:', adminApi.defaults.baseURL);
  }
})();

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
// Request interceptor to add auth token
adminApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('AdminService: Error getting token:', error);
=======
      console.error('AdminService: Error getting token:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    }
    return config;
  },
  (error) => {
<<<<<<< HEAD
    errorHandler.handleError('AdminService: Request interceptor error:', error);
=======
    console.error('AdminService: Request interceptor error:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
          await Storage.deleteItem('authToken');
          await Storage.deleteItem('refreshToken');
        }
      } catch (refreshError) {
        errorHandler.handleError('AdminService: Token refresh error:', refreshError);
        await Storage.deleteItem('authToken');
        await Storage.deleteItem('refreshToken');
=======
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      } catch (refreshError) {
        console.error('AdminService: Token refresh error:', refreshError);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching dashboard:', error);
=======
      console.error('Error fetching dashboard:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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

<<<<<<< HEAD
  // Dashboard Stats (alias for getDashboard)
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.getDashboard();
  }

=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching users:', error);
=======
      console.error('Error fetching users:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching user:', error);
=======
      console.error('Error fetching user:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching books:', error);
=======
      console.error('Error fetching books:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching book:', error);
=======
      console.error('Error fetching book:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return { success: false, error: 'Failed to fetch book' };
    }
  }

  async createBook(bookData: any): Promise<ApiResponse<any>> {
<<<<<<< HEAD
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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
=======
    throw new Error('Book creation is not available. Database functionality has been removed.');
  }

  async updateBook(id: string, bookData: any): Promise<ApiResponse<any>> {
    throw new Error('Book update is not available. Database functionality has been removed.');
  }

  async updateBookStatus(id: string, status: string): Promise<ApiResponse<any>> {
    throw new Error('Book status update is not available. Database functionality has been removed.');
  }

  async deleteBook(id: string): Promise<ApiResponse<any>> {
    throw new Error('Book deletion is not available. Database functionality has been removed.');
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching courses:', error);
=======
      console.error('Error fetching courses:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching course:', error);
=======
      console.error('Error fetching course:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return { success: false, error: 'Failed to fetch course' };
    }
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
<<<<<<< HEAD
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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

      const backendUrl = API_CONFIG.admin.replace('/api/v1/admin', '');
      const adminUrl = API_CONFIG.admin;
      
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
=======
    throw new Error('Course creation is not available. Database functionality has been removed.');
  }

  async updateCourse(id: string, courseData: any): Promise<ApiResponse<any>> {
    throw new Error('Course update is not available. Database functionality has been removed.');
  }

  async updateCourseStatus(id: string, status: string): Promise<ApiResponse<any>> {
    throw new Error('Course status update is not available. Database functionality has been removed.');
  }

  async deleteCourse(id: string): Promise<ApiResponse<any>> {
    throw new Error('Course deletion is not available. Database functionality has been removed.');
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching live classes:', error);
=======
      console.error('Error fetching live classes:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching live class:', error);
=======
      console.error('Error fetching live class:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return { success: false, error: 'Failed to fetch live class' };
    }
  }

  async createLiveClass(liveClassData: any): Promise<ApiResponse<any>> {
<<<<<<< HEAD
    try {
      errorHandler.logInfo('AdminService: Creating live class with data:', liveClassData);
      
      const token = await authService.getToken();
      if (!token) {
        console.error('❌ AdminService: No authentication token found');
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
        console.log('📤 AdminService: Sending FormData to backend');
      } else {
        // For JSON data
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(liveClassData);
        console.log('📤 AdminService: Sending JSON data to backend');
      }

      const adminUrl = API_CONFIG.admin;
      console.log('🌐 AdminService: Posting to URL:', `${adminUrl}/live-classes`);
      
      const response = await fetch(`${adminUrl}/live-classes`, {
        method: 'POST',
        headers,
        body
      });

      console.log('📥 AdminService: Response status:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📥 AdminService: Response data:', result);
      
      if (response.ok) {
        errorHandler.logInfo('AdminService: Live class created successfully:', result);
        return { success: true, data: result.data };
      } else {
        console.error('❌ AdminService: Live class creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: result.message || result.error,
          details: result
        });
        errorHandler.handleError('AdminService: Live class creation failed:', result);
        return { success: false, error: result.message || result.error || 'Failed to create live class' };
      }
    } catch (error: any) {
      console.error('❌ AdminService: Live class creation exception:', error);
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

      const adminUrl = API_CONFIG.admin;
      
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

      const adminUrl = API_CONFIG.admin;
      
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

      const adminUrl = API_CONFIG.admin;
      
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
=======
    throw new Error('Live class creation is not available. Database functionality has been removed.');
  }

  async updateLiveClass(id: string, liveClassData: any): Promise<ApiResponse<any>> {
    throw new Error('Live class update is not available. Database functionality has been removed.');
  }

  async updateLiveClassStatus(id: string, status: string): Promise<ApiResponse<any>> {
    throw new Error('Live class status update is not available. Database functionality has been removed.');
  }

  async deleteLiveClass(id: string): Promise<ApiResponse<any>> {
    throw new Error('Live class deletion is not available. Database functionality has been removed.');
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching payments:', error);
=======
      console.error('Error fetching payments:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      errorHandler.handleError('Error fetching payment:', error);
=======
      console.error('Error fetching payment:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      return { success: false, error: 'Failed to fetch payment' };
    }
  }

  // Admin Info
  async getAdminInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get('/info');
      return { success: true, data: response.data.data };
    } catch (error) {
<<<<<<< HEAD
      errorHandler.handleError('Error fetching admin info:', error);
=======
      console.error('Error fetching admin info:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD

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
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
}

export const adminService = new AdminService();
export default adminService;