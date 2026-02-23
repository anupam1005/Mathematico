// PRODUCTION API BASE URL - Uses environment variables for EAS builds
const API_BASE_URL_ENV = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://mathematico-backend-new.vercel.app/api/v1';

export const API_BASE_URL = API_BASE_URL_ENV;

// Production guard: Ensure only production domain is used
if (API_BASE_URL && !API_BASE_URL.includes('mathematico-backend-new.vercel.app')) {
  console.error('[CONFIG] Invalid production API domain detected:', API_BASE_URL);
  throw new Error('Invalid production API domain');
}

// CRITICAL: Ensure URL doesn't already include /api/v1 path
if (API_BASE_URL.endsWith('/api/v1')) {
  console.log('[CONFIG] API_BASE_URL already includes /api/v1 path');
} else if (API_BASE_URL.endsWith('/api')) {
  console.error('[CONFIG] API_BASE_URL ends with /api but missing /v1 - this will cause path duplication');
  throw new Error('Invalid API_BASE_URL format - should end with /api/v1');
}

// Debug: Log the final API base URL in production builds
console.log('[CONFIG] Final API Base URL:', API_BASE_URL);
