// SERVERLESS-SAFE TRUST PROXY CONFIGURATION - FINAL VERSION
//
// SECURITY NOTE:
// - Uses STATIC value '1' (never dynamic function) for serverless safety
// - Vercel inserts exactly one proxy hop, so we trust exactly one hop
// - Prevents malformed proxy chain crashes that cause "XHR request failed"
// - Compatible with mobile networks and IPv6 clients
// - Express computes req.ip safely from the trusted chain
const configureTrustProxy = (app) => {
  const isVercel = process.env.VERCEL === '1';
  const isServerless = process.env.SERVERLESS === '1';

  // CRITICAL: Always use static value '1', never a dynamic function
  // Dynamic functions can crash in serverless environments
  app.set('trust proxy', 1);

  if (!global.trustProxyConfigured) {
    console.log('[TRUST_PROXY] SERVERLESS-SAFE CONFIGURATION', {
      trustProxyValue: 1,
      environment: process.env.NODE_ENV,
      isVercel,
      isServerless,
      security: 'Static trust proxy prevents malformed header crashes',
      mobileSafe: 'IPv6 and mobile networks fully supported',
      rateLimiterSafe: 'req.ip is reliable for rate limiting'
    });
    global.trustProxyConfigured = true;
  }
};

module.exports = configureTrustProxy;
