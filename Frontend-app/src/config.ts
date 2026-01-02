<<<<<<< HEAD
// Centralized API Configuration for Mobile
import { Platform } from 'react-native';
import { Logger } from './utils/logger';

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
  Logger.warn('⚠️ Production backend must use HTTPS!');
  BACKEND = BACKEND.replace(/^http:\/\//i, 'https://');
}

// API Configuration
=======
// Centralized API Configuration for Mobile Devices
import { Platform } from 'react-native';

const PROD_BACKEND = 'https://mathematico-backend-new.vercel.app'; // ✅ Your Vercel serverless backend
const LOCAL_EMULATOR = 'http://10.0.2.2:5000'; // Android emulator loopback
const localIp = (process.env.REACT_NATIVE_LOCAL_BACKEND || '').trim();
const USE_LOCAL_BACKEND = process.env.REACT_NATIVE_USE_LOCAL_BACKEND === 'true';

// Decide backend URL
let BACKEND: string;

// Always use serverless backend (no need for local server)
if (USE_LOCAL_BACKEND && localIp) {
  // Only use local if explicitly configured
  BACKEND = `http://${localIp}:5000`;
} else {
  // ✅ Default to serverless backend (works everywhere)
  BACKEND = PROD_BACKEND;
}

>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
export const API_CONFIG = {
  auth: `${BACKEND.replace(/\/$/, '')}/api/v1/auth`,
  student: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  admin: `${BACKEND.replace(/\/$/, '')}/api/v1/admin`,
  mobile: `${BACKEND.replace(/\/$/, '')}/api/v1/mobile`,
  baseUrl: `${BACKEND.replace(/\/$/, '')}/api/v1`,
<<<<<<< HEAD
  isDev,
  httpLocalEmulator: `${LOCAL_EMULATOR}/api/v1`,
};

=======
  isDev: process.env.NODE_ENV !== 'production',
  httpLocalEmulator: LOCAL_EMULATOR + '/api/v1',
};

export const API_BASE_URL = API_CONFIG.baseUrl;

>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'INR',
  symbol: '₹',
  code: 'INR'
};

<<<<<<< HEAD
// Backend URL utility function for dynamic URL resolution
export const getBackendUrl = async (): Promise<string> => {
  return BACKEND.replace(/\/$/, '');
};

// Log configuration in development
if (isDev) {
  Logger.log('⚙️ Environment Configuration:', {
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
=======
console.log('📡 API Configuration:', {
  auth: API_CONFIG.auth,
  student: API_CONFIG.student,
  admin: API_CONFIG.admin,
  mobile: API_CONFIG.mobile,
  backend: BACKEND,
  localIp,
  useLocal: USE_LOCAL_BACKEND,
  nodeEnv: process.env.NODE_ENV,
  serverless: !USE_LOCAL_BACKEND,
});
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
