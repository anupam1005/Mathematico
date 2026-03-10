/**
 * Global Error Handler
 *
 * IMPORTANT:
 * - Do NOT swallow or suppress the Hermes "NONE" error.
 * - Our goal is to prevent it by avoiding hostile/frozen object access (not hide it).
 *
 * This function intentionally keeps a tiny surface area: it only ensures that if we
 * ever customize ErrorUtils in the future, we still delegate to the platform default.
 */
export const setupGlobalErrorHandler = () => {
  try {
    const globalAny: any = global;
    if (globalAny?.ErrorUtils && typeof globalAny.ErrorUtils.getGlobalHandler === 'function') {
      const defaultHandler = globalAny.ErrorUtils.getGlobalHandler();
      if (typeof defaultHandler === 'function' && typeof globalAny.ErrorUtils.setGlobalHandler === 'function') {
        globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
          defaultHandler(error, isFatal);
        });
      }
    }
  } catch {
    // Never let the global handler itself crash the app
  }
};
