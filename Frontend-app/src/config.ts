import Constants from 'expo-constants';

// PRODUCTION API BASE URL - Production-safe environment variable handling
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

// Production-safe config with fallback
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  API_BASE_URL_ENV ||
  'https://mathematico-backend-new.vercel.app/api/v1';

// PRODUCTION DEBUG: Log the final API base URL
console.log('API_BASE_URL', API_BASE_URL);

// CRITICAL: Ensure URL doesn't already include /api/v1 path duplication
if (API_BASE_URL.endsWith('/api/v1')) {
  // Correct format - no action needed
} else if (API_BASE_URL.endsWith('/api')) {
  // Invalid format - should end with /api/v1
  console.warn('WARNING: API_BASE_URL should end with /api/v1, not /api');
}
