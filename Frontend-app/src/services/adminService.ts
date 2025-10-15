// src/services/adminService.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "./authService";
import { API_CONFIG } from "../config";

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
  baseURL: API_CONFIG.admin,
  timeout: 30000, // 30 seconds timeout
  validateStatus: (status) => status < 500,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('AdminService: Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('AdminService: Request interceptor error:', error);
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
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      } catch (refreshError) {
        console.error('AdminService: Token refresh error:', refreshError);
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
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
      console.error('Error fetching dashboard:', error);
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
      console.error('Error fetching users:', error);
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
      console.error('Error fetching user:', error);
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
      console.error('Error fetching books:', error);
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
      console.error('Error fetching book:', error);
      return { success: false, error: 'Failed to fetch book' };
    }
  }

  async createBook(bookData: any): Promise<ApiResponse<any>> {
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
      console.error('Error fetching courses:', error);
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
      console.error('Error fetching course:', error);
      return { success: false, error: 'Failed to fetch course' };
    }
  }

  async createCourse(courseData: any): Promise<ApiResponse<any>> {
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
      console.error('Error fetching live classes:', error);
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
      console.error('Error fetching live class:', error);
      return { success: false, error: 'Failed to fetch live class' };
    }
  }

  async createLiveClass(liveClassData: any): Promise<ApiResponse<any>> {
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
      console.error('Error fetching payments:', error);
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
      console.error('Error fetching payment:', error);
      return { success: false, error: 'Failed to fetch payment' };
    }
  }

  // Admin Info
  async getAdminInfo(): Promise<ApiResponse<any>> {
    try {
      const response = await adminApi.get('/info');
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching admin info:', error);
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
}

export const adminService = new AdminService();
export default adminService;