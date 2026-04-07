/**
 * Safe Error Utility
 * Extracts error information WITHOUT accessing the 'code' property
 * which triggers "Cannot assign to read-only property 'NONE'" error in React Native
 */

export const createSafeError = (error: any) => {
  const safe: any = { 
    message: 'Request failed', 
    code: '',
    response: null, 
    config: null 
  };
  
  // Safely extract message - wrap in try-catch
  try { 
    if (error && error.message) {
      safe.message = String(error.message); 
    }
  } catch (e) { 
    // Ignore - keep default message
  }
  
  // Read only own-property descriptors to avoid invoking problematic inherited getters.
  try {
    if (error && typeof error === 'object') {
      const codeDesc = Object.getOwnPropertyDescriptor(error, 'code');
      if (codeDesc && typeof codeDesc.value === 'string') {
        safe.code = codeDesc.value;
      }
    }
  } catch (e) {
    // Ignore - keep default empty code
  }
  
  // Safely extract response - wrap each property access in try-catch
  try {
    if (error && error.response) {
      safe.response = {};
      try { safe.response.status = error.response.status; } catch (e) { /* ignore */ }
      try { 
        const responseData = error.response.data;
        safe.response = { ...safe.response };
        safe.response.data = responseData; 
      } catch (e) { /* ignore */ }
      try { safe.response.statusText = error.response.statusText; } catch (e) { /* ignore */ }
    }
  } catch (e) { 
    safe.response = null;
  }
  
  // Safely extract config
  try {
    if (error && error.config) {
      safe.config = {};
      try { safe.config.url = error.config.url; } catch (e) { /* ignore */ }
      try { safe.config.method = error.config.method; } catch (e) { /* ignore */ }
      try { safe.config._retry = error.config._retry; } catch (e) { /* ignore */ }
    }
  } catch (e) { 
    safe.config = null;
  }
  
  return safe;
};
