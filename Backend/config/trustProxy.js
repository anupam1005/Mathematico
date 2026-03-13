// Trust proxy configuration for Vercel, mobile clients, and IPv6-aware rate limiting
//
// SECURITY NOTE:
// - We use a fixed hop count (`app.set('trust proxy', 1)`) instead of a dynamic
//   trust function. Vercel inserts exactly one proxy hop (the edge), so the
//   left-most entry in `X-Forwarded-For` is the real client IP.
// - Express will compute `req.ip` from that chain, and all downstream
//   middleware MUST rely on `req.ip` only (never re-parse `X-Forwarded-For`).
// - Mobile networks and IPv6 clients are fully supported because Express
//   normalizes both IPv4 and IPv6 when `trust proxy` is enabled.
const configureTrustProxy = (app) => {
  const isVercel = process.env.VERCEL === '1';

  // Always trust a single proxy hop in front of the app (Vercel edge / load balancer)
  app.set('trust proxy', 1);

  if (!global.trustProxyConfigured) {
    console.log('[TRUST_PROXY] Enabled with fixed hop count (trust proxy = 1)', {
      environment: process.env.NODE_ENV,
      isVercel,
      note: 'req.ip is the single source of truth; X-Forwarded-For is never re-parsed by application code'
    });
    global.trustProxyConfigured = true;
  }
};

module.exports = configureTrustProxy;
