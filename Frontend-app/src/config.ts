// Centralized API Configuration for Mobile

// Get environment variables with fallbacks
const ENV = {
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://mathematico-backend-new.vercel.app',
  ENV: process.env.REACT_APP_ENV || 'production',
  LOCAL_BACKEND: process.env.REACT_NATIVE_LOCAL_BACKEND || 'http://10.0.2.2:5002',
  USE_LOCAL_BACKEND: process.env.REACT_NATIVE_USE_LOCAL_BACKEND === 'true',
};

// Development configurations
const LOCAL_EMULATOR = ENV.LOCAL_BACKEND;
const DEVICE_IP = 'http://10.148.37.132:5002';
const LOCAL_DEV = 'http://localhost:5002';
const LOCAL_MOBILE = 'http://10.148.37.132:5002';

// Set up environment detection - default to production for mobile apps
const isDev = (process.env.NODE_ENV === 'development' || ENV.ENV === 'development') && !ENV.USE_LOCAL_BACKEND;

// Set backend URL - use production URL by default, local only if explicitly in dev mode
let BACKEND = isDev ? LOCAL_DEV : ENV.BACKEND_URL;

// Force HTTPS in production
if (!isDev && !BACKEND.startsWith('https://')) {
  console.warn('⚠️ Production backend must use HTTPS!');
  BACKEND = BACKEND.replace(/^http:\/\//i, 'https://');
}

// API Configuration
export const API_CONFIG = {
  auth: `${BACKEND.replace(/\/$/, '')}/api/v1/auth`,
  student: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  admin: `${BACKEND.replace(/\/$/, '')}/api/v1/admin`,
  mobile: `${BACKEND.replace(/\/$/, '')}/api/v1/mobile`,
  baseUrl: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  isDev,
  httpLocalEmulator: `${LOCAL_EMULATOR}/api/v1`,
};

// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'INR',
  symbol: '₹',
  code: 'INR'
};

// Backend URL utility function for dynamic URL resolution
export const getBackendUrl = async (): Promise<string> => {
  return BACKEND.replace(/\/$/, '');
};

// Log configuration in development
if (isDev) {
  console.log('⚙️ Environment Configuration:', {
    env: ENV.ENV,
    backend: BACKEND,
    isDev,
    apiConfig: {
      auth: API_CONFIG.auth,
      mobile: API_CONFIG.mobile,
      admin: API_CONFIG.admin,
    },
  });
}
