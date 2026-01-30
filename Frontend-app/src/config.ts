// Centralized API Configuration for Mobile
// Production-only configuration - no local development URLs

// Production API Base URL
export const API_BASE_URL = 'https://mathematico-backend-new.vercel.app';

// API Configuration
export const API_CONFIG = {
  auth: `${API_BASE_URL}/api/v1/auth`,
  student: `${API_BASE_URL}/api/v1`,
  admin: `${API_BASE_URL}/api/v1/admin`,
  mobile: `${API_BASE_URL}/api/v1/mobile`,
  baseUrl: `${API_BASE_URL}/api/v1`,
};

// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'INR',
  symbol: '₹',
  code: 'INR'
};

// Backend URL utility function
export const getBackendUrl = async (): Promise<string> => {
  return API_BASE_URL;
};

