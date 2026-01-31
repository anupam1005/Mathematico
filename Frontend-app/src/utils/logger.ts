/**
 * Production-safe logger utility
 */

import { safeCatch } from './safeCatch';

export const Logger = {
  log: (...args: any[]) => {
    console.log(...args);
  },

  info: (...args: any[]) => {
    console.info(...args);
  },

  warn: (...args: any[]) => {
    // Always show warnings, even in production
    const safeArgs = args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      return '[Warning]';
    });
    console.warn(...safeArgs);
  },

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

  debug: (...args: any[]) => {
    console.debug(...args);
  },

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
