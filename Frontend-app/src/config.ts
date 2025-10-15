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
