// Lightweight service-specific error and logging helper
// Provides consistent logging across services and safely serializes error objects

type AnyError = any;

const toSafeError = (error: any) => {
  try {
    const safeError: any = {
      message: 'Unknown error',
      code: 'UNKNOWN',
      response: null,
      config: null,
    };
    
    // Safely extract message without accessing read-only properties
    try {
      if (error && typeof error === 'object') {
        if ('message' in error) {
          try {
            safeError.message = String(error.message || 'Unknown error');
          } catch (e) {
            safeError.message = 'Unable to extract message';
          }
        }
        
        // DO NOT access error.code directly - it might be read-only 'NONE'
        // React Native's error system uses 'NONE' as a read-only property value
        // Use property descriptor value instead of direct access
        try {
          const codeDesc = Object.getOwnPropertyDescriptor(error, 'code');
          if (codeDesc && codeDesc.enumerable && codeDesc.writable !== false && 'value' in codeDesc) {
            // Use descriptor value directly, avoid accessing property
            const codeValue = codeDesc.value;
            if (codeValue !== undefined && codeValue !== null && String(codeValue) !== 'NONE') {
              safeError.code = String(codeValue);
            }
          }
        } catch (e) {
          // Code property might be read-only or inaccessible, leave as 'UNKNOWN'
          safeError.code = 'UNKNOWN';
        }
        
        // Safely extract response
        if ('response' in error && error.response) {
          try {
            safeError.response = {
              status: error.response.status || 0,
              statusText: String(error.response.statusText || ''),
              data: error.response.data || null,
            };
          } catch (e) {
            safeError.response = null;
          }
        }
        
        // Safely extract config
        if ('config' in error && error.config) {
          try {
            safeError.config = {
              url: String(error.config.url || ''),
              method: String(error.config.method || ''),
              headers: error.config.headers ? JSON.parse(JSON.stringify(error.config.headers)) : {},
              _retry: Boolean(error.config._retry),
            };
          } catch (e) {
            safeError.config = null;
          }
        }
      } else {
        safeError.message = String(error || 'Unknown error');
      }
    } catch (e) {
      safeError.message = 'Error processing error object';
    }
    
    return safeError;
  } catch {
    return { message: 'Error processing error object', code: 'ERROR_PROCESSING', response: null, config: null };
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