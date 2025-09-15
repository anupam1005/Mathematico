// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  isActive: boolean;
  role: 'admin' | 'instructor' | 'student';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  limit?: number;
}

// Course related types
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  thumbnailUrl?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  category: string;
  class: string;
  subject: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'draft' | 'active' | 'archived';
  isPublished: boolean;
  isFeatured: boolean;
  instructorId?: string;
  instructor?: User;
  modules?: Module[];
  enrollments?: any[];
  whatYouWillLearn?: string[];
  whoIsThisFor?: string[];
  topics?: string[];
  requirements?: string; // Added missing property
  students: number; // Changed from User[] to number
  createdAt: string;
  updatedAt: string;
}

// Book related types
export interface Book {
  id: string;
  title: string;
  slug: string;
  description?: string;
  author?: string;
  publisher?: string;
  category?: string;
  subject?: string;
  class?: string;
  level?: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
  coverImageUrl?: string;
  pdfUrl?: string;
  pages?: number;
  isbn?: string;
  status: 'draft' | 'active' | 'archived';
  isPublished: boolean;
  isFeatured: boolean;
  downloads: number;
  tags?: string[];
  tableOfContents?: string;
  summary?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

// Live Class related types
export interface LiveClass {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string;
  subject?: string;
  class?: string;
  level?: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
  thumbnailUrl?: string;
  meetingUrl?: string;
  meetingId?: string;
  meetingPassword?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration: number; // in minutes
  maxStudents: number;
  enrolledStudents: number;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  isPublished: boolean;
  isFeatured: boolean;
  isRecordingEnabled: boolean;
  recordingUrl?: string;
  topics?: string[];
  prerequisites?: string;
  materials?: string;
  notes?: string;
  instructorId: string;
  instructor?: User;
  courseId: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

// Module related types
export interface Module {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  course?: Course;
  lessons?: Lesson[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Lesson related types
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  moduleId: string;
  module?: Module;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enrollment related types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  user?: User;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

// Dashboard related types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalBooks: number;
  totalLiveClasses: number;
  activeUsers: number;
  totalEnrollments: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

// Admin related types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  totalRevenue: number;
  monthlyRevenue: number[];
}

// Auth related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

// API Response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AdminSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  maintenance_mode: boolean;
  user_registration: boolean;
  email_notifications: boolean;
  default_currency: string;
  timezone: string;
}
