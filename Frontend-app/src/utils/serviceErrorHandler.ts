// Lightweight service-specific error and logging helper
// Provides consistent logging across services and safely serializes error objects

type AnyError = any;

const toSafeError = (error: any) => {
  try {
    return {
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      response: error?.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
          }
        : null,
      config: error?.config
        ? {
            url: error.config.url,
            method: error.config.method,
            headers: { ...error.config.headers },
            _retry: error.config._retry || false,
          }
        : null,
    };
  } catch {
    return { message: 'Error processing error object', code: 'ERROR_PROCESSING' };
  }
};

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