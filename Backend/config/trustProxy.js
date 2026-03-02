// Trust proxy configuration for Vercel and production environments
const configureTrustProxy = (app) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  if (isProduction || isVercel) {
    // Trust the first proxy hop (Vercel's edge network)
    app.set('trust proxy', 1);
    
    // Use console.log instead of logger in serverless to avoid filesystem issues
    if (!global.trustProxyConfigured) {
      if (isVercel) {
        console.log('[TRUST_PROXY] Configured for Vercel environment (level: 1)');
      } else {
        console.log('[TRUST_PROXY] Configured for production environment (level: 1)');
      }
      global.trustProxyConfigured = true;
    }
  } else if (!global.trustProxyConfigured) {
    console.log('[TRUST_PROXY] Not configured (development mode)');
    global.trustProxyConfigured = true;
  }
};

module.exports = configureTrustProxy;
