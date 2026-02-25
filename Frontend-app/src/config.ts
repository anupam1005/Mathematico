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
    console.warn('[CONFIG] Using fallback API URL - expoConfig.extra not available');
  }
} catch (error) {
  // Ultimate fallback if Constants itself is unavailable
  API_BASE_URL_ENV = 'https://mathematico-backend-new.vercel.app/api/v1';
  console.error('[CONFIG] Constants access failed, using ultimate fallback:', error);
}

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
console.log('[CONFIG] Environment detection:', {
  hasConstants: !!Constants,
  hasExpoConfig: !!Constants?.expoConfig,
  hasExtra: !!Constants?.expoConfig?.extra,
  API_BASE_URL_set: !!API_BASE_URL_ENV
});
