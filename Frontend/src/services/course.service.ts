import api from '@/lib/api';
import { Course } from '@/types';
import { toast } from 'sonner';

// Use relative URLs since the API base URL already includes /api/v1
const COURSES_ENDPOINT = '/courses';
const ADMIN_ENDPOINT = '/admin/courses';

// Helper to transform array fields for form data
const transformArrayFields = (data: any) => {
  const transformed = { ...data };
  
  // Convert string arrays to array of objects with id and value
  const arrayFields = ['whatYouWillLearn', 'whoIsThisFor', 'topics'];
  arrayFields.forEach(field => {
    if (Array.isArray(transformed[field])) {
      transformed[field] = transformed[field].map((item: any) => ({
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        value: item
      }));
    }
  });
  
  return transformed;
};

// Types
export type CourseLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseStatus = 'draft' | 'active' | 'archived';

// Form field item type
export interface FormFieldItem {
  id: string;
  value: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BaseCourseData {
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  level: CourseLevel;
  category: string;
  topics: FormFieldItem[] | string[];
  slug?: string;
  duration?: string;
  status?: CourseStatus;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  content?: string;
  requirements?: string;
  whatYouWillLearn?: FormFieldItem[] | string[];
  whoIsThisFor?: FormFieldItem[] | string[];
}

export interface CreateCourseData extends Omit<BaseCourseData, 'status'> {
  students?: number;
  status?: CourseStatus;
}

// Helper function to normalize course level values
export const normalizeCourseLevel = (level: string): CourseLevel => {
  const levelMap: Record<string, CourseLevel> = {
    'beginner': 'Foundation',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'expert': 'Expert',
    'foundation': 'Foundation'
  };
  
  const normalizedLevel = levelMap[level.toLowerCase()];
  if (!normalizedLevel) {
    console.warn(`Unknown course level: ${level}. Defaulting to 'Foundation'`);
  }
  return normalizedLevel || 'Foundation';
};

// Helper function to handle API errors
const handleApiError = (error: unknown, context: string): never => {
  console.error(`Error in courseService.${context}:`, error);
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : `Failed to ${context}`;
  toast.error(errorMessage);
  throw new Error(errorMessage);
};

export const courseService = {
  /**
   * Get all published courses with pagination
   */
  async getCourses(
    page: number = 1,
    limit: number = 10,
    filters?: { status?: string; category?: string; level?: string; search?: string }
  ): Promise<PaginatedResponse<Course>> {
    try {
      const params: Record<string, any> = { page, limit };
      if (filters?.status) params.status = filters.status;
      if (filters?.category) params.category = filters.category;
      if (filters?.level) params.level = filters.level;
      if (filters?.search) params.search = filters.search;
      
      const response = await api.get(COURSES_ENDPOINT, { 
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
        // Backend returns data in format: { success: true, data: { courses: [...], meta: {...} } }
        const backendData = response.data.data;
        return {
          data: backendData.courses || backendData || [],
          meta: backendData.meta || { total: 0, page, limit, totalPages: 0 }
        };
      }
      
      return {
        data: Array.isArray(response.data) ? response.data : (response.data.data || []),
        meta: response.data.meta || { total: 0, page, limit, totalPages: 0 }
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses. Please try again.');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  /**
   * Get a single course by ID
   */
  async getCourseById(id: string | number): Promise<Course> {
    try {
      const response = await api.get(`${COURSES_ENDPOINT}/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid course data received from server');
      }
      
      return response.data;
    } catch (error) {
      return handleApiError(error, `fetch course with ID ${id}`);
    }
  },

  /**
   * Create a new course (admin only)
   */
  async createCourse(courseData: CreateCourseData | FormData): Promise<Course> {
    try {
      console.log('Creating course with data:', courseData);
      
      // Set appropriate headers based on data type
      const config = courseData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      } : {};
      
      console.log('=== COURSE SERVICE DEBUG ===');
      console.log('Data type:', courseData instanceof FormData ? 'FormData' : 'Object');
      console.log('Config:', config);
      
      if (courseData instanceof FormData) {
        console.log('FormData contents:');
        for (let [key, value] of courseData.entries()) {
          console.log(`${key}:`, value);
        }
      }
      
      const response = await api.post(ADMIN_ENDPOINT, courseData, config);
      console.log('Course creation response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        toast.success('Course created successfully');
        return response.data.data;
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      
      // Handle authentication errors specifically
      if ((error as any)?.response?.status === 401) {
        toast.error('Please log in as an admin to create courses');
        throw new Error('Authentication required');
      } else if ((error as any)?.response?.status === 403) {
        toast.error('Admin access required to create courses');
        throw new Error('Admin access required');
      }
      
      return handleApiError(error, 'create course');
    }
  },

  /**
   * Update an existing course (admin only)
   */
  async updateCourse(id: string | number, courseData: Partial<CreateCourseData> | FormData): Promise<Course> {
    try {
      console.log('=== UPDATE COURSE SERVICE DEBUG ===');
      console.log('Course ID:', id);
      console.log('Course data type:', courseData instanceof FormData ? 'FormData' : 'Object');
      
      if (courseData instanceof FormData) {
        console.log('FormData contents:');
        for (let [key, value] of courseData.entries()) {
          console.log(`${key}:`, value);
        }
      } else {
        console.log('Course data keys:', Object.keys(courseData));
        console.log('Has thumbnail:', !!courseData.thumbnailUrl);
        console.log('Thumbnail type:', typeof courseData.thumbnailUrl);
        console.log('Thumbnail length:', courseData.thumbnailUrl ? courseData.thumbnailUrl.length : 'N/A');
      }
      
      console.log('Admin endpoint:', ADMIN_ENDPOINT);
      console.log('Full URL:', `${ADMIN_ENDPOINT}/${id}`);
      
      // Set appropriate headers based on data type
      const config = courseData instanceof FormData ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      } : {};
      
      console.log('=== COURSE SERVICE UPDATE DEBUG ===');
      console.log('Data type:', courseData instanceof FormData ? 'FormData' : 'Object');
      console.log('Config:', config);
      
      if (courseData instanceof FormData) {
        console.log('FormData contents:');
        for (let [key, value] of courseData.entries()) {
          console.log(`${key}:`, value);
        }
      }
      
      const response = await api.put(`${ADMIN_ENDPOINT}/${id}`, courseData, config);
      console.log('Update response:', response);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('=== UPDATE COURSE ERROR DEBUG ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        console.error('Response headers:', axiosError.response?.headers);
        console.error('Request URL:', axiosError.config?.url);
        console.error('Request method:', axiosError.config?.method);
      }
      // Handle authentication errors specifically
      if ((error as any)?.response?.status === 401) {
        toast.error('Please log in as an admin to update courses');
        throw new Error('Authentication required');
      } else if ((error as any)?.response?.status === 403) {
        toast.error('Admin access required to update courses');
        throw new Error('Admin access required');
      } else if ((error as any)?.response?.status === 404) {
        toast.error('Course not found');
        throw new Error('Course not found');
      }
      
      return handleApiError(error, 'update course');
    }
  },

  /**
   * Delete a course (admin only)
   */
  async deleteCourse(id: string | number): Promise<void> {
    try {
      await api.delete(`${ADMIN_ENDPOINT}/${id}`);
      toast.success('Course deleted successfully');
    } catch (error) {
      // Handle authentication errors specifically
      if ((error as any)?.response?.status === 401) {
        toast.error('Please log in as an admin to delete courses');
        throw new Error('Authentication required');
      } else if ((error as any)?.response?.status === 403) {
        toast.error('Admin access required to delete courses');
        throw new Error('Admin access required');
      } else if ((error as any)?.response?.status === 404) {
        toast.error('Course not found');
        throw new Error('Course not found');
      }
      
      handleApiError(error, 'delete course');
      throw error;
    }
  },

  /**
   * Publish/Unpublish a course (admin only)
   */
  async publishCourse(id: string | number, isPublished: boolean): Promise<Course> {
    try {
      const response = await api.patch(`${ADMIN_ENDPOINT}/${id}/publish`, { isPublished });
      const message = isPublished ? 'Course published successfully' : 'Course unpublished successfully';
      toast.success(message);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      // Handle authentication errors specifically
      if ((error as any)?.response?.status === 401) {
        toast.error('Please log in as an admin to perform this action');
        throw new Error('Authentication required');
      } else if ((error as any)?.response?.status === 403) {
        toast.error('Admin access required for this action');
        throw new Error('Admin access required');
      } else if ((error as any)?.response?.status === 404) {
        toast.error('Course not found');
        throw new Error('Course not found');
      }
      return handleApiError(error, 'publish course');
    }
  },

  /**
   * Get all courses (admin only)
   */
  async getAllCoursesAdmin(page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<Course>> {
    console.log('getAllCoursesAdmin called with:', { page, limit, status });
    console.log('API endpoint:', ADMIN_ENDPOINT);
    
    try {
      const params: Record<string, any> = { page, limit };
      if (status) params.status = status;
      
      const response = await api.get(ADMIN_ENDPOINT, { 
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Admin courses response:', response);
      
      if (!response.data) {
        console.error('No response data received');
        throw new Error('Invalid response format from server');
      }
      
      console.log('Raw response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));
      
      // Handle backend response format (using sendResponse utility)
      let coursesData = [];
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        // Backend uses sendResponse format: { success: true, data: [...], message: "..." }
        coursesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // If response.data is directly an array (fallback)
        coursesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // If response.data.data is an array (another fallback)
        coursesData = response.data.data;
      } else {
        // Fallback to empty array
        coursesData = [];
      }
      
      console.log('Extracted courses data:', coursesData);
      console.log('Courses data type:', typeof coursesData);
      console.log('Courses data is array:', Array.isArray(coursesData));
      
      // If we still don't have valid data, return empty array
      if (coursesData.length === 0) {
        console.warn('No courses data received, returning empty array');
        coursesData = [];
      }
      
      return {
        data: coursesData,
        meta: { total: coursesData.length, page, limit, totalPages: 1 }
      };
    } catch (error) {
      console.error('Error fetching admin courses:', error);
      
      // Log detailed error information
      if ((error as any)?.response) {
        console.error('Response error:', {
          status: (error as any).response.status,
          statusText: (error as any).response.statusText,
          data: (error as any).response.data
        });
        
        // Handle authentication errors specifically
        if ((error as any).response.status === 401) {
          toast.error('Please log in as an admin to access this page');
          throw new Error('Authentication required');
        } else if ((error as any).response.status === 403) {
          toast.error('Admin access required');
          throw new Error('Admin access required');
        }
      } else if ((error as any)?.request) {
        console.error('Request error:', (error as any).request);
      } else {
        console.error('Error message:', error instanceof Error ? error.message : String(error));
      }
      
      toast.error('Failed to fetch courses. Please try again.');
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  },

  /**
   * Get a single course by ID (admin version)
   */
  async getCourseByIdAdmin(id: string | number): Promise<Course> {
    try {
      const response = await api.get(`${ADMIN_ENDPOINT}/${id}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.data) {
        throw new Error('Invalid course data received from server');
      }
      
      // Extract course data from backend response format
      const courseData = response.data.success && response.data.data ? response.data.data : response.data;
      
      // Transform the response data for the frontend
      return {
        ...courseData,
        ...transformArrayFields(courseData)
      };
    } catch (error) {
      // Handle authentication errors specifically
      if ((error as any)?.response?.status === 401) {
        toast.error('Please log in as an admin to view course details');
        throw new Error('Authentication required');
      } else if ((error as any)?.response?.status === 403) {
        toast.error('Admin access required to view course details');
        throw new Error('Admin access required');
      } else if ((error as any)?.response?.status === 404) {
        toast.error('Course not found');
        throw new Error('Course not found');
      }
      
      return handleApiError(error, `fetch course with ID ${id}`);
    }
  },

  /**
   * Upload course thumbnail
   */
  async uploadThumbnail(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return { url: response.data.url };
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw new Error('Failed to upload thumbnail');
    }
  },

  /**
   * Toggle course publish status
   */
  async togglePublishStatus(id: number): Promise<Course> {
    try {
      const response = await api.patch(`${COURSES_ENDPOINT}/${id}/toggle-publish`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `toggle publish status for course ${id}`);
    }
  },

  /**
   * Get all courses (admin version)
   */
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await api.get(ADMIN_ENDPOINT);
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching all courses:', error);
      toast.error('Failed to fetch courses');
      return [];
    }
  },

  /**
   * Get user's enrolled courses
   */
  async getMyCourses(): Promise<Course[]> {
    try {
      const response = await api.get<{ data: Course[] }>(`${ADMIN_ENDPOINT}`);
      return response.data.data; // Access the data property of the response
    } catch (error) {
      return handleApiError(error, 'fetch enrolled courses');
    }
  },

  /**
   * Enroll in a course
   */
  async enrollInCourse(courseId: string | number): Promise<void> {
    try {
      await api.post(`${COURSES_ENDPOINT}/${courseId}/enroll`);
    } catch (error) {
      handleApiError(error, `enroll in course ${courseId}`);
    }
  }
};
