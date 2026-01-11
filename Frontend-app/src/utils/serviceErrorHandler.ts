// Lightweight service-specific error and logging helper
// NEVER access any properties on error objects to prevent NONE errors

type AnyError = any;

// Return a static safe error - NEVER access any properties on the error object
const toSafeError = (error: any) => ({
  message: 'An error occurred',
  code: 'UNKNOWN',
  response: null,
  config: null,
});

export interface ServiceLogger {
  handleError: (message: string, error?: AnyError) => void;
  logInfo: (message: string, ...args: any[]) => void;
  logWarning: (message: string, ...args: any[]) => void;
}

export const createServiceErrorHandler = (serviceName: string): ServiceLogger => {
  const prefix = `[${serviceName}]`;
  return {
    handleError: (message: string, error?: AnyError) => {
      const safe = error !== undefined ? toSafeError(error) : undefined;
      if (safe) {
        console.error(`${prefix} ${message}`, safe);
      } else {
        console.error(`${prefix} ${message}`);
      }
    },
    logInfo: (message: string, ...args: any[]) => {
      console.log(`${prefix} ${message}`, ...args);
    },
    logWarning: (message: string, ...args: any[]) => {
      console.warn(`${prefix} ${message}`, ...args);
    },
  };
};

export default createServiceErrorHandler;