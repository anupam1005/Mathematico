/**
 * Production-safe logger utility
 * Automatically disables console logs in production builds
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const Logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    // Always show warnings, even in production
    console.warn(...args);
  },

  error: (...args: any[]) => {
    // Always show errors, even in production
    // Safely extract error messages to prevent frozen object issues
    const safeArgs = args.map(arg => {
      if (arg instanceof Error || (typeof arg === 'object' && arg !== null && 'message' in arg)) {
        return arg.message || String(arg);
      }
      return arg;
    });
    console.error(...safeArgs);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  // For critical production errors that need tracking
  critical: (message: string, error?: any) => {
    const safeError = error instanceof Error || (typeof error === 'object' && error !== null && 'message' in error)
      ? error.message || String(error)
      : error;
    console.error('[CRITICAL]', message, safeError);
    // TODO: Add error tracking service here (e.g., Sentry)
  }
};

// Disable console in production builds
if (!isDevelopment) {
  // Keep error and warn for critical issues
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

export default Logger;
