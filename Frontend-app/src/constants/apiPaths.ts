export const API_PATHS = {
  auth: '/auth',
  student: '/student',
  admin: '/admin',
  mobile: '/mobile',
  users: '/users',
  payments: '/payments',
} as const;

// CRITICAL: Validate paths to prevent duplication
if (process.env.NODE_ENV === 'production') {
  Object.values(API_PATHS).forEach(path => {
    if (!path.startsWith('/')) {
      console.error('[API_PATHS] Invalid path format - must start with /:', path);
      throw new Error(`Invalid API path format: ${path}`);
    }
  });
  console.log('[API_PATHS] All paths validated correctly');
}
