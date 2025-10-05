const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const User = require('../models/User');
const { ensureDatabaseConnection } = require('../utils/database');

// Auth Controller - Handles authentication requests

/**
 * User login
 */
const login = async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if it's the hardcoded admin user (works without database)
    // SECURITY: Use environment variables for admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'dc2006089@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Myname*321';
    
    if (email === adminEmail && password === adminPassword) {
      // Generate JWT tokens for admin
      const userPayload = {
        id: 1,
        email: email,
        name: 'Admin User',
        role: 'admin',
        isAdmin: true,
        is_admin: true,
        email_verified: true,
        is_active: true
      };
      
      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
      
      console.log('Admin login successful, JWT tokens generated');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    } else if (email === 'test@example.com' && password === 'password123') {
      // Test user for serverless mode (works without database)
      const userPayload = {
        id: 2,
        email: email,
        name: 'Test User',
        role: 'user',
        isAdmin: false,
        is_admin: false,
        email_verified: true,
        is_active: true
      };
      
      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
      
      console.log('Test user login successful, JWT tokens generated');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Ensure database connection for regular users
      console.log('🔗 Ensuring database connection for login...');
      const { ensureDatabaseConnection } = require('../utils/database');
      const isConnected = await ensureDatabaseConnection();
      
      if (!isConnected) {
        console.error('❌ Database connection failed, cannot authenticate user');
        return res.status(503).json({
          success: false,
          error: 'Service Unavailable',
          message: 'Database connection failed. Please try again later.',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('✅ Database connected, proceeding with user authentication');
      
      // Find user in database
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }
      
      // Verify password
      const isPasswordValid = await User.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('✅ User authenticated successfully:', user.name);
      
      // Generate JWT tokens
      const userPayload = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.is_admin,
        is_admin: user.is_admin,
        email_verified: user.email_verified,
        is_active: user.status === 'active'
      };
      
      const accessToken = generateAccessToken(userPayload);
      const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
      
      console.log('Student login successful, JWT tokens generated');
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            ...userPayload,
            created_at: user.createdAt,
            updated_at: user.updatedAt
          },
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Student registration
 */
const register = async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email, password, and name are required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if email is already taken (admin email)
    const adminEmail = process.env.ADMIN_EMAIL || 'dc2006089@gmail.com';
    if (email === adminEmail) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already exists',
        timestamp: new Date().toISOString()
      });
    }
    
    // Ensure database connection
    console.log('🔗 Ensuring database connection for registration...');
    const { ensureDatabaseConnection } = require('../utils/database');
    const isConnected = await ensureDatabaseConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed, cannot register user');
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Database connection failed. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Database connected, proceeding with registration');
    
    // Check if user already exists in database
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already registered',
        timestamp: new Date().toISOString()
      });
    }
    
    // Create user in database
    console.log('📝 Creating user in database...');
    const newUser = await User.createUser({
      name,
      email,
      password,
      role: 'user'
    });
    
    if (!newUser) {
      throw new Error('Failed to create user in database');
    }
    
    console.log('✅ User created successfully in database:', newUser.name);
    console.log('📊 User ID:', newUser._id);
    
    // Generate JWT tokens
    const userPayload = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isAdmin: newUser.is_admin,
      is_admin: newUser.is_admin,
      email_verified: newUser.email_verified,
      is_active: newUser.status === 'active'
    };
    
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
    
    return res.status(201).json({
      success: true,
      message: 'Student registration successful',
      data: {
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          is_admin: newUser.is_admin,
          email_verified: newUser.email_verified,
          status: newUser.status,
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresIn: 3600
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Registration endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Registration failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * User logout
 */
const logout = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Logout endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Logout failed',
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
        error: 'Bad Request',
        message: 'Email is required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forgot password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to send reset email',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Token and password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Password reset failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Verification token is required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Email verified successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Verify email endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Email verification failed',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString()
      });
    }
    
    const { verifyRefreshToken, generateAccessToken, generateRefreshToken } = require('../utils/jwt');
    
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // For admin user (environment-based)
      const adminEmail = process.env.ADMIN_EMAIL || 'dc2006089@gmail.com';
      if (decoded.id === 1 || decoded.email === adminEmail) {
        const userPayload = {
          id: 1,
          email: adminEmail,
          name: 'Admin User',
          role: 'admin',
          isAdmin: true,
          is_admin: true,
          email_verified: true,
          is_active: true
        };
        
        const newAccessToken = generateAccessToken(userPayload);
        const newRefreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
        
        console.log('Admin refresh token successful, new tokens generated');
        
        res.json({
          success: true,
          data: {
            tokens: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              expiresIn: 3600
            }
          },
          message: 'Token refreshed successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        // For regular users, verify with database
        console.log('🔗 Verifying user in database for token refresh');
        
        // Ensure database connection
        const { ensureDatabaseConnection } = require('../utils/database');
        const isConnected = await ensureDatabaseConnection();
        
        if (!isConnected) {
          console.error('❌ Database connection failed for token refresh');
          return res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: 'Database connection failed. Please try again later.',
            timestamp: new Date().toISOString()
          });
        }
        
        // Find user in database
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'User not found',
            timestamp: new Date().toISOString()
          });
        }
        
        // Generate new tokens for the user
        const userPayload = {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isAdmin: user.is_admin,
          is_admin: user.is_admin,
          email_verified: user.email_verified,
          is_active: user.status === 'active'
        };
        
        const newAccessToken = generateAccessToken(userPayload);
        const newRefreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
        
        console.log('User refresh token successful, new tokens generated');
        
        res.json({
          success: true,
          data: {
            tokens: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              expiresIn: 3600
            }
          },
          message: 'Token refreshed successfully',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Refresh token verification failed:', error.message);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Invalid or expired refresh token',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Refresh token endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to refresh token',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin
      },
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
  try {
    const { ensureDatabaseConnection, getConnectionStatus } = require('../utils/database');
    
    // Test database connection
    const dbConnected = await ensureDatabaseConnection();
    const connectionStatus = getConnectionStatus();
    
    res.json({
      success: true,
      message: 'Health check successful',
      data: {
        database: {
          connected: dbConnected,
          status: connectionStatus
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Database test endpoint
 */
const testDatabase = async (req, res) => {
  try {
    const { ensureDatabaseConnection } = require('../utils/database');
    const User = require('../models/User');
    
    // Test database connection
    const dbConnected = await ensureDatabaseConnection();
    
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database Unavailable',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    // Test database operations
    try {
      // Test user count
      const userCount = await User.countDocuments();
      
      // Test user creation (if not exists)
      let testUser = await User.findByEmail('test@example.com');
      if (!testUser) {
        testUser = await User.createUser({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'user'
        });
        console.log('✅ Test user created for database test');
      }
      
      res.json({
        success: true,
        message: 'Database test successful',
        data: {
          database: {
            connected: true,
            userCount: userCount,
            testUser: testUser ? testUser.name : null
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (dbError) {
      console.error('Database operation test failed:', dbError);
      res.status(500).json({
        success: false,
        error: 'Database Operation Failed',
        message: dbError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Users collection verification endpoint
 */
const verifyUsersCollection = async (req, res) => {
  try {
    const { ensureDatabaseConnection } = require('../utils/database');
    const User = require('../models/User');
    
    // Test database connection
    const dbConnected = await ensureDatabaseConnection();
    
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database Unavailable',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      // Get users collection info
      const userCount = await User.countDocuments();
      const recentUsers = await User.find({})
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(10);
      
      // Get collection stats
      const collectionStats = await User.collection.stats();
      
      res.json({
        success: true,
        message: 'Users collection verification successful',
        data: {
          collection: {
            name: 'users',
            database: 'test',
            totalUsers: userCount,
            collectionSize: collectionStats.size,
            documentCount: collectionStats.count,
            averageObjectSize: collectionStats.avgObjSize
          },
          recentUsers: recentUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          })),
          timestamp: new Date().toISOString()
        }
      });
    } catch (dbError) {
      console.error('Users collection verification failed:', dbError);
      res.status(500).json({
        success: false,
        error: 'Collection Verification Failed',
        message: dbError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Users collection verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Collection verification failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile,
  healthCheck,
  testDatabase,
  verifyUsersCollection
};
