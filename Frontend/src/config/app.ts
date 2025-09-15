/**
 * Application-wide configuration
 */

// Application information
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Educational Platform',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENV: import.meta.env.VITE_APP_ENV || 'production',
  DEBUG: import.meta.env.VITE_APP_DEBUG === 'true',
  DOMAIN: import.meta.env.VITE_APP_DOMAIN || 'mathematico-frontend.vercel.app',
};

// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://mathematico-backend-new.vercel.app/api/v1',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
  WITH_CREDENTIALS: true,
};

// Authentication configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user_data',
  TOKEN_REFRESH_INTERVAL: parseInt(
    import.meta.env.VITE_TOKEN_REFRESH_INTERVAL || '840000',
    10
  ), // 14 minutes
  SESSION_TIMEOUT: parseInt(
    import.meta.env.VITE_SESSION_TIMEOUT || '3600000',
    10
  ), // 1 hour
};

// Feature flags
export const FEATURE_FLAGS = {
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  DEBUG_TOOLS: import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_SORT_BY: 'createdAt',
  DEFAULT_SORT_ORDER: 'desc' as const,
};

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (length: number) => `Must be at least ${length} characters`,
  MAX_LENGTH: (length: number) => `Must be at most ${length} characters`,
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_CREDENTIALS: 'Invalid email or password',
};

// Date and time formats
export const DATE_TIME_FORMATS = {
  DATE: 'MMM d, yyyy',
  TIME: 'h:mm a',
  DATE_TIME: 'MMM d, yyyy h:mm a',
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATE_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const;

// Course statuses
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// Lesson types
export const LESSON_TYPES = {
  VIDEO: 'video',
  ARTICLE: 'article',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
} as const;

// Default settings
export const DEFAULT_SETTINGS = {
  THEME: 'light',
  LANGUAGE: 'en',
  NOTIFICATIONS: true,
  EMAIL_NOTIFICATIONS: true,
  DARK_MODE: false,
};

// Export all configs as a single object
export const CONFIG = {
  APP: APP_CONFIG,
  API: API_CONFIG,
  AUTH: AUTH_CONFIG,
  FEATURES: FEATURE_FLAGS,
  PAGINATION,
  VALIDATION: VALIDATION_MESSAGES,
  DATE_TIME: DATE_TIME_FORMATS,
  ROLES: USER_ROLES,
  COURSE_STATUS,
  LESSON_TYPES,
  SETTINGS: DEFAULT_SETTINGS,
} as const;

export default CONFIG;
