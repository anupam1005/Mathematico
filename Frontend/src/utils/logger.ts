import * as path from 'path';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, json } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create a logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
  ),
  defaultMeta: { service: 'mathematico-backend' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    // Write all logs with level `info` and below to `combined.log`
    new transports.File({
      filename: path.join('logs', 'combined.log'),
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: combine(colorize(), logFormat),
    })
  );
}

// Create a stream object with a 'write' function that will be used by `morgan`
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
