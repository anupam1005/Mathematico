'use strict';

const express = require('express');
const helmet = require('helmet');
const { connectDB, performHealthCheck } = require('./config/database');
const ensureDatabase = require('./middleware/ensureDatabase');
const { environmentValidator } = require('./middleware/environmentValidator');
const { errorGuard, timeoutGuard } = require('./middleware/errorGuard');
const { createAuthProtection } = require('./middleware/authProtection');
const { rateLimiterHealthCheck } = require('./middleware/rateLimiter');
const { validateJwtConfig } = require('./utils/jwt');

const app = express();
require('./config/trustProxy')(app);
app.disable('x-powered-by');

// Fail fast at boot if JWT config is invalid.
validateJwtConfig();
console.log('[BOOT] JWT secret validation: OK');

// 1) Early minimal CORS headers - Production Hardened
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isProduction = process.env.NODE_ENV === 'production';

  if (origin) {
    // Reflect the origin dynamically
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    // Mobile apps usually don't send an Origin header.
    // In production, we allow these requests but don't set the wildcard '*'
    // to avoid security/credential conflicts.
    if (!isProduction) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // Note: If no Origin is provided, Access-Control-Allow-Origin is technically not required
    // for non-browser clients (Native Apps), but we set it to '*' in dev for ease of use.
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  // Credentials must be true for our JWT cookie/refresh strategy
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'backend',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res, next) => {
  try {
    const healthData = await performHealthCheck();
    return res.status(200).json({
      success: true,
      status: 'ok',
      database: healthData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/health/rate-limiter', (req, res) => {
  return res.status(200).json(rateLimiterHealthCheck());
});

// Prevent noisy 404s from browser favicon probes.
app.get(['/favicon.ico', '/favicon.png'], (req, res) => {
  return res.status(204).end();
});

// 2) Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3) DB connection middleware
app.use('/api/v1', ensureDatabase);

// CRITICAL: Webhook route must use express.raw() BEFORE express.json() is registered.
// Razorpay sends a raw JSON body and we must verify the HMAC signature against the
// exact bytes received. Once express.json() parses the body, the raw Buffer is lost
// and signature verification will always fail on a platform that pre-parses the body.
app.use('/api/v1/webhook', express.raw({ type: 'application/json' }), require('./routes/webhook'));

// 4) Environment validator
app.use(environmentValidator);

// 5) Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// 6) Rate limiter
app.use('/api/v1/auth/login', createAuthProtection('login'));
app.use('/api/v1/auth/register', createAuthProtection('register'));
app.use('/api/v1/admin', createAuthProtection('admin'));
app.use('/api/v1', createAuthProtection('public'));

// Timeout guard after DB handshake/rate limiting to avoid cutting initial DB connect
app.use(timeoutGuard(45000));

// 7) Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/mobile', require('./routes/mobile'));
app.use('/api/v1/student', require('./routes/student'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/payments', require('./routes/payment'));
app.use('/api/v1/secure-pdf', require('./routes/securePdf'));
// Note: /api/v1/webhook is registered earlier with express.raw() before express.json()

app.get('/api/v1', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API online',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 8) Error handler
app.use(errorGuard);

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
  // Give the logger time to flush then exit — the process manager will restart us
  setTimeout(() => process.exit(1), 1000);
});

// Connect to DB eagerly on boot (not per-request like in serverless)
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => console.log('[BOOT] MongoDB connected successfully'))
    .catch((error) => {
      console.error('[BOOT] Initial DB connect failed:', error.message);
      // Don't crash — database will retry on each request
    });
}

// ─── Server startup ──────────────────────────────────────────────────────────
// On persistent servers (Railway, Render, Fly.io): app.listen() starts an HTTP server
// On Railway / Render / Fly.io: app.listen() starts a persistent HTTP server
if (process.env.NODE_ENV === 'test') {
  // Export for test runners
  module.exports = app;
} else {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BOOT] Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
  // Also export for any require()-based usage
  module.exports = app;
}
