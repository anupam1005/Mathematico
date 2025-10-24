// Centralized API Configuration for Mobile Devices
import { Platform } from 'react-native';

// Environment Configuration
const ENV = {
  // Production backend (Vercel)
  PROD: {
    BASE_URL: 'https://mathematico-backend-new.vercel.app',
    API_VERSION: 'v1',
  },
  // Local development
  LOCAL: {
    BASE_URL: 'http://localhost:5000', // Make sure this matches your backend port
    API_VERSION: 'v1',
  },
  // Android emulator
  EMULATOR: {
    BASE_URL: 'http://10.0.2.2:5000', // Standard Android emulator localhost
    API_VERSION: 'v1',
  },
};

// Determine environment
const isDev = __DEV__; // React Native's way to check for development mode
const isAndroid = Platform.OS === 'android';

// Select the appropriate backend URL
let BACKEND: string;

if (isDev) {
  // In development, use localhost or emulator
  BACKEND = isAndroid ? ENV.EMULATOR.BASE_URL : ENV.LOCAL.BASE_URL;
} else {
  // In production, use the production backend
  BACKEND = ENV.PROD.BASE_URL;
}

console.log(`Using backend: ${BACKEND}`);

// Create base API configuration
export const API_CONFIG = {
  auth: `${BACKEND.replace(/\/$/, '')}/api/v1/auth`,
  student: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  admin: `${BACKEND.replace(/\/$/, '')}/api/v1/admin`,
  mobile: `${BACKEND.replace(/\/$/, '')}/api/v1/mobile`,
  baseUrl: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  isDev: __DEV__, // Use React Native's __DEV__ flag
  httpLocalEmulator: isAndroid ? ENV.EMULATOR.BASE_URL + '/api/v1' : 'http://localhost:5000/api/v1',
};

export const API_BASE_URL = API_CONFIG.baseUrl;

// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'INR',
  symbol: '₹',
  code: 'INR'
};

// Razorpay Configuration - Now fetched securely from backend
// No sensitive keys stored in frontend code

console.log('📡 API Configuration:', {
  auth: API_CONFIG.auth,
  student: API_CONFIG.student,
  admin: API_CONFIG.admin,
  mobile: API_CONFIG.mobile,
  backend: BACKEND,
  isDev: API_CONFIG.isDev,
  platform: Platform.OS,
  nodeEnv: __DEV__ ? 'development' : 'production'
});
