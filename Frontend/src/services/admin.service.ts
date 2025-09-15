import api from '@/lib/api';
import { Course, User, Module } from '@/types';

export interface DashboardStats {
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalCourses: number;
    totalModules: number;
    totalLessons: number;
    totalRevenue: number;
    activeBatches: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentCourses: Array<{
    id: string;
    title: string;
    category: string;
    createdAt: string;
  }>;
}

export interface CreateCourseData {
  title: string;
  description: string;
  content: string;
  price: number;
  originalPrice?: number;
  duration: string;
  category: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'draft' | 'active' | 'archived';
  isPublished: boolean;
  isFeatured: boolean;
  thumbnailUrl?: string;
  requirements?: string[];
  outcomes?: string[];
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  id: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

export interface UpdateUserData {
  id: string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

export interface CreateModuleData {
  title: string;
  description: string;
  courseId: string;
  order: number;
}

export interface UpdateModuleData extends Partial<CreateModuleData> {
  id: string;
}

class AdminService {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/admin/dashboard');
      console.log('Dashboard response:', response);
      
      if (response.data && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid dashboard response format');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Course Management
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/admin/courses');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  async createCourse(courseData: CreateCourseData): Promise<Course> {
    try {
      const response = await api.post('/admin/courses', courseData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  async updateCourse(courseData: UpdateCourseData): Promise<Course> {
    try {
      const response = await api.put(`/admin/courses/${courseData.id}`, courseData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    try {
      await api.delete(`/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // User Management
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get('/admin/users');
      console.log('Users response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data || [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUser(userData: UpdateUserData): Promise<User> {
    try {
      const response = await api.put(`/admin/users/${userData.id}`, userData);
      console.log('Update user response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
      console.log('Update user status response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await api.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Module Management
  async createModule(moduleData: CreateModuleData): Promise<Module> {
    try {
      const response = await api.post('/admin/modules', moduleData);
      console.log('Create module response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  async updateModule(moduleData: UpdateModuleData): Promise<Module> {
    try {
      const response = await api.put(`/admin/modules/${moduleData.id}`, moduleData);
      console.log('Update module response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  async deleteModule(moduleId: string): Promise<void> {
    try {
      const response = await api.delete(`/admin/modules/${moduleId}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete module');
      }
    } catch (error) {
      console.error('Delete module error:', error);
      throw error;
    }
  }

  // Settings Management
  async getSettings(): Promise<Record<string, any>> {
    try {
      const response = await api.get('/admin/settings');
      console.log('Settings response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.data) {
        return response.data.data;
      } else {
        return response.data || {};
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    try {
      await api.put('/admin/settings', settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
