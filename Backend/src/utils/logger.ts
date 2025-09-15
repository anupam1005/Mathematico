import * as path from 'path';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, json } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Create a logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    isVercel ? json() : combine(colorize(), logFormat)
  ),
  defaultMeta: { service: 'mathematico-backend' },
  transports: [],
});

// Add transports based on environment
if (isVercel) {
  // In Vercel, only use console transport
  logger.add(
    new transports.Console({
      format: combine(timestamp(), json()),
    })
  );
} else {
  // In local development, use file transports
  try {
    logger.add(
      new transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
      })
    );
    logger.add(
      new transports.File({
        filename: path.join('logs', 'combined.log'),
      })
    );
    logger.add(
      new transports.Console({
        format: combine(colorize(), logFormat),
      })
    );
  } catch (error) {
    // Fallback to console only if file transport fails
    logger.add(
      new transports.Console({
        format: combine(colorize(), logFormat),
      })
    );
  }
}

// Create a stream object with a 'write' function that will be used by `morgan`
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
