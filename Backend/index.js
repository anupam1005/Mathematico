'use strict';

const express = require('express');
const helmet = require('helmet');
const { connectDB, performHealthCheck } = require('./config/serverlessDatabase');
const ensureDatabase = require('./middleware/ensureDatabase');
const { serverlessEnvironmentValidator } = require('./middleware/serverlessEnvironmentValidator');
const { serverlessErrorGuard, timeoutGuard } = require('./middleware/serverlessErrorGuard');
const { createAuthProtection } = require('./middleware/authProtection');
const { rateLimiterHealthCheck } = require('./middleware/serverlessRateLimiter');

const app = express();
require('./config/trustProxy')(app);
app.disable('x-powered-by');

// 1) Early minimal CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

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

// 2) Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3) DB connection middleware
app.use('/api/v1', ensureDatabase);

// 4) Environment validator
app.use(serverlessEnvironmentValidator);

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
app.use('/api/v1/webhook', require('./routes/webhook'));

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
app.use(serverlessErrorGuard);

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
});

if (process.env.NODE_ENV !== 'test') {
  connectDB().catch((error) => {
    console.error('[BOOT] Initial DB connect failed:', error.message);
  });
}

module.exports = app;
