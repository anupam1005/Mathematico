// Trust proxy configuration for Vercel and production environments
const { logger } = require('../utils/logger');

const configureTrustProxy = (app) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  if (isProduction || isVercel) {
    // Trust the first proxy hop (Vercel's edge network)
    app.set('trust proxy', 1);
    
    // Only log once during startup, not on every request
    if (!global.trustProxyConfigured) {
      logger.info('Trust proxy configured for production/Vercel environment', {
        environment: isProduction ? 'production' : 'development',
        vercel: isVercel ? 'yes' : 'no',
        trustProxyLevel: 1
      });
      global.trustProxyConfigured = true;
    }
  } else if (!global.trustProxyConfigured) {
    logger.info('Trust proxy not configured (development mode)');
    global.trustProxyConfigured = true;
  }
};

module.exports = configureTrustProxy;
