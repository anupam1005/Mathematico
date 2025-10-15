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
  // Remove problematic configurations that might cause network issues
  validateStatus: (status) => status < 500,
  // Simplified headers
  headers: {
    'Accept': 'application/json',
  },
});

// Add token automatically
adminApi.interceptors.request.use(
  async (config) => {
    const token = await authService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add retry count to config
    (config as any)._retryCount = (config as any)._retryCount || 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add retry interceptor for network errors
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Retry logic for network errors
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      const retryCount = (originalRequest as any)._retryCount || 0;
      if (retryCount < 3) {
        (originalRequest as any)._retryCount = retryCount + 1;
        console.log(`Retrying request (attempt ${(originalRequest as any)._retryCount})...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (originalRequest as any)._retryCount));
        
        return adminApi(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auto-refresh token if expired
adminApi.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('Token expired, attempting refresh...');
        const refreshResult = await authService.refreshToken();
        // refreshToken() returns data.token and data.refreshToken
        if (refreshResult?.success && (refreshResult?.data?.token || refreshResult?.data?.accessToken)) {
          const newToken = refreshResult.data.token || refreshResult.data.accessToken;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return adminApi(originalRequest);
        } else {
          console.log('Refresh token failed, clearing tokens');
          await AsyncStorage.multiRemove(["authToken", "refreshToken", "user"]);
          // Could navigate to login screen here if navigation is available
        }
      } catch (e) {
        console.error('Refresh token error:', e);
        await AsyncStorage.multiRemove(["authToken", "refreshToken", "user"]);
      }
    }
    return Promise.reject(error);
  }
);

class AdminService {
  async makeRequest<T = any>(
    endpoint: string,
    options: { method?: "GET" | "POST" | "PUT" | "DELETE"; data?: any; headers?: any } = {}
  ) {
    try {
      const method = options.method || "GET";
      
      // Simplified config without complex settings
      const config: any = { 
        url: endpoint, 
        method,
        timeout: 30000, // 30 seconds
      };

      if (options.data) {
        if (options.data instanceof FormData) {
          // For FormData, let axios handle everything automatically
          config.data = options.data;
          // Don't set any Content-Type headers for FormData
        } else {
          // For JSON data
          config.data = toSnakeCase(options.data);
          config.headers = { 
            "Content-Type": "application/json", 
            ...(options.headers || {}) 
          };
        }
      } else {
        config.headers = options.headers || {};
      }

      console.log(`Admin API Request: ${method} ${endpoint}`);
      console.log(`Admin API Request URL: ${adminApi.defaults.baseURL}${endpoint}`);
      
      const response = await adminApi(config);
      console.log(`Admin API Response: ${response.status} ${response.statusText}`);
      
      return toCamelCase(response.data) as ApiResponse<T>;
    } catch (error: any) {
      console.error('Admin API Error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
          baseURL: error.config?.baseURL
        }
      });
      
      // Enhanced error handling
      if (error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || error.message?.includes('Network Error')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again with a smaller file or check your connection.');
      } else if (error.response?.status === 413) {
        throw new Error('File too large. Please try with a smaller file.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  }

  // ----------------- FILE UPLOAD -----------------
  async uploadFile(file: any, type: "image" | "video" | "document" = "image") {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.fileName || `upload.${file.uri.split(".").pop()}`,
        type: file.type || `application/${file.uri.split(".").pop()}`,
      } as any);

      const response = await this.makeRequest<{ url: string }>("/admin/upload", {
        method: "POST",
        data: formData,
      });

      return response.data?.url ?? null;
    } catch (err) {
      console.error("File upload error:", err);
      throw err;
    }
  }

  // ----------------- BOOKS -----------------
  async getAllBooks() {
    return this.makeRequest("/books");
  }
  async createBook(data: FormData) {
    console.log('Creating book with FormData - React Native FormData detected');
    
    try {
      console.log('📚 AdminService: Making book creation request...');
      
      // Add specific timeout and retry for book creation
      const result = await this.makeRequest("/books", { 
        method: "POST", 
        data
      });
      
      console.log('📚 AdminService: Book creation successful');
      return result;
    } catch (error) {
      console.error('📚 AdminService: Book creation failed:', error);
      throw error;
    }
  }
  async updateBook(id: string, data: FormData) {
    return this.makeRequest(`/books/${id}`, { method: "PUT", data });
  }
  async deleteBook(id: string) {
    return this.makeRequest(`/books/${id}`, { method: "DELETE" });
  }
  async updateBookStatus(id: string, status: string) {
    return this.makeRequest(`/books/${id}/status`, {
      method: "PUT",
      data: { status },
    });
  }

  // ----------------- COURSES -----------------
  async getAllCourses() {
    return this.makeRequest("/courses");
  }
  async createCourse(data: FormData) {
    return this.makeRequest("/courses", { method: "POST", data });
  }
  async updateCourse(id: string, data: FormData) {
    return this.makeRequest(`/courses/${id}`, { method: "PUT", data });
  }
  async deleteCourse(id: string) {
    return this.makeRequest(`/courses/${id}`, { method: "DELETE" });
  }
  async updateCourseStatus(id: string, status: string) {
    return this.makeRequest(`/courses/${id}/status`, {
      method: "PUT",
      data: { status },
    });
  }

  // ----------------- LIVE CLASSES -----------------
  async getAllLiveClasses() {
    return this.makeRequest("/live-classes");
  }
  async createLiveClass(data: any) {
    return this.makeRequest("/live-classes", { method: "POST", data });
  }
  async updateLiveClass(id: string, data: any) {
    return this.makeRequest(`/live-classes/${id}`, { method: "PUT", data });
  }
  async deleteLiveClass(id: string) {
    return this.makeRequest(`/live-classes/${id}`, { method: "DELETE" });
  }
  // ✅ FIX: add missing status update function
  async updateLiveClassStatus(id: string, status: string) {
    return this.makeRequest(`/live-classes/${id}/status`, {
      method: "PUT",
      data: { status },
    });
  }

  // ----------------- USERS -----------------
  async getAllUsers() {
    return this.makeRequest("/users");
  }
  async updateUser(id: string, data: any) {
    return this.makeRequest(`/users/${id}`, { method: "PUT", data });
  }
  async deleteUser(id: string) {
    return this.makeRequest(`/users/${id}`, { method: "DELETE" });
  }
  async updateUserStatus(id: string, isActive: boolean) {
    return this.makeRequest(`/users/${id}/status`, {
      method: "PUT",
      data: { is_active: isActive },
    });
  }

  // ----------------- PAYMENTS -----------------
  async getAllPayments() {
    return this.makeRequest("/payments");
  }
  async getPaymentStats() {
    return this.makeRequest("/payments/stats");
  }
  async updatePaymentStatus(id: string, status: string, metadata?: any) {
    return this.makeRequest(`/payments/${id}/status`, {
      method: "PUT",
      data: { status, metadata },
    });
  }

  // ----------------- DASHBOARD -----------------
  async getDashboardStats() {
    return this.makeRequest("/dashboard");
  }

  // ----------------- SETTINGS -----------------
  async getSettings() {
    return this.makeRequest("/settings");
  }
  
  async updateSettings(settings: any) {
    return this.makeRequest("/settings", {
      method: "PUT",
      data: settings,
    });
  }
}

export const adminService = new AdminService();
export default adminService;
