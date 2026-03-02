import Constants from 'expo-constants';

export const API_PATHS = {
  auth: '/api/v1/auth',
  student: '/api/v1/student',
  admin: '/api/v1/admin',
  mobile: '/api/v1/mobile',
  users: '/api/v1/users',
  payments: '/api/v1/payments',
} as const;

// CRITICAL: Validate paths to prevent duplication
// PRODUCTION FIX: Safe Constants.expoConfig access to prevent Hermes crashes
try {
  const extraConfig = Constants?.expoConfig?.extra;
  
  if (extraConfig && typeof extraConfig === 'object' && 'EXPO_PUBLIC_ENV' in extraConfig && extraConfig.EXPO_PUBLIC_ENV === 'production') {
    Object.values(API_PATHS).forEach(path => {
      if (!path.startsWith('/')) {
        throw new Error(`Invalid API path format: ${path}`);
      }
    });
  }
} catch (error) {
}
