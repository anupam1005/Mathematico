/**
 * API endpoints configuration
 * This file centralizes all API endpoints used in the application
 */

// Note: The base URL is already set in the axios instance (http://localhost:5000/api/v1)
// So we don't need to include /api/v1 in the endpoint paths

const AUTH = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  SEND_VERIFICATION_EMAIL: '/auth/send-verification-email',
};

const USERS = {
  BASE: '/users',
  BY_ID: (id: string | number) => `/users/${id}`,
  PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
  UPLOAD_AVATAR: '/users/upload-avatar',
};

const COURSES = {
  BASE: '/courses',
  BY_ID: (id: string | number) => `/courses/${id}`,
  ENROLL: (id: string | number) => `/courses/${id}/enroll`,
  UNENROLL: (id: string | number) => `/courses/${id}/unenroll`,
  MY_COURSES: '/courses/my-courses',
  SEARCH: '/courses/search',
};

const MODULES = {
  BASE: '/modules',
  BY_ID: (id: string | number) => `/modules/${id}`,
  BY_COURSE: (courseId: string | number) => `/courses/${courseId}/modules`,
};

const LESSONS = {
  BASE: '/lessons',
  BY_ID: (id: string | number) => `/lessons/${id}`,
  BY_MODULE: (moduleId: string | number) => `/modules/${moduleId}/lessons`,
  COMPLETE: (id: string | number) => `/lessons/${id}/complete`,
};

const ENROLLMENTS = {
  BASE: '/enrollments',
  BY_ID: (id: string | number) => `/enrollments/${id}`,
  MY_ENROLLMENTS: '/enrollments/my-enrollments',
  COURSE_ENROLLMENTS: (courseId: string | number) => `/courses/${courseId}/enrollments`,
};

const UPLOADS = {
  BASE: '/uploads',
  UPLOAD: '/uploads',
  BY_ID: (id: string) => `/uploads/${id}`,
};

const API_ENDPOINTS = {
  AUTH,
  USERS,
  COURSES,
  MODULES,
  LESSONS,
  ENROLLMENTS,
  UPLOADS,
};

export default API_ENDPOINTS;
