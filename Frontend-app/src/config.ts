export const API_BASE_URL = 'https://mathematico-backend-new.vercel.app';

if (API_BASE_URL.includes('localhost') || API_BASE_URL.match(/\d+\.\d+\.\d+\.\d+/)) {
  throw new Error('Local API detected. Production only.');
}

export const API_PATHS = {
  auth: '/api/v1/auth',
  student: '/api/v1',
  admin: '/api/v1/admin',
  mobile: '/api/v1/mobile',
  base: '/api/v1',
};

// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'INR',
  symbol: '₹',
  code: 'INR'
};

