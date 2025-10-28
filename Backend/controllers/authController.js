const { 
  generateTokenPair, 
  verifyAccessToken, 
  verifyHashedRefreshToken,
  hashRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} = require('../utils/jwt');
const connectDB = require('../config/database');

// Import User model
let UserModel;
try {
  UserModel = require('../models/User');
} catch (error) {
  console.warn('⚠️ User model not available:', error && error.message ? error.message : error);
}

// Auth Controller - Handles authentication with secure token management

/**
 * User login with secure token management
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    if (!UserModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'User model unavailable' 
      });
    }

    // Connect to database
    await connectDB();

    // Special handling for admin user (ensure persisted DB user and real ObjectId)
    const ADMIN_EMAIL = 'dc2006089@gmail.com';
    const ADMIN_PASSWORD = 'Myname*321';
    
    if (email.toLowerCase() === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Ensure User model is available
      if (!UserModel) {
        return res.status(503).json({ success: false, message: 'User model unavailable' });
      }

      // Upsert admin user in MongoDB to get a stable ObjectId
      let dbAdmin = await UserModel.findOne({ email: ADMIN_EMAIL });
      if (!dbAdmin) {
        dbAdmin = new UserModel({
          name: 'Admin User',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: 'admin',
          isAdmin: true,
          isActive: true
        });
      } else {
        // Ensure role flags
        dbAdmin.role = 'admin';
        dbAdmin.isAdmin = true;
        dbAdmin.isActive = true;
      }

      // Update last login details
      dbAdmin.lastLogin = new Date();
      dbAdmin.loginCount = (dbAdmin.loginCount || 0) + 1;
      await dbAdmin.save();

      // Generate tokens with real ObjectId
      console.log('🔑 Generating tokens for admin user...');
      console.log('🔑 JWT_SECRET available:', process.env.JWT_SECRET ? 'YES' : 'NO');
      
      const tokens = generateTokenPair(dbAdmin);
      console.log('🔑 Tokens generated successfully');
      console.log('🔑 Access token length:', tokens.accessToken ? tokens.accessToken.length : 'NULL');

      console.log('✅ Admin login successful (DB-backed):', ADMIN_EMAIL, 'id:', dbAdmin._id.toString());

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: dbAdmin._id,
            name: dbAdmin.name,
            email: dbAdmin.email,
            role: dbAdmin.role,
            isAdmin: true,
            isActive: true
          },
          accessToken: tokens.accessToken,
          tokenType: 'Bearer',
          expiresIn: tokens.accessTokenExpiresIn
        },
        timestamp: new Date().toISOString()
      });
    }

    // Regular user login - find user in database
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
    
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

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
    }

    // Generate token pair
    console.log('🔑 Generating tokens for regular user...');
    console.log('🔑 JWT_SECRET available:', process.env.JWT_SECRET ? 'YES' : 'NO');
    
    const tokens = generateTokenPair(user);
    console.log('🔑 Tokens generated successfully');
    console.log('🔑 Access token length:', tokens.accessToken ? tokens.accessToken.length : 'NULL');

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

    // Update last login
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Set refresh token in HttpOnly cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // Get public profile
    const publicUser = user.getPublicProfile();

    console.log('✅ Login successful:', user.email);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser,
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: tokens.accessTokenExpiresIn
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error type:', error.name);
    console.error('JWT_SECRET available:', process.env.JWT_SECRET ? 'YES' : 'NO');
    
    let errorMessage = 'Login failed';
    if (error.message.includes('JWT') || error.message.includes('token')) {
      errorMessage = 'Login failed - Token generation error';
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      errorMessage = 'Login failed - Database connection error';
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.name,
        jwtSecretAvailable: process.env.JWT_SECRET ? true : false
      }
    });
  }
};

/**
 * User registration with secure token management
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
        timestamp: new Date().toISOString()
      });
    }

    // Prevent admin email registration
    const ADMIN_EMAIL = 'dc2006089@gmail.com';
    if (email.toLowerCase() === ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: 'This email is reserved for admin use. Please use a different email.',
        timestamp: new Date().toISOString()
      });
    }

    if (!UserModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'User model unavailable' 
      });
    }

    // Connect to database
    await connectDB();

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

    // Get public profile
    const publicUser = user.getPublicProfile();

    console.log('✅ Registration successful:', user.email);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: publicUser,
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: tokens.accessTokenExpiresIn
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error type:', error.name);
    console.error('JWT_SECRET available:', process.env.JWT_SECRET ? 'YES' : 'NO');
    
    let errorMessage = 'Registration failed';
    if (error.message.includes('JWT') || error.message.includes('token')) {
      errorMessage = 'Registration failed - Token generation error';
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      errorMessage = 'Registration failed - Database connection error';
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.name,
        jwtSecretAvailable: process.env.JWT_SECRET ? true : false
      }
    });
  }
};

/**
 * Logout - clear refresh token from database and cookie
 */
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken && UserModel) {
      await connectDB();
      
      const tokenHash = hashRefreshToken(refreshToken);
      
      // Find user and remove refresh token
      const user = await UserModel.findOne({
        'refreshTokens.tokenHash': tokenHash
      });

      if (user) {
        await user.removeRefreshToken(tokenHash);
        console.log('✅ Logout successful:', user.email);
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
    console.error('Logout error:', error);
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
        user: user
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
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
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!UserModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'User model unavailable' 
      });
    }

    // Connect to database
    await connectDB();

    // Hash the refresh token to compare with database
    const tokenHash = hashRefreshToken(refreshToken);

    // Find user with this refresh token
    const user = await UserModel.findOne({
      'refreshTokens.tokenHash': tokenHash,
      'refreshTokens.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
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

    console.log('✅ Token refreshed:', user.email);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        tokenType: 'Bearer',
        expiresIn: tokens.accessTokenExpiresIn
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    clearRefreshTokenCookie(res);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify email (disabled - no database)
 */
const verifyEmail = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Email verification is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Forgot password (disabled - no database)
 */
const forgotPassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password reset is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Reset password (disabled - no database)
 */
const resetPassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password reset is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Change password (disabled - no database)
 */
const changePassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password change is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
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
          tokenLength: tokens.accessToken ? tokens.accessToken.length : 0,
          tokenVerified: !!decoded,
          decodedUser: decoded ? { id: decoded.id, email: decoded.email, role: decoded.role } : null,
          jwtSecretAvailable: process.env.JWT_SECRET ? true : false,
          jwtRefreshSecretAvailable: process.env.JWT_REFRESH_SECRET ? true : false
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'JWT test failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        debug: {
          errorType: error.name,
          jwtSecretAvailable: process.env.JWT_SECRET ? true : false,
          jwtRefreshSecretAvailable: process.env.JWT_REFRESH_SECRET ? true : false
        }
      });
    }
  }
};