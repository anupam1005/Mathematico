/**
 * Global Error Handler - MINIMAL VERSION
 * Prevents "Cannot assign to read-only property 'NONE'" errors
 * by NEVER accessing any properties on error objects directly
 */

// Store original console methods BEFORE any modifications
const _originalError = console.error;
const _originalWarn = console.warn;
const _originalLog = console.log;

// ULTRA SAFE: Convert anything to a safe string without accessing ANY properties
const toSafeString = (arg: any): string => {
  // Primitives are always safe
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number') return String(arg);
  if (typeof arg === 'boolean') return String(arg);
  
  // For ANY object (including Error), just return a type indicator
  // NEVER access properties - this prevents the NONE error
  if (typeof arg === 'object') {
    return '[Object]';
  }
  
  // Functions
  if (typeof arg === 'function') {
    return '[Function]';
  }
  
  // Symbol
  if (typeof arg === 'symbol') {
    return '[Symbol]';
  }
  
  return '[Unknown]';
};

// Override console methods to use safe string conversion
console.error = (...args: any[]) => {
  try {
    const safeArgs = args.map(toSafeString);
    _originalError.apply(console, safeArgs);
  } catch (e) {
    _originalError('[Error logging failed]');
  }
};

console.warn = (...args: any[]) => {
  try {
    const safeArgs = args.map(toSafeString);
    _originalWarn.apply(console, safeArgs);
  } catch (e) {
    _originalWarn('[Warn logging failed]');
  }
};

console.log = (...args: any[]) => {
  try {
    const safeArgs = args.map(toSafeString);
    _originalLog.apply(console, safeArgs);
  } catch (e) {
    _originalLog('[Log failed]');
  }
};

// Global ErrorUtils handler - NEVER access error properties
declare const ErrorUtils: any;
if (typeof ErrorUtils !== 'undefined') {
  try {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      // Just log that an error occurred - don't try to extract anything
      _originalError('App Error:', isFatal ? '(Fatal)' : '(Non-fatal)');
      
      // Call original handler with a safe new Error object
      if (originalHandler) {
        try {
          originalHandler(new Error('Application error occurred'), isFatal);
        } catch (e) {
          // Ignore
        }
      }
    });
  } catch (e) {
    // Ignore setup errors
  }
}

export const setupGlobalErrorHandler = () => {
  _originalLog('Global error handler active');
};
