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
            // Use descriptor to safely access message property
            const messageDesc = Object.getOwnPropertyDescriptor(error, 'message');
            if (messageDesc && 'value' in messageDesc) {
              safeError.message = String(messageDesc.value || 'Unknown error');
            }
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
        
        // Safely extract response using descriptor
        if ('response' in error) {
          try {
            const responseDesc = Object.getOwnPropertyDescriptor(error, 'response');
            if (responseDesc && 'value' in responseDesc && responseDesc.value) {
              const responseValue = responseDesc.value;
              // Safely extract response properties using descriptors
              let status = 0;
              let statusText = '';
              let data = null;
              
              try {
                if (responseValue && typeof responseValue === 'object') {
                  const statusDesc = Object.getOwnPropertyDescriptor(responseValue, 'status');
                  if (statusDesc && 'value' in statusDesc) {
                    status = Number(statusDesc.value) || 0;
                  }
                  
                  const statusTextDesc = Object.getOwnPropertyDescriptor(responseValue, 'statusText');
                  if (statusTextDesc && 'value' in statusTextDesc) {
                    statusText = String(statusTextDesc.value || '');
                  }
                  
                  const dataDesc = Object.getOwnPropertyDescriptor(responseValue, 'data');
                  if (dataDesc && 'value' in dataDesc) {
                    data = dataDesc.value;
                  }
                }
              } catch (e) {
                // Individual property extraction failed
              }
              
              safeError.response = {
                status,
                statusText,
                data,
              };
            }
          } catch (e) {
            safeError.response = null;
          }
        }
        
        // Safely extract config using descriptor
        if ('config' in error) {
          try {
            const configDesc = Object.getOwnPropertyDescriptor(error, 'config');
            if (configDesc && 'value' in configDesc && configDesc.value) {
              const configValue = configDesc.value;
              // Safely extract config properties using descriptors
              let url = '';
              let method = '';
              let headers: any = {};
              let _retry = false;
              
              try {
                if (configValue && typeof configValue === 'object') {
                  const urlDesc = Object.getOwnPropertyDescriptor(configValue, 'url');
                  if (urlDesc && 'value' in urlDesc) {
                    url = String(urlDesc.value || '');
                  }
                  
                  const methodDesc = Object.getOwnPropertyDescriptor(configValue, 'method');
                  if (methodDesc && 'value' in methodDesc) {
                    method = String(methodDesc.value || '');
                  }
                  
                  const headersDesc = Object.getOwnPropertyDescriptor(configValue, 'headers');
                  if (headersDesc && 'value' in headersDesc && headersDesc.value) {
                    try {
                      headers = JSON.parse(JSON.stringify(headersDesc.value));
                    } catch (e) {
                      headers = {};
                    }
                  }
                  
                  const retryDesc = Object.getOwnPropertyDescriptor(configValue, '_retry');
                  if (retryDesc && 'value' in retryDesc) {
                    _retry = Boolean(retryDesc.value);
                  }
                }
              } catch (e) {
                // Individual property extraction failed
              }
              
              safeError.config = {
                url,
                method,
                headers,
                _retry,
              };
            }
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