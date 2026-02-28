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

// Vercel-optimized config with intelligent fallback
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || // EAS build environment variable
  API_BASE_URL_ENV || // Expo Constants (app.config.js)
  'https://mathematico-backend-new.vercel.app/api/v1'; // Production Vercel URL

// PRODUCTION DEBUG: Log the final API base URL with environment context
console.log('API_BASE_URL Configuration:', {
  finalUrl: API_BASE_URL,
  hasProcessEnv: !!process.env.EXPO_PUBLIC_API_BASE_URL,
  hasConstantsEnv: !!API_BASE_URL_ENV,
  environment: process.env.NODE_ENV || 'development'
});

// CRITICAL: Ensure URL doesn't already include /api/v1 path duplication
if (API_BASE_URL.endsWith('/api/v1')) {
  console.log('✅ API_BASE_URL format correct: ends with /api/v1');
} else if (API_BASE_URL.endsWith('/api')) {
  console.warn('⚠️ WARNING: API_BASE_URL should end with /api/v1, not /api');
} else {
  console.log('ℹ️ API_BASE_URL format: using default production URL');
}
