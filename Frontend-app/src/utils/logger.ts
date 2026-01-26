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
    const safeArgs = args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      return '[Warning]';
    });
    console.warn(...safeArgs);
  },

  error: (...args: any[]) => {
    // Always show errors, even in production
    // NEVER access any properties on objects - just convert to string or skip
    const safeArgs = args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      // For ANY object, just return a placeholder - never access properties
      return '[Error]';
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
    // NEVER access any properties on error objects
    console.error('[CRITICAL]', message, error ? '[Error]' : '');
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
