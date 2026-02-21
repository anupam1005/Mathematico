// PRODUCTION API BASE URL - HARDCODED FOR PLAY STORE RELEASE
// NO ENVIRONMENT SWITCHING - NO LOCALHOST - NO PREVIEW URLS
export const API_BASE_URL = 'https://mathematico-backend-new.vercel.app/api/v1';

// Production guard: Ensure only production domain is used
if (!API_BASE_URL.includes('mathematico-backend-new.vercel.app')) {
  throw new Error('Invalid production API domain');
}
