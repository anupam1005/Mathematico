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
    config: null,
  };

  const safeOwnValue = (obj: any, key: string) => {
    try {
      if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return undefined;
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      return desc ? desc.value : undefined;
    } catch {
      return undefined;
    }
  };

  // Only read own-property descriptors to avoid invoking hostile inherited getters.
  const messageVal = safeOwnValue(error, 'message');
  if (typeof messageVal === 'string' && messageVal) {
    safe.message = messageVal;
  } else if (messageVal != null) {
    try {
      safe.message = String(messageVal);
    } catch {
      // ignore
    }
  }

  const codeVal = safeOwnValue(error, 'code');
  if (typeof codeVal === 'string') {
    safe.code = codeVal;
  }

  const responseObj = safeOwnValue(error, 'response');
  if (responseObj && typeof responseObj === 'object') {
    const statusVal = safeOwnValue(responseObj, 'status');
    const dataVal = safeOwnValue(responseObj, 'data');
    const statusTextVal = safeOwnValue(responseObj, 'statusText');
    safe.response = {
      status: typeof statusVal === 'number' ? statusVal : undefined,
      data: dataVal,
      statusText: typeof statusTextVal === 'string' ? statusTextVal : undefined,
    };
  }

  const configObj = safeOwnValue(error, 'config');
  if (configObj && typeof configObj === 'object') {
    const urlVal = safeOwnValue(configObj, 'url');
    const methodVal = safeOwnValue(configObj, 'method');
    const retryVal = safeOwnValue(configObj, '_retry');
    safe.config = {
      url: typeof urlVal === 'string' ? urlVal : undefined,
      method: typeof methodVal === 'string' ? methodVal : undefined,
      _retry: typeof retryVal === 'boolean' ? retryVal : undefined,
    };
  }

  return { ...safe };
};
