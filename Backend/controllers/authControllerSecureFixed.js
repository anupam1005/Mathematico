const { 
  generateTokenPair, 
  hashRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} = require('../utils/jwt');
const connectDB = require('../config/database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  loginRateLimit,
  authRateLimit,
  bruteForceLimit,
  logSecurityEvent,
  dummyBcryptCompare
} = require('../middleware/securityMiddlewareFixed');

// Import User model
let UserModel;
try {
  UserModel = require('../models/User');
} catch (error) {
  console.warn(' User model not available:', error && error.message ? error.message : error);
}

const getEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  });
};

// Auth Controller - Handles authentication with enterprise-level security

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
// SECURITY: Never use default password in production
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

// Generic login failure response (prevents user enumeration)
const getLoginFailureResponse = () => ({
  success: false,
  message: 'Invalid email or password',
  timestamp: new Date().toISOString()
});

/**
 * User login with enterprise-level security
 */
const login = async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      logSecurityEvent('LOGIN_VALIDATION_FAILED', { 
        ip: clientIP,
        reason: 'Missing email or password',
        email: email ? 'provided' : 'missing'
      });
      return res.status(400).json(getLoginFailureResponse());
    }

    if (!UserModel) {
      logSecurityEvent('LOGIN_SERVICE_UNAVAILABLE', { ip: clientIP });
      return res.status(503).json({ 
        success: false, 
        message: 'Authentication service temporarily unavailable' 
      });
    }

    // Connect to database
    await connectDB();

    // Special handling for admin user
    if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL) {
      if (!ADMIN_CONFIGURED) {
        logSecurityEvent('ADMIN_LOGIN_NOT_CONFIGURED', { ip: clientIP, email });
        return res.status(503).json({
          success: false,
          message: 'Authentication service temporarily unavailable'
        });
      }

      // Always perform dummy comparison for timing protection
      await dummyBcryptCompare();

      if (password !== ADMIN_PASSWORD) {
        logSecurityEvent('ADMIN_LOGIN_FAILED', { 
          ip: clientIP, 
          email: ADMIN_EMAIL,
          timestamp: new Date().toISOString()
        });
        return res.status(401).json(getLoginFailureResponse());
      }

      // Ensure User model is available
      if (!UserModel) {
        return res.status(503).json({ success: false, message: 'Authentication service temporarily unavailable' });
      }

      // Upsert admin user in MongoDB to get a stable ObjectId
      let dbAdmin = await UserModel.findOne({ email: ADMIN_EMAIL }).select('+loginAttempts +lockUntil');
      if (!dbAdmin) {
        // Create new admin user - password will be hashed automatically by pre-save middleware
        dbAdmin = new UserModel({
          name: 'Admin User',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD, // Will be hashed by pre-save middleware
          role: 'admin',
          isAdmin: true,
          isActive: true
        });
        await dbAdmin.save();
      } else {
        // Check if admin account is locked
        if (dbAdmin.isLocked) {
          logSecurityEvent('ADMIN_LOGIN_LOCKED', { 
            ip: clientIP, 
            email: ADMIN_EMAIL,
            lockUntil: dbAdmin.lockUntil
          });
          return res.status(401).json(getLoginFailureResponse());
        }

        // Ensure role flags and update last login
        dbAdmin.role = 'admin';
        dbAdmin.isAdmin = true;
        dbAdmin.isActive = true;
        dbAdmin.lastLogin = new Date();
        dbAdmin.loginCount = (dbAdmin.loginCount || 0) + 1;
        await dbAdmin.save();
      }

      const tokens = generateTokenPair(dbAdmin);

      const deviceInfo = {
        userAgent: req.headers['user-agent'],
        ip: clientIP
      };

      await dbAdmin.addRefreshToken(
        tokens.refreshTokenHash,
        tokens.refreshTokenExpiry,
        deviceInfo
      );

      // Reset login attempts on successful login
      await dbAdmin.resetLoginAttempts();

      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, tokens.refreshToken);

      // Get public profile (includes isAdmin, is_admin, etc.)
      const publicUser = dbAdmin.getPublicProfile();

      logSecurityEvent('ADMIN_LOGIN_SUCCESS', { 
        ip: clientIP, 
        email: ADMIN_EMAIL,
        userId: dbAdmin._id
      });

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: publicUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: 'Bearer',
          expiresIn: tokens.accessTokenExpiresIn
        },
        timestamp: new Date().toISOString()
      });
    }

    // Regular user login - find user in database with security fields
    const user = await UserModel.findOne({ email: email.toLowerCase() })
      .select('+password +loginAttempts +lockUntil +lastFailedLogin');
    
    // Always perform dummy comparison for timing protection if user not found
    if (!user) {
      await dummyBcryptCompare();
      
      logSecurityEvent('LOGIN_USER_NOT_FOUND', { 
        ip: clientIP, 
        email: email.toLowerCase(),
        timestamp: new Date().toISOString()
      });
      
      // Ensure constant response time
      const elapsed = Date.now() - startTime;
      const minResponseTime = 200; // 200ms minimum
      if (elapsed < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed));
      }
      
      return res.status(401).json(getLoginFailureResponse());
    }

    // Check if user is active
    if (!user.isActive) {
      logSecurityEvent('LOGIN_INACTIVE_USER', { 
        ip: clientIP, 
        email: email.toLowerCase(),
        userId: user._id
      });
      return res.status(401).json(getLoginFailureResponse());
    }

    // Check if account is locked
    if (user.isLocked) {
      logSecurityEvent('LOGIN_LOCKED_ACCOUNT', { 
        ip: clientIP, 
        email: email.toLowerCase(),
        userId: user._id,
        lockUntil: user.lockUntil,
        loginAttempts: user.loginAttempts
      });
      return res.status(401).json(getLoginFailureResponse());
    }

    // Verify password with timing protection
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      
      logSecurityEvent('LOGIN_INVALID_PASSWORD', { 
        ip: clientIP, 
        email: email.toLowerCase(),
        userId: user._id,
        loginAttempts: user.loginAttempts + 1
      });
      
      // Ensure constant response time
      const elapsed = Date.now() - startTime;
      const minResponseTime = 200; // 200ms minimum
      if (elapsed < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed));
      }
      
      return res.status(401).json(getLoginFailureResponse());
    }

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Store hashed refresh token in database
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: clientIP
    };
    
    await user.addRefreshToken(
      tokens.refreshTokenHash, 
      tokens.refreshTokenExpiry,
      deviceInfo
    );

    // Update last login and reset failed attempts
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Set refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // Get public profile
    const publicUser = user.getPublicProfile();

    logSecurityEvent('LOGIN_SUCCESS', { 
      ip: clientIP, 
      email: email.toLowerCase(),
      userId: user._id
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: tokens.accessTokenExpiresIn
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    if (res.headersSent) {
      return;
    }
    
    const errorMessage = error && error.message ? String(error.message) : String(error);
    console.error('Login error:', errorMessage);

    logSecurityEvent('LOGIN_ERROR', { 
      ip: clientIP,
      error: errorMessage,
      email: req.body.email || 'not_provided'
    });

    let clientMessage = 'Login failed';
    if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
      clientMessage = 'Login failed - Authentication service error';
    } else if (errorMessage.includes('database') || errorMessage.includes('DB')) {
      clientMessage = 'Login failed - Service temporarily unavailable';
    }

    // Always return generic failure message
    return res.status(500).json({
      success: false,
      message: clientMessage,
      timestamp: new Date().toISOString()
    });
  }
};

// Export all auth controller functions with security middleware
module.exports = {
  login,
  
  // Apply rate limiting middleware to login route
  loginWithRateLimit: [
    authRateLimit,
    loginRateLimit,
    bruteForceLimit,
    login
  ]
};
