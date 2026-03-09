import { LogBox } from 'react-native';

/**
 * Global Error Handler
 * Suppresses the React Native Hermes "Cannot assign to read-only property 'NONE'"
 * error which originates inside the platform's fetch/XHR implementation and is
 * not actionable from the app code. This keeps startup clean while still letting
 * all other errors surface normally.
 */

export const setupGlobalErrorHandler = () => {
  try {
    // Suppress log messages that match the NONE error text
    LogBox.ignoreLogs([
      "TypeError: Cannot assign to read-only property 'NONE'",
      "Cannot assign to read-only property 'NONE'",
    ]);

    // Also install a global error handler to swallow this specific error
    const globalAny: any = global;
    if (globalAny.ErrorUtils && typeof globalAny.ErrorUtils.getGlobalHandler === 'function') {
      const defaultHandler = globalAny.ErrorUtils.getGlobalHandler();

      globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        const message = error && typeof error.message === 'string' ? error.message : String(error);

        if (message.includes("Cannot assign to read-only property 'NONE'")) {
          // Swallow this known React Native / Hermes bug
          console.warn('Suppressed NONE read-only property error from React Native internals');
          return;
        }

        // Delegate all other errors to the default handler
        if (typeof defaultHandler === 'function') {
          defaultHandler(error, isFatal);
        }
      });
    }
  } catch {
    // Never let the global handler itself crash the app
  }
};
