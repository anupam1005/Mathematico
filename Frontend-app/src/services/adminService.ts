// src/services/adminService.ts
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import authService from './authService';
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from './apiClient';
import { createSafeError } from '../utils/safeError';
import { tokenStorage } from './tokenStorage';
import { API_BASE_URL } from '../config';

/* ------------------------------------------------------------------ */
/* Admin network layer                                                */
/* ------------------------------------------------------------------ */

// Create a service error handler for adminService
const errorHandler = createServiceErrorHandler('adminService');

type PlainHeaders = Record<string, string>;

const buildAuthHeaders = (token?: string | null, extra?: PlainHeaders): PlainHeaders => {
  const headers: PlainHeaders = {
    Accept: 'application/json',
  };

  if (token && typeof token === 'string' && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (typeof v === 'string') headers[k] = v;
    }
  }

  return headers;
};

const adminApi = withBasePath(API_PATHS.admin);

// Helper function for admin API calls using axios only
const adminFetch = async (method: string, path: string, data?: any): Promise<any> => {
  try {
    // Preserve existing debug signal, but avoid logging full absolute URLs
    console.log('ADMIN_FETCH_PATH:', path);

    const upper = String(method || '').toUpperCase();

    // Use native fetch for FormData to avoid Axios hanging bugs in React Native
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    if (isFormData) {
      await tokenStorage.hydrate();
      const token = await tokenStorage.getAccessToken();
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const fullUrl = `${API_BASE_URL}${API_PATHS.admin}${normalizedPath}`;
      
      console.log('ADMIN_FETCH_FORM_DATA:', fullUrl);
      const response = await fetch(fullUrl, {
        method: upper,
        body: data,
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        // Create an error that includes the detailed backend error message if available
        const errorMsg = responseData.message || responseData.error || 'Request failed';
        const technicalError = responseData.error || responseData.message || '';
        const combinedMessage = technicalError && technicalError !== errorMsg 
          ? `${errorMsg}: ${technicalError}` 
          : errorMsg;
        
        throw new Error(combinedMessage);
      }
      return responseData;
    }

    const config = undefined;

    if (upper === 'GET') return (await adminApi.get(path, config)).data;
    if (upper === 'DELETE') return (await adminApi.delete(path, config)).data;
    if (upper === 'POST') return (await adminApi.post(path, data, config)).data;
    if (upper === 'PUT') return (await adminApi.put(path, data, config)).data;
    if (upper === 'PATCH') return (await adminApi.patch(path, data, config)).data;

    return (
      await adminApi.request({
        method: upper as any,
        url: path,
        data,
      })
    ).data;
  } catch (error) {
    const safe = createSafeError(error);
    console.error('ADMIN_FETCH_ERROR:', safe);
    throw safe;
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
    const errorMsg = response.message || response.error || 'Request failed';
    const technicalError = response.error || response.message || '';
    const combinedMessage = technicalError && technicalError !== errorMsg 
      ? `${errorMsg}: ${technicalError}` 
      : errorMsg;
      
    throw new Error(combinedMessage);
  }
  
  return response || { success: true };
};

// ----------------- ADMIN SERVICE CLASS -----------------
class AdminService {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<any>> {
    try {
      let response;
      try {
        response = await adminFetch('GET', '/dashboard');
      } catch (dashError) {
        // Fallback to /stats if /dashboard is missing or fails
        response = await adminFetch('GET', '/stats');
        
        // Map the /stats payload to match expected /dashboard shape
        if (response && response.data) {
          response.data = {
            totalUsers: response.data.totalStudents || response.data.activeUsers || 0,
            totalBooks: response.data.totalBooks || 0,
            totalCourses: response.data.totalCourses || 0,
            totalLiveClasses: response.data.totalLiveClasses || 0,
            totalRevenue: 0,
            courseStats: { total: response.data.totalCourses || 0, published: 0, draft: 0 },
            liveClassStats: { total: response.data.totalLiveClasses || 0, upcoming: 0, completed: 0 }
          };
        } else if (response) {
          response = {
            success: true,
            data: {
              totalUsers: response.totalStudents || response.activeUsers || 0,
              totalBooks: response.totalBooks || 0,
              totalCourses: response.totalCourses || 0,
              totalLiveClasses: response.totalLiveClasses || 0,
              totalRevenue: 0,
              courseStats: { total: response.totalCourses || 0, published: 0, draft: 0 },
              liveClassStats: { total: response.totalLiveClasses || 0, upcoming: 0, completed: 0 }
            }
          };
        }
      }
      
      const payload = processResponse(response);
      return {
        success: true,
        data: payload.data || payload || {
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
      // Return success: true with empty data so the dashboard renders safely instead of crashing
      return {
        success: true,
        error: 'Failed to fetch dashboard data',
        data: {
          totalUsers: 0,
          totalBooks: 0,
          totalCourses: 0,
          totalLiveClasses: 0,
          totalRevenue: 0,
          courseStats: { total: 0, published: 0, draft: 0 },
          liveClassStats: { total: 0, upcoming: 0, completed: 0 },
          recentUsers: [],
          recentCourses: []
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
        data: Array.isArray(payload) ? payload : (payload.data || (payload as any).users || (payload as any).items || payload || []),
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
        data: Array.isArray(payload) ? payload : (payload.data || (payload as any).books || (payload as any).items || payload || []),
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
        // FormData upload: route through the same axios-only helper for consistency.
        response = await adminFetch('POST', '/books', bookData);
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
        response = await adminFetch('PUT', `/books/${id}`, bookData);
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
        data: Array.isArray(payload) ? payload : (payload.data || (payload as any).courses || (payload as any).items || payload || []),
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

  async updateCourseStatus(id: string, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', `/courses/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error updating course status:', error);
      return { success: false, error: 'Failed to update course status' };
    }
  }

  // Live Classes
  async getAllLiveClasses(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', `/live-classes?page=${page}&limit=${limit}`);
      const payload = processResponse(response);
      return {
        success: true,
        data: Array.isArray(payload) ? payload : (payload.data || (payload as any).liveClasses || (payload as any).items || payload || []),
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

  async updateLiveClassStatus(id: string, status: string): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', `/live-classes/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      errorHandler.handleError('Error updating live class status:', error);
      return { success: false, error: 'Failed to update live class status' };
    }
  }

  // Settings (optional backend support)
  async getSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('GET', '/settings');
      const payload = processResponse(response);
      return { success: true, data: payload.data ?? payload };
    } catch (error) {
      errorHandler.handleError('Error fetching settings:', error);
      return { success: false, error: 'Failed to fetch settings' };
    }
  }

  async updateSettings(settings: any): Promise<ApiResponse<any>> {
    try {
      const response = await adminFetch('PUT', '/settings', settings);
      const payload = processResponse(response);
      return { success: true, data: payload.data ?? payload };
    } catch (error) {
      errorHandler.handleError('Error updating settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }
}

// Export a singleton instance
const adminService = new AdminService();
export default adminService;
// Back-compat: some screens import `{ adminService }`
export { adminService, AdminService };
