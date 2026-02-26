import Constants from 'expo-constants';

// PRODUCTION API BASE URL - Production-safe environment variable handling
// CRITICAL FIX: Prevent Constants.expoConfig undefined crashes in Hermes AAB builds
let API_BASE_URL_ENV: string;

try {
  // Safe access with multiple fallback layers
  const extraConfig = Constants?.expoConfig?.extra;
  
  if (extraConfig && typeof extraConfig === 'object' && 'EXPO_PUBLIC_API_BASE_URL' in extraConfig) {
    API_BASE_URL_ENV = extraConfig.EXPO_PUBLIC_API_BASE_URL;
  } else {
    // Fallback for production builds where expoConfig.extra is undefined
    API_BASE_URL_ENV = 'https://mathematico-backend-new.vercel.app/api/v1';
  }
} catch (error) {
  // Ultimate fallback if Constants itself is unavailable
  API_BASE_URL_ENV = 'https://mathematico-backend-new.vercel.app/api/v1';
}

export const API_BASE_URL = API_BASE_URL_ENV;

// Production guard: Ensure only production domain is used
if (API_BASE_URL && !API_BASE_URL.includes('mathematico-backend-new.vercel.app')) {
  throw new Error('Invalid production API domain');
}

// CRITICAL: Ensure URL doesn't already include /api/v1 path
if (API_BASE_URL.endsWith('/api/v1')) {
} else if (API_BASE_URL.endsWith('/api')) {
  throw new Error('Invalid API_BASE_URL format - should end with /api/v1');
}

// Debug: Log the final API base URL in production builds
