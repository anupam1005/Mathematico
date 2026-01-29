import { createSafeError } from './safeError';

export type SafeError = ReturnType<typeof createSafeError>;
export type SafeCatchHandler = (safeError: SafeError) => void;

/**
 * Canonical helper for wrapping hostile error inputs before they can crash Hermes.
 * Usage: const handleError = safeCatch('Feature.scope', (safe) => ...)
 *        try { ... } catch (error) { const safe = handleError(error); }
 */
export const safeCatch = (
  scope: string,
  handler?: SafeCatchHandler,
) => {
  return (error: unknown): SafeError => {
    const safeError = createSafeError(error);
    console.error(`[${scope}]`, safeError);
    handler?.(safeError);
    return safeError;
  };
};
