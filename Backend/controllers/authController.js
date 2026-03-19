const { 
  generateTokenPair, 
  generateMinimalAccessToken,
  getTokenExpirationMs,
  verifyRefreshToken
} = require('../utils/jwt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const {
  logFailedLogin,
  logAccountLock,
  logPasswordChange
} = require('../utils/securityLogger');
// NOTE: rate limiting is enforced at the router/app level via serverless-safe middleware.

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

const scheduleSecurityLog = (logFn) => {
  setImmediate(() => {
    try {
      logFn();
    } catch (_) {
      // Never block auth responses on security logging failures.
    }
  });
};

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
 * User login with hardened security and rate limiting
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Log request for production debugging (sanitized)
    console.log('[AUTH] Login attempt:', {
      email: email ? `${email.substring(0, 3)}***` : 'missing',
      hasPassword: !!password,
      // IMPORTANT: rely on req.ip only; never re-parse X-Forwarded-For
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        timestamp: new Date().toISOString()
      });
    }


    // Normalize email for lookup
    const normalizedEmail = email.trim().toLowerCase();

    // Special handling for admin user (no writes in login path)
    if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) {
      if (!ADMIN_CONFIGURED) {
        console.error('[AUTH] Admin credentials not configured - missing ADMIN_EMAIL or ADMIN_PASSWORD');
        return res.status(503).json({
          success: false,
          message: 'Admin credentials are not configured',
          timestamp: new Date().toISOString()
        });
      }

      const dbAdmin = await UserModel.findOne({ email: ADMIN_EMAIL })
        .select('+password +tokenVersion +isActive +isEmailVerified');
      if (!dbAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Verify the provided password matches the stored hash using the same comparison method as regular users
      const isPasswordValid = await dbAdmin.comparePassword(password);
      if (!isPasswordValid) {
        console.log('[AUTH] Admin login password verification failed');
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials',
          timestamp: new Date().toISOString()
        });
      }
      
      const tokens = generateTokenPair(dbAdmin);

      // Get safe user profile (minimal response)
      const safeUser = dbAdmin.getSafeProfile();

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: safeUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: 'Bearer',
          expiresIn: getTokenExpirationMs(tokens.accessTokenExpiresIn) / 1000 // Convert to seconds
        },
        timestamp: new Date().toISOString()
      });
    }

    // Regular user login - find user in database with explicit password selection
    const user = await UserModel.findOne({ email: normalizedEmail })
      .select('+password +loginAttempts +lockUntil +lastFailedLogin +isActive +tokenVersion');
    
    if (!user) {
      scheduleSecurityLog(() => logFailedLogin(normalizedEmail, 'user_not_found', req));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Check if user is active
    if (!user.isActive) {
      scheduleSecurityLog(() => logFailedLogin(normalizedEmail, 'account_inactive', req));
      
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
      scheduleSecurityLog(() => logAccountLock(normalizedEmail, lockTimeRemaining, req));
      
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
      scheduleSecurityLog(() => logFailedLogin(normalizedEmail, 'invalid_credentials', req));
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Get safe user profile (minimal response)
    const safeUser = user.getSafeProfile();

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
 * User registration with hardened security and transaction safety
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Log request for production debugging (sanitized)
    console.log('[AUTH] Register attempt:', {
      email: email ? `${email.substring(0, 3)}***` : 'missing',
      hasName: !!name,
      hasPassword: !!password,
      // IMPORTANT: rely on req.ip only; never re-parse X-Forwarded-For
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Enhanced validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate name
    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters',
        timestamp: new Date().toISOString()
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        timestamp: new Date().toISOString()
      });
    }

    // Validate password strength (basic check, model will enforce strong validation)
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        timestamp: new Date().toISOString()
      });
    }

    // Prevent admin email registration
    const normalizedEmail = email.trim().toLowerCase();
    if (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'This email is reserved for admin use. Please use a different email.',
        timestamp: new Date().toISOString()
      });
    }


    // Use transaction-safe user creation
    let user;
    try {
      user = await UserModel.createSafe({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'student',
        isActive: true,
        isEmailVerified: false // Will be verified later
      });
    } catch (createError) {
      if (createError.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
          timestamp: new Date().toISOString()
        });
      }
      throw createError;
    }

    // Generate token pair (stateless tokens only)
    const tokens = generateTokenPair(user);

    // Get safe user profile (minimal response)
    const safeUser = user.getSafeProfile();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: safeUser,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
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
 * Logout - stateless for mobile clients
 */
const logout = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Logout error');
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
 * Refresh access token using stateless JWT refresh token from request body
 */

const refreshToken = async (req, res) => {
  try {
    const refreshTokenValue = req.body.refreshToken;

    if (!refreshTokenValue) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
        timestamp: new Date().toISOString()
      });
    }

    const decodedRefresh = verifyRefreshToken(refreshTokenValue);
    const userId = decodedRefresh.sub;

    const user = await UserModel.findById(userId).select('+isActive +tokenVersion');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
        timestamp: new Date().toISOString()
      });
    }

    if ((decodedRefresh.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
        timestamp: new Date().toISOString()
      });
    }

    // Stateless issuance without DB writes and without refresh rotation
    const accessToken = generateMinimalAccessToken(user);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: refreshTokenValue,
        tokenType: 'Bearer',
        expiresIn: getTokenExpirationMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m') / 1000
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token refresh error');
    if (error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError' || error?.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      });
    }
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

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // IMPORTANT:
    // Password reset links must point to the FRONTEND app/site, not the backend API host.
    // This avoids broken links when BACKEND_URL is unset (common on serverless deployments).
    // For mobile-only deployments, MOBILE_DEEP_LINK_URL must be explicitly configured.
    const frontendBaseUrl = (process.env.FRONTEND_URL || '').trim();
    const mobileDeepLinkUrl = (process.env.MOBILE_DEEP_LINK_URL || '').trim();
    
    let resetUrl;
    if (frontendBaseUrl) {
      resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`;
    } else if (mobileDeepLinkUrl) {
      resetUrl = `${mobileDeepLinkUrl}?action=reset-password&token=${resetToken}`;
    } else {
      // No fallback - strict production behavior
      throw new Error('Password reset requires either FRONTEND_URL or MOBILE_DEEP_LINK_URL environment variables');
    }

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
