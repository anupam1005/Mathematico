import Constants from 'expo-constants';

// PRODUCTION API BASE URL - Vercel Optimized Configuration
// CRITICAL FIX: Prevent Constants.expoConfig undefined crashes in Hermes AAB builds
let API_BASE_URL_ENV: string | undefined;

try {
  // Safe access with multiple fallback layers
  const extraConfig = Constants?.expoConfig?.extra;
  
  if (extraConfig && typeof extraConfig === 'object' && 'EXPO_PUBLIC_API_BASE_URL' in extraConfig) {
    API_BASE_URL_ENV = extraConfig.EXPO_PUBLIC_API_BASE_URL;
  }
} catch (error) {
  // Constants access failed - will use fallback
}

// Production-safe API base URL configuration with guaranteed fallback
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || // EAS build environment variable
  API_BASE_URL_ENV || // Expo Constants (app.config.js)
  'https://mathematico-backend-new.vercel.app/api/v1'; // Production Vercel URL with full path

// PRODUCTION DEBUG: Log the final API base URL once during startup
console.log('API_BASE_URL:', API_BASE_URL);

// Validate the URL format for production safety
if (!API_BASE_URL || typeof API_BASE_URL !== 'string' || !API_BASE_URL.startsWith('http')) {
  console.error('Invalid API_BASE_URL detected, using production fallback');
  // Fallback to production URL if validation fails
  const fallbackUrl = 'https://mathematico-backend-new.vercel.app/api/v1';
  (API_BASE_URL as any) = fallbackUrl;
  console.log('API_BASE_URL (fallback):', fallbackUrl);
}
