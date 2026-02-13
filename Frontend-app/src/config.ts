// Normalize API base URL - ensure no trailing slash for consistency
const getApiBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL || "https://mathematico-backend-new.vercel.app";
  // Remove trailing slash for consistency
  return url.replace(/\/+$/, '');
};

export const API_BASE_URL = getApiBaseUrl();

// Validate API URL in development
if (__DEV__ && !API_BASE_URL) {
  console.warn('⚠️ API_BASE_URL is not set. API calls may fail.');
}
