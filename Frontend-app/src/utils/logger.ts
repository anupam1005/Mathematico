/**
 * Production-safe logger utility
 */

import { safeCatch } from './safeCatch';

export const Logger = {
  log: () => {},

  info: () => {},

  warn: () => {},

  error: (message?: any, error?: any, ..._rest: any[]) => {
    const scope = typeof message === 'string' ? `Logger.error ${message}` : 'Logger.error';
    if (error !== undefined) {
      safeCatch(scope)(error);
      return;
    }
    if (message instanceof Error) {
      safeCatch(scope)(message);
      return;
    }
    if (typeof message === 'string') {
      safeCatch(scope)(new Error(message));
      return;
    }
    safeCatch(scope)(new Error('Logger error'));
  },

  debug: () => {},

  // For critical production errors that need tracking
  critical: (message: string, error?: any) => {
    const scope = `Logger.critical ${message}`;
    if (error !== undefined) {
      safeCatch(scope)(error);
    } else {
      safeCatch(scope)(new Error(message));
    }
    // TODO: Add error tracking service here (e.g., Sentry)
  }
};

export default Logger;
