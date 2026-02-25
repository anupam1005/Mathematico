// Production debugging utilities
export const PRODUCTION_DEBUG = {
  // Enable detailed logging in production builds
  enabled: true,
  
  log: (tag: string, message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[${tag}] ${message}`, data);
    } else {
      // In production, still log critical errors
      console.log(`[${tag}] ${message}`, data);
    }
  },
  
  error: (tag: string, message: string, error?: any) => {
    console.error(`[${tag}] ERROR: ${message}`, error);
  },
  
  api: (method: string, url: string, status?: number) => {
    console.log(`[API] ${method} ${url} - Status: ${status || 'pending'}`);
  },
  
  auth: (action: string, success: boolean, details?: any) => {
    console.log(`[AUTH] ${action} - ${success ? 'SUCCESS' : 'FAILED'}`, details);
  }
};

// Crash detection and reporting
export const CRASH_DETECTION = {
  detectInitError: (error: any) => {
    PRODUCTION_DEBUG.error('CRASH_DETECTION', 'App initialization error', error);
    
    // Check for specific crash patterns
    if (error?.message?.includes('Cannot assign to read only property')) {
      PRODUCTION_DEBUG.error('CRASH_DETECTION', 'Hermes read-only property error detected', {
        error: error.message,
        stack: error.stack,
        fix: 'Update safeError.ts to avoid accessing error.code'
      });
    }
    
    if (error?.message?.includes('EXPO_PUBLIC_API_BASE_URL')) {
      PRODUCTION_DEBUG.error('CRASH_DETECTION', 'Environment variable injection failure', {
        error: error.message,
        fix: 'Check eas.json environment configuration'
      });
    }
    
    // NEW: Detect Constants.expoConfig undefined crashes
    if (error?.message?.includes('expoConfig') || error?.message?.includes('Constants')) {
      PRODUCTION_DEBUG.error('CRASH_DETECTION', 'Constants.expoConfig undefined crash detected', {
        error: error.message,
        stack: error.stack,
        fix: 'Constants.expoConfig access fixed in config.ts, apiPaths.ts, apiClient.ts'
      });
    }
    
    // NEW: Detect Hermes minification issues
    if (error?.message?.includes('undefined') || error?.message?.includes('null')) {
      PRODUCTION_DEBUG.error('CRASH_DETECTION', 'Potential null/undefined access crash', {
        error: error.message,
        stack: error.stack,
        fix: 'Check for undefined property access in production'
      });
    }
  },
  
  // NEW: Log Constants availability at startup
  logConstantsState: () => {
    try {
      const Constants = require('expo-constants').default;
      PRODUCTION_DEBUG.log('CRASH_DETECTION', 'Constants state check', {
        hasConstants: !!Constants,
        hasExpoConfig: !!Constants?.expoConfig,
        hasExtra: !!Constants?.expoConfig?.extra,
        extraKeys: Constants?.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : []
      });
    } catch (error) {
      PRODUCTION_DEBUG.error('CRASH_DETECTION', 'Constants import failed', error);
    }
  }
};
