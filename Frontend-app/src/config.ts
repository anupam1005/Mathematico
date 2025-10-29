// Centralized API Configuration for Mobile Devices
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_BACKEND = 'https://mathematico-backend-new.vercel.app'; // ✅ Your Vercel serverless backend
const LOCAL_EMULATOR = 'http://10.0.2.2:5002'; // Android emulator loopback
const DEVICE_IP = 'http://10.148.37.132:5002'; // Physical device IP
const LOCAL_DEV = 'http://localhost:5002'; // Local development
const LOCAL_MOBILE = 'http://10.148.37.132:5002'; // Mobile development - use your computer's IP
const localIp = (process.env.REACT_NATIVE_LOCAL_BACKEND || '').trim();
const USE_LOCAL_BACKEND = process.env.REACT_NATIVE_USE_LOCAL_BACKEND === 'true';

// Function to determine if running on Play Store release
const isPlayStoreRelease = () => {
  // More robust detection for production builds
  const isProduction = process.env.NODE_ENV === 'production' || !__DEV__;
  const isAndroid = Platform.OS === 'android';
  const isNotLocal = !USE_LOCAL_BACKEND;
  
  console.log('🔍 Production detection:', {
    NODE_ENV: process.env.NODE_ENV,
    __DEV__: __DEV__,
    isProduction,
    isAndroid,
    isNotLocal,
    isPlayStoreRelease: isProduction && isAndroid && isNotLocal
  });
  
  return isProduction && isAndroid && isNotLocal;
};

// Function to get the appropriate backend URL
export const getBackendUrl = async () => {
  try {
    console.log('🔍 Determining backend URL...');
    
    // Check if user has manually set a backend preference
    const userBackendPreference = await AsyncStorage.getItem('userBackendPreference');
    
    if (userBackendPreference) {
      console.log('🔍 Using user backend preference:', userBackendPreference);
      return userBackendPreference;
    }
    
    // If running on Play Store release, always use production backend
    if (isPlayStoreRelease()) {
      console.log('🔍 Play Store release detected, using production backend');
      return PROD_BACKEND;
    }
    
    // In development mode, use local backend
    if (__DEV__) {
      console.log('🔍 Development mode detected');
      // For Android emulator
      if (Platform.OS === 'android' && Platform.constants.uiMode.includes('emulator')) {
        console.log('🔍 Android emulator detected, using local emulator backend');
        return LOCAL_EMULATOR;
      }
      
      // For physical device testing
      if (Platform.OS === 'android') {
        console.log('🔍 Android device detected, using local mobile backend');
        return LOCAL_MOBILE;
      }
      
      // Default local development
      console.log('🔍 Default local development, using local backend');
      return LOCAL_DEV;
    }
    
    // Default to production for any other case
    console.log('🔍 Default case, using production backend');
    return PROD_BACKEND;
  } catch (error) {
    console.error('Error determining backend URL:', error);
    console.log('🔍 Error fallback, using production backend');
    return PROD_BACKEND; // Fallback to production
  }
};

// Default backend URL (will be updated asynchronously)
let BACKEND: string = PROD_BACKEND; // Default to production

// Override with environment variables if needed
if (process.env.REACT_NATIVE_BACKEND_URL) {
  BACKEND = process.env.REACT_NATIVE_BACKEND_URL;
}

// Create a function to get the API configuration with the current backend URL
export const getApiConfig = (backendUrl: string = BACKEND) => {
  const url = backendUrl.replace(/\/$/, '');
  return {
    auth: `${url}/api/v1/auth`,
    student: `${url}/api/v1`,
    admin: `${url}/api/v1/admin`,
    mobile: `${url}/api/v1/mobile`,
    baseUrl: `${url}/api/v1`,
    isDev: process.env.NODE_ENV !== 'production',
    httpLocalEmulator: LOCAL_EMULATOR + '/api/v1',
  };
};

// Initialize API_CONFIG with default backend
export let API_CONFIG = getApiConfig(BACKEND);
export let API_BASE_URL = API_CONFIG.baseUrl;

// Initialize backend URL asynchronously
(async () => {
  try {
    const backendUrl = await getBackendUrl();
    BACKEND = backendUrl;
    API_CONFIG = getApiConfig(BACKEND);
    API_BASE_URL = API_CONFIG.baseUrl;
    console.log('Backend URL initialized:', BACKEND);
  } catch (error) {
    console.error('Failed to initialize backend URL:', error);
  }
})();

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
  environment: __DEV__ ? 'development' : 'production',
  localIp,
  useLocal: USE_LOCAL_BACKEND,
  nodeEnv: process.env.NODE_ENV,
  serverless: !__DEV__,
});
