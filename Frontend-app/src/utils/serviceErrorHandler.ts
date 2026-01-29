// Lightweight service-specific error and logging helper
// NEVER access any properties on error objects to prevent NONE errors

import { safeCatch } from './safeCatch';

type AnyError = any;

export interface ServiceLogger {
  handleError: (message: string, error?: AnyError) => void;
  logInfo: (message: string, ...args: any[]) => void;
  logWarning: (message: string, ...args: any[]) => void;
}

export const createServiceErrorHandler = (serviceName: string): ServiceLogger => {
  const prefix = `[${serviceName}]`;
  return {
    handleError: (message: string, error?: AnyError) => {
      const scope = `${prefix} ${message}`;
      if (error !== undefined) {
        safeCatch(scope)(error);
      } else {
        safeCatch(scope)(new Error(message));
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