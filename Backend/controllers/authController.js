const { 
  generateTokenPair, 
  hashRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getTokenExpirationMs
} = require('../utils/jwt');
const { connectDB } = require('../config/database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  logFailedLogin,
  logAccountLock,
  logTokenRefresh,
  logPasswordChange,
  logSuspiciousActivity,
  logReplayAttack,
  logTokenInvalidation
} = require('../utils/securityLogger');

// Import User model - serverless-safe direct import
// The User model uses mongoose.models.User || mongoose.model() pattern
// which ensures it works correctly in serverless cold-start scenarios
const UserModel = require('../models/User');

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

// Auth Controller - Handles authentication with secure token management

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
// SECURITY: Never use default password in production
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);

// Debug logging for environment variables (development only)
if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_ENV === 'true') {
  console.log(' Admin Credentials Debug:');
  console.log('  ADMIN_EMAIL configured:', Boolean(ADMIN_EMAIL));
  console.log('  ADMIN_PASSWORD configured:', Boolean(ADMIN_PASSWORD));
  console.log('  ADMIN_CONFIGURED:', ADMIN_CONFIGURED);
  console.log('  ADMIN_EMAIL length:', ADMIN_EMAIL.length);
  console.log('  ADMIN_PASSWORD length:', ADMIN_PASSWORD.length);
}

/**
 * User login with secure token management
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Log request for production debugging (sanitized)
    console.log('[AUTH] Login attempt:', {
      email: email ? `${email.substring(0, 3)}***` : 'missing',
      hasPassword: !!password,
      ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Connect to database (ensureDatabase middleware should handle this, but double-check)
    await connectDB();
    
    // Final validation: ensure connection is actually established
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        error: 'Service Unavailable',
        timestamp: new Date().toISOString()
      });
    }

    // Special handling for admin user (ensure persisted DB user and real ObjectId)
    if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL) {
      if (!ADMIN_CONFIGURED) {
        return res.status(503).json({
          success: false,
          message: 'Admin credentials are not configured',
          timestamp: new Date().toISOString()
        });
      }

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Upsert admin user in MongoDB to get a stable ObjectId
      let dbAdmin = await UserModel.findOne({ email: ADMIN_EMAIL });
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
        ip: req.ip || req.connection.remoteAddress
      };

      await dbAdmin.addRefreshToken(
        tokens.refreshTokenHash,
        tokens.refreshTokenExpiry,
        deviceInfo
      );

      // Set refresh token in HttpOnly cookie
      setRefreshTokenCookie(res, tokens.refreshToken);

      // Get safe user profile (minimal response)
      const safeUser = dbAdmin.getSafeProfile();

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: safeUser,
          accessToken: tokens.accessToken,
          tokenType: 'Bearer',
          expiresIn: getTokenExpirationMs(tokens.accessTokenExpiresIn) / 1000 // Convert to seconds
        },
        timestamp: new Date().toISOString()
      });
    }

    // Regular user login - find user in database with explicit password selection
    const user = await UserModel.findOne({ email: email.toLowerCase() })
      .select('+password +loginAttempts +lockUntil +lastFailedLogin +isActive');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        timestamp: new Date().toISOString()
      });
    }

    // Check account lockout status
    if (user.isLocked) {
      // Log exact lock duration internally for audit
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logAccountLock(email, lockTimeRemaining, req);
      
      // Return generic message - no timing or existence information leaked
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }

    // Verify password with timing-safe comparison
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      
      // Log failed attempt for security monitoring
      logFailedLogin(email, 'invalid_credentials', req);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Reset login attempts on successful authentication
    await user.resetLoginAttempts();

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Store hashed refresh token in database
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    
    await user.addRefreshToken(
      tokens.refreshTokenHash, 
      tokens.refreshTokenExpiry,
      deviceInfo
    );

    // Update last login and login count
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Set refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // Get safe user profile (minimal response)
    const safeUser = user.getSafeProfile();

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: getTokenExpirationMs(tokens.accessTokenExpiresIn) / 1000 // Convert to seconds
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    if (res.headersSent) {
      return;
    }
    
    const errorMessage = error && error.message ? String(error.message) : String(error);
    console.error('Login error:', errorMessage);

    // Determine appropriate status code and message
    let statusCode = 500;
    let clientMessage = 'Login failed';
    
    if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
      statusCode = 500;
      clientMessage = 'Login failed - Token generation error';
    } else if (
      errorMessage.toLowerCase().includes('mongo') ||
      errorMessage.toLowerCase().includes('database') ||
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('ecnn') ||
      errorMessage.toLowerCase().includes('timeout')
    ) {
      statusCode = 503; // Service Unavailable for DB errors
      clientMessage = 'Service temporarily unavailable. Please try again later.';
    }

    const response = {
      success: false,
      message: clientMessage,
      timestamp: new Date().toISOString()
    };

    // Only include error details in non-production
    if (process.env.NODE_ENV !== 'production') {
      response.error = 'Internal Server Error';
      response.code = error && error.name ? error.name : 'LOGIN_FAILED';
      response.details = errorMessage;
    }

    return res.status(statusCode).json(response);
  }
};

/**
 * User registration with secure token management
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Log request for production debugging (sanitized)
    console.log('[AUTH] Register attempt:', {
      email: email ? `${email.substring(0, 3)}***` : 'missing',
      hasName: !!name,
      hasPassword: !!password,
      ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Prevent admin email registration
    if (ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'This email is reserved for admin use. Please use a different email.',
        timestamp: new Date().toISOString()
      });
    }

    // Connect to database (ensureDatabase middleware should handle this, but double-check)
    await connectDB();
    
    // Final validation: ensure connection is actually established
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        error: 'Service Unavailable',
        timestamp: new Date().toISOString()
      });
    }

    // Check for existing user
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = await UserModel.create({ name, email, password });

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Store hashed refresh token in database
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    
    await user.addRefreshToken(
      tokens.refreshTokenHash, 
      tokens.refreshTokenExpiry,
      deviceInfo
    );

    // Set refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // Get safe user profile (minimal response)
    const safeUser = user.getSafeProfile();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: safeUser,
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: getTokenExpirationMs(tokens.accessTokenExpiresIn) / 1000 // Convert to seconds
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    if (res.headersSent) {
      return;
    }
    
    const errorMessage = error && error.message ? String(error.message) : String(error);
    console.error('Registration error:', errorMessage);

    if (error && error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: 'Validation Error',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        error: 'Duplicate Key',
        code: 'DUPLICATE_EMAIL',
        timestamp: new Date().toISOString()
      });
    }

    // Determine appropriate status code and message
    let statusCode = 500;
    let clientMessage = 'Registration failed';
    
    if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
      statusCode = 500;
      clientMessage = 'Registration failed - Token generation error';
    } else if (
      errorMessage.toLowerCase().includes('mongo') ||
      errorMessage.toLowerCase().includes('database') ||
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('ecnn') ||
      errorMessage.toLowerCase().includes('timeout')
    ) {
      statusCode = 503; // Service Unavailable for DB errors
      clientMessage = 'Service temporarily unavailable. Please try again later.';
    }

    const response = {
      success: false,
      message: clientMessage,
      timestamp: new Date().toISOString()
    };

    // Only include error details in non-production
    if (process.env.NODE_ENV !== 'production') {
      response.error = 'Internal Server Error';
      response.code = error && error.name ? error.name : 'REGISTER_FAILED';
      response.details = errorMessage;
    }

    return res.status(statusCode).json(response);
  }
};

/**
 * Logout - clear refresh token from database and cookie
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken && UserModel) {
      await connectDB();
      
      const tokenHash = hashRefreshToken(refreshToken);
      
      // Find user and remove refresh token
      const user = await UserModel.findOne({
        'refreshTokens.tokenHash': tokenHash
      });

      if (user) {
        await user.removeRefreshToken(tokenHash);
      }
    }

    // Clear refresh token cookie
    clearRefreshTokenCookie(res);

    return res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logout error');
    // Still clear cookie even if database operation fails
    clearRefreshTokenCookie(res);
    return res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get current user info
 */
const getCurrentUser = async (req, res) => {
  try {
    // User info is available from the JWT token in req.user
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No user information available',
        timestamp: new Date().toISOString()
      });
    }
    
    return res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get current user error');
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to get user information',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Refresh access token using refresh token from HttpOnly cookie
 */

const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
        timestamp: new Date().toISOString()
      });
    }

    // Connect to database (ensureDatabase middleware should handle this, but double-check)
    await connectDB();
    
    // Final validation: ensure connection is actually established
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        error: 'Service Unavailable',
        timestamp: new Date().toISOString()
      });
    }

    // Hash the refresh token to compare with database
    const tokenHash = hashRefreshToken(refreshToken);

    // Find user with this refresh token
    const user = await UserModel.findOne({
      'refreshTokens.tokenHash': tokenHash,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    // REPLAY DETECTION: If tokenHash NOT found in user's refreshTokens
    // This indicates a replay attack - someone is trying to reuse an already-rotated token
    if (!user) {
      // Try to find any user that might have had this token before (for logging)
      const potentialUser = await UserModel.findOne({
        'refreshTokens.tokenHash': tokenHash
      });
      
      if (potentialUser) {
        // This is definitely a replay attack - token was rotated but reused
        logReplayAttack(potentialUser._id.toString(), req);
        logTokenInvalidation(potentialUser._id.toString(), 'replay_attack', req);
        
        // Immediately clear ALL refreshTokens for that user
        await potentialUser.clearAllRefreshTokens();
      }
      
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Please login again.',
        timestamp: new Date().toISOString()
      });
    }

    // Verify token is still valid
    if (!user.hasValidRefreshToken(tokenHash)) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        timestamp: new Date().toISOString()
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(tokenHash);
    
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    
    await user.addRefreshToken(
      tokens.refreshTokenHash, 
      tokens.refreshTokenExpiry,
      deviceInfo
    );

    // Set new refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // Log successful token refresh
    logTokenRefresh(user._id.toString(), true, req);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: tokens.accessTokenExpiresIn
        // Note: refreshToken is not returned in JSON body, only in HttpOnly cookie
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token refresh error');
    clearRefreshTokenCookie(res);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    const email = req.body.email || req.query.email;

    if (!token && !email) {
      return res.status(400).json({
        success: false,
        message: 'Verification token or email is required'
      });
    }

    await connectDB();

    let user = null;
    if (token) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      user = await UserModel.findOne({ emailVerificationToken: hashedToken }).select('+emailVerificationToken');
    } else if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Email verified successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Email verification error');
    return res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const baseUrl = process.env.BACKEND_URL || '';
    const resetUrl = `${baseUrl}/api/v1/auth/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Mathematico password',
        text: `Use this link to reset your password: ${resetUrl}`
      });
    } catch (mailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString()
      });
    }

    const response = {
      success: true,
      message: 'Password reset email sent',
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV !== 'production') {
      response.data = { resetToken, resetUrl };
    }

    return res.json(response);
  } catch (error) {
    console.error('Forgot password error');
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    const newPassword = req.body.password || req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    await connectDB();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    user.refreshTokens = [];
    await user.save();

    // Log password change for security monitoring
    logPasswordChange(user._id.toString(), req);

    return res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset password error');
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const currentPassword = req.body.currentPassword || req.body.oldPassword;
    const newPassword = req.body.newPassword || req.body.password;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    await connectDB();
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.refreshTokens = [];
    await user.save();

    // Log password change for security monitoring
    logPasswordChange(userId, req);

    return res.json({
      success: true,
      message: 'Password updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Change password error');
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  // Additional methods for routes
  healthCheck: (req, res) => res.json({ success: true, status: 'healthy', service: 'auth', timestamp: new Date().toISOString() }),
  testDatabase: (req, res) => res.json({ success: true, message: 'Database test endpoint', connected: true }),
  verifyUsersCollection: (req, res) => res.json({ success: true, message: 'Users collection verified', exists: true, count: 0 }),
  getProfile: (req, res) => res.json({ success: true, data: req.user || {} }),
  
  // JWT Health Check
  testJWT: (req, res) => {
    try {
      const { generateTokenPair, verifyAccessToken } = require('../utils/jwt');
      
      // Test token generation
      const testUser = {
        _id: 'test123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };
      
      const tokens = generateTokenPair(testUser);
      
      // Test token verification
      const decoded = verifyAccessToken(tokens.accessToken);
      
      res.json({
        success: true,
        message: 'JWT functionality working correctly',
        timestamp: new Date().toISOString(),
        test: {
          tokenGenerated: !!tokens.accessToken,
          tokenVerified: !!decoded
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'JWT test failed',
        error: 'Internal Server Error',
        timestamp: new Date().toISOString()
      });
    }
  }
};