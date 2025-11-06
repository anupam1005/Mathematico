// Centralized API Configuration for Mobile Devices
import { Platform } from 'react-native';

const PROD_BACKEND = 'https://mathematico-backend-new.vercel.app'; // ✅ Your Vercel serverless backend
const LOCAL_EMULATOR = 'http://10.0.2.2:5002'; // Android emulator loopback
const DEVICE_IP = 'http://10.148.37.132:5002'; // Physical device IP
const LOCAL_DEV = 'http://localhost:5002'; // Local development
const LOCAL_MOBILE = 'http://10.148.37.132:5002'; // Mobile development - use your computer's IP
const localIp = (process.env.REACT_NATIVE_LOCAL_BACKEND || '').trim();
const USE_LOCAL_BACKEND = process.env.REACT_NATIVE_USE_LOCAL_BACKEND === 'true';

// Decide backend URL
let BACKEND: string;

// Automatically choose backend based on environment
if (__DEV__) {
  // Development mode - use localhost
  BACKEND = LOCAL_DEV; // Use localhost for development
} else {
  // Production mode - use serverless backend
  BACKEND = PROD_BACKEND; // Use Vercel serverless for production
}

// Override with environment variables if needed
if (process.env.REACT_NATIVE_BACKEND_URL) {
  BACKEND = process.env.REACT_NATIVE_BACKEND_URL;
}

export const API_CONFIG = {
  auth: `${BACKEND.replace(/\/$/, '')}/api/v1/auth`,
  student: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  admin: `${BACKEND.replace(/\/$/, '')}/api/v1/admin`,
  mobile: `${BACKEND.replace(/\/$/, '')}/api/v1/mobile`,
  baseUrl: `${BACKEND.replace(/\/$/, '')}/api/v1`,
  isDev: process.env.NODE_ENV !== 'production',
  httpLocalEmulator: LOCAL_EMULATOR + '/api/v1',
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

// Backend URL utility function for dynamic URL resolution
export const getBackendUrl = async (): Promise<string> => {
  // Return the current backend URL based on environment
  return BACKEND.replace(/\/$/, '');
};

console.log('📡 API Configuration:', {
  auth: API_CONFIG.auth,
  student: API_CONFIG.student,
  admin: API_CONFIG.admin,
  mobile: API_CONFIG.mobile,
  backend: BACKEND,
  environment: __DEV__ ? 'development' : 'production',
  localIp,
  useLocal: USE_LOCAL_BACKEND,
  nodeEnv: process.env.NODE_ENV,
  serverless: !__DEV__,
});
