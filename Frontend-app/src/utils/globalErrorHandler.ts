/**
 * Global Error Handler
 * Prevents "Cannot assign to read-only property 'NONE'" errors
 * by intercepting ALL console methods and safely extracting error messages
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Safe error message extractor
const extractSafeMessage = (arg: any): any => {
  if (arg === null || arg === undefined) {
    return arg;
  }
  
  // If it's an Error object or has a message property
  if (arg instanceof Error || (typeof arg === 'object' && 'message' in arg)) {
    try {
      const message = arg.message || String(arg);
      const code = arg.code || 'UNKNOWN';
      const stack = arg.stack || '';
      
      return `Error: ${message} (Code: ${code})`;
    } catch (e) {
      return 'Error: Unable to extract error message';
    }
  }
  
  // If it's a regular object, try to stringify safely
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return '[Object]';
    }
  }
  
  return arg;
};

// Override console.error to safely handle error objects
console.error = (...args: any[]) => {
  const safeArgs = args.map(extractSafeMessage);
  originalConsoleError.apply(console, safeArgs);
};

// Override console.warn to safely handle error objects
console.warn = (...args: any[]) => {
  const safeArgs = args.map(extractSafeMessage);
  originalConsoleWarn.apply(console, safeArgs);
};

// Override console.log to safely handle error objects
console.log = (...args: any[]) => {
  const safeArgs = args.map(extractSafeMessage);
  originalConsoleLog.apply(console, safeArgs);
};

// Global error handler for uncaught errors
if (typeof ErrorUtils !== 'undefined') {
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error('Global Error Handler:', extractSafeMessage(error));
    
    // Call original handler if it exists
    if (originalErrorHandler) {
      try {
        originalErrorHandler(error, isFatal);
      } catch (e) {
        console.error('Error in original error handler:', extractSafeMessage(e));
      }
    }
  });
}

export const setupGlobalErrorHandler = () => {
  console.log('Global error handler initialized');
};
