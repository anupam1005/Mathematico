// Request Logger Middleware for Production
const winston = require('winston');

// Configure request logger
const requestLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mathematico-requests' },
  transports: [
    // Only add file transport in local development (not Vercel)
    ...(process.env.VERCEL !== '1' ? [
      new winston.transports.File({ filename: 'logs/requests.log' })
    ] : []),
    // Always add console transport for Vercel
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  requestLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  requestLogger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    requestLogger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = logRequest;
