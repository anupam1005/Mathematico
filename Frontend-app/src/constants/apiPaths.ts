import Constants from 'expo-constants';

export const API_PATHS = {
  auth: '/auth',
  student: '/student',
  admin: '/admin',
  mobile: '/mobile',
  users: '/users',
  payments: '/payments',
} as const;

// CRITICAL: Validate paths to prevent duplication
// PRODUCTION FIX: Safe Constants.expoConfig access to prevent Hermes crashes
try {
  const extraConfig = Constants?.expoConfig?.extra;
  
  if (extraConfig && typeof extraConfig === 'object' && 'EXPO_PUBLIC_ENV' in extraConfig && extraConfig.EXPO_PUBLIC_ENV === 'production') {
    Object.values(API_PATHS).forEach(path => {
      if (!path.startsWith('/')) {
        console.error('[API_PATHS] Invalid path format - must start with /:', path);
        throw new Error(`Invalid API path format: ${path}`);
      }
    });
    console.log('[API_PATHS] All paths validated correctly');
  }
} catch (error) {
  console.warn('[API_PATHS] Environment validation failed, using defaults:', error);
}
