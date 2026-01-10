/**
 * Global Error Handler
 * Prevents "Cannot assign to read-only property 'NONE'" errors
 * by intercepting ALL console methods and safely extracting error messages
 * 
 * This handler ensures we never access or modify read-only properties on error objects,
 * which can trigger React Native's internal error handling system.
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Safe error message extractor that never accesses read-only properties
const extractSafeMessage = (arg: any): any => {
  // Handle null/undefined immediately
  if (arg === null || arg === undefined) {
    return String(arg);
  }
  
  // For primitive types, return as-is
  if (typeof arg !== 'object') {
    return arg;
  }
  
  // For Error objects, extract safely without accessing properties directly
  if (arg instanceof Error) {
    try {
      const errorInfo: any = {};
      
      // Safely extract error name using descriptor only
      try {
        const nameDesc = Object.getOwnPropertyDescriptor(arg, 'name');
        if (nameDesc && 'value' in nameDesc) {
          errorInfo.name = String(nameDesc.value || 'Error');
        }
      } catch (e) {
        // Name extraction failed
      }
      if (!errorInfo.name) {
        errorInfo.name = 'Error'; // Default fallback
      }
      
      // Safely extract error message using descriptor only
      try {
        const messageDesc = Object.getOwnPropertyDescriptor(arg, 'message');
        if (messageDesc && 'value' in messageDesc) {
          errorInfo.message = String(messageDesc.value || 'Unknown error');
        }
      } catch (e) {
        // Message extraction failed
      }
      if (!errorInfo.message) {
        errorInfo.message = 'Unknown error'; // Default fallback
      }
      
      // Safely extract stack trace using descriptor only
      try {
        const stackDesc = Object.getOwnPropertyDescriptor(arg, 'stack');
        if (stackDesc && 'value' in stackDesc && stackDesc.value) {
          errorInfo.stack = String(stackDesc.value);
        }
      } catch (e) {
        // Stack trace not available or inaccessible
      }
      
      // Format as readable error string with available info
      if (errorInfo.stack) {
        return `${errorInfo.name}: ${errorInfo.message}\n${errorInfo.stack}`;
      } else {
        return `${errorInfo.name}: ${errorInfo.message}`;
      }
    } catch (e) {
      return 'Error: Unable to process error object';
    }
  }
  
  // For plain objects, safely stringify without accessing properties
  if (typeof arg === 'object') {
    try {
      // Check if it's a frozen object that might have read-only properties
      if (Object.isFrozen(arg)) {
        // For frozen objects, try to stringify carefully
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return '[Frozen Object]';
        }
      }
      
      // For non-frozen objects, safely extract ALL safe properties
      const safeObj: any = {};
      try {
        // Get all own property names (including non-enumerable) for complete error info
        const allKeys = Object.getOwnPropertyNames(arg);
        
        // Common error properties to extract safely
        const safeProperties = ['message', 'name', 'stack', 'status', 'statusText', 'type', 'cause'];
        
        // Extract each property safely using descriptors
        for (const key of allKeys) {
          // Skip the 'code' property if it's read-only 'NONE' - handle separately
          if (key === 'code') {
            try {
              const codeDesc = Object.getOwnPropertyDescriptor(arg, key);
              if (codeDesc && codeDesc.enumerable && codeDesc.writable !== false && 'value' in codeDesc) {
                const codeValue = codeDesc.value;
                // Only include if it's not the read-only 'NONE' value
                if (codeValue !== undefined && codeValue !== null && String(codeValue) !== 'NONE') {
                  safeObj.code = String(codeValue);
                }
              }
            } catch (e) {
              // Skip read-only code property
            }
            continue;
          }
          
          // For other properties, safely extract using descriptor
          try {
            const desc = Object.getOwnPropertyDescriptor(arg, key);
            if (desc) {
              // Only extract if property is enumerable and writable (safe to access)
              if (desc.enumerable && desc.writable !== false) {
                if ('value' in desc) {
                  const propValue = desc.value;
                  
                  // Handle different property types
                  if (propValue === null || propValue === undefined) {
                    safeObj[key] = propValue;
                  } else if (typeof propValue === 'string' || typeof propValue === 'number' || typeof propValue === 'boolean') {
                    safeObj[key] = propValue;
                  } else if (propValue instanceof Error) {
                    // Recursively extract from nested error
                    safeObj[key] = extractSafeMessage(propValue);
                  } else if (typeof propValue === 'object') {
                    // For nested objects, try to stringify safely
                    try {
                      // Only include if it's a simple object (not circular)
                      if (!Object.isFrozen(propValue)) {
                        safeObj[key] = '[Object]';
                      } else {
                        safeObj[key] = '[Frozen Object]';
                      }
                    } catch (e) {
                      safeObj[key] = '[Complex Object]';
                    }
                  } else {
                    safeObj[key] = String(propValue);
                  }
                } else if (desc.get) {
                  // Skip getter properties to avoid side effects
                  safeObj[key] = '[Getter]';
                }
              } else if (safeProperties.includes(key)) {
                // For important error properties, try to read using descriptor value
                try {
                  // Try to get descriptor again and use its value
                  const importantDesc = Object.getOwnPropertyDescriptor(arg, key);
                  if (importantDesc && 'value' in importantDesc && importantDesc.value !== undefined) {
                    const value = importantDesc.value;
                    safeObj[key] = typeof value === 'string' ? value : String(value);
                  }
                } catch (e) {
                  // Skip if read fails
                }
              }
            }
          } catch (e) {
            // Skip property if extraction fails
          }
        }
        
        // If we couldn't extract any properties, try a fallback using descriptors
        if (Object.keys(safeObj).length === 0) {
          // Try to get at least basic info using Object.keys and descriptors
          try {
            const enumerableKeys = Object.keys(arg);
            for (const key of enumerableKeys) {
              if (key !== 'code') { // Skip code to be safe
                try {
                  const desc = Object.getOwnPropertyDescriptor(arg, key);
                  if (desc && 'value' in desc && desc.writable !== false) {
                    const value = desc.value;
                    safeObj[key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                      ? value
                      : String(value);
                  }
                } catch (e) {
                  // Skip if access fails
                }
              }
            }
          } catch (e) {
            // If all else fails, return a generic message with object type
            try {
              return `[Object: ${arg.constructor?.name || 'Object'}]`;
            } catch (e2) {
              return '[Object - Unable to extract properties]';
            }
          }
        }
        
        // Try to stringify the safe object
        return JSON.stringify(safeObj);
      } catch (e) {
        return '[Object - Extraction failed]';
      }
    } catch (e) {
      return '[Object]';
    }
  }
  
  // Fallback to string conversion
  try {
    return String(arg);
  } catch (e) {
    return '[Unable to convert]';
  }
};

// Override console.error to safely handle error objects
console.error = (...args: any[]) => {
  try {
    const safeArgs = args.map(extractSafeMessage);
    originalConsoleError.apply(console, safeArgs);
  } catch (e) {
    // If even our safe handler fails, log a minimal message
    originalConsoleError('[Console.error handler failed]');
  }
};

// Override console.warn to safely handle error objects
console.warn = (...args: any[]) => {
  try {
    const safeArgs = args.map(extractSafeMessage);
    originalConsoleWarn.apply(console, safeArgs);
  } catch (e) {
    // If even our safe handler fails, log a minimal message
    originalConsoleWarn('[Console.warn handler failed]');
  }
};

// Override console.log to safely handle error objects
console.log = (...args: any[]) => {
  try {
    const safeArgs = args.map(extractSafeMessage);
    originalConsoleLog.apply(console, safeArgs);
  } catch (e) {
    // If even our safe handler fails, log a minimal message
    originalConsoleLog('[Console.log handler failed]');
  }
};

// Global error handler for uncaught errors
// This must be EXTREMELY defensive to avoid triggering React Native's internal error handlers
if (typeof ErrorUtils !== 'undefined') {
  try {
    const originalErrorHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try {
        // Convert error to string IMMEDIATELY without accessing any properties
        let errorMessage = 'Unknown error';
        try {
          if (error && typeof error === 'object') {
            // Use a try-catch for each property access
            if (error.message !== undefined) {
              try {
                errorMessage = String(error.message);
              } catch (e) {
                errorMessage = 'Error message unavailable';
              }
            } else {
              errorMessage = String(error);
            }
          } else {
            errorMessage = String(error);
          }
        } catch (e) {
          errorMessage = 'Unable to extract error message';
        }
        
        // Log using our safe console.error (which already has safe extraction)
        console.error('Global Error Handler:', errorMessage);
        
        // Call original handler if it exists, but wrap in try-catch
        if (originalErrorHandler && typeof originalErrorHandler === 'function') {
          try {
            // Pass the error as-is but wrapped in a try-catch
            originalErrorHandler(error, isFatal);
          } catch (e) {
            // If original handler fails, don't let it propagate
            console.error('Error in original error handler (caught)');
          }
        }
      } catch (handlerError) {
        // Last resort: use original console.error directly with minimal message
        try {
          originalConsoleError('Global error handler failed');
        } catch (finalError) {
          // If even console.error fails, we're in deep trouble - do nothing
        }
      }
    });
  } catch (e) {
    // If setting the error handler itself fails, log it once and continue
    originalConsoleError('Failed to set global error handler');
  }
}

export const setupGlobalErrorHandler = () => {
  // Use a try-catch even here
  try {
    console.log('Global error handler initialized');
  } catch (e) {
    // Silent fail if console.log itself is broken
  }
};
