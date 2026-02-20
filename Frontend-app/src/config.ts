// Single production API base URL – no environment switching in app bundle
export const API_BASE_URL = 'https://mathematico-backend-new.vercel.app/api/v1';

// Production guard: Prevent non-production domains in release builds
if (!__DEV__ && !API_BASE_URL.includes('mathematico-backend-new.vercel.app')) {
  throw new Error('Invalid production API domain');
}

// Development logging only
if (__DEV__) {
  console.log('API Base URL:', API_BASE_URL);
}
