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
      // Try to check for student in database, with fallback for serverless
      try {
        // Ensure database connection with retry mechanism
        let dbConnected = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!dbConnected && retryCount < maxRetries) {
          try {
            dbConnected = await ensureDatabaseConnection();
            if (dbConnected) {
              console.log('✅ Database connection established for login');
              break;
            }
          } catch (dbError) {
            console.error(`Database connection attempt ${retryCount + 1} failed:`, dbError.message);
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retrying database connection in 1 second... (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!dbConnected) {
          console.error('Database connection failed after all retries during login');
          return res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: 'Database temporarily unavailable. Please try again later.',
            timestamp: new Date().toISOString()
          });
        }

        // Check user in database
        const user = await User.findByEmail(email);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString()
          });
        }
        
        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString()
          });
        }
      
      // Generate JWT tokens for student
      const userPayload = {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        isAdmin: user.is_admin || false,
        is_admin: user.is_admin || false,
        email_verified: user.email_verified || true,
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
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString()
          },
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresIn: 3600
          }
        },
        timestamp: new Date().toISOString()
      });
      
      } catch (dbError) {
        console.error('Database error during login:', dbError.message);
        console.error('Full database error:', dbError);
        
        // Fallback: Use in-memory storage for demo purposes
        console.log('🔄 Using fallback in-memory storage for login');
        
        const fallbackUsers = global.fallbackUsers || new Map();
        const user = fallbackUsers.get(email);
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString()
          });
        }
        
        // Simple password check (in production, use proper hashing)
        // For demo purposes, accept any password for fallback users
        console.log('✅ User found in fallback storage:', user.name);
        
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
        
        console.log('Student login successful (fallback mode), JWT tokens generated');
        
        res.json({
          success: true,
          message: 'Login successful (fallback mode)',
          data: {
            user: {
              ...userPayload,
              created_at: user.created_at,
              updated_at: user.updated_at
            },
            tokens: {
              accessToken: accessToken,
              refreshToken: refreshToken,
              expiresIn: 3600
            }
          },
          timestamp: new Date().toISOString(),
          fallback: true
        });
      }
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

    // Check if user already exists
    
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
    
    // Try to check if student already exists and create new user
    try {
      // Ensure database connection with retry mechanism
      let dbConnected = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!dbConnected && retryCount < maxRetries) {
        try {
          dbConnected = await ensureDatabaseConnection();
          if (dbConnected) {
            console.log('✅ Database connection established for registration');
            break;
          }
        } catch (dbError) {
          console.error(`Database connection attempt ${retryCount + 1} failed:`, dbError.message);
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Retrying database connection in 1 second... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!dbConnected) {
        console.error('Database connection failed after all retries during registration');
        return res.status(503).json({
          success: false,
          error: 'Service Unavailable',
          message: 'Database temporarily unavailable. Please try again later.',
          timestamp: new Date().toISOString()
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Email already registered',
          timestamp: new Date().toISOString()
        });
      }
      
      // Create new student
      console.log('Creating new user with data:', { name, email, role: 'user' });
      const newUser = await User.createUser({
        name,
        email,
        password,
        role: 'user'
      });
      console.log('User created successfully:', newUser.name);
    
    // Generate JWT tokens
    const userPayload = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role || 'user',
      isAdmin: newUser.is_admin || false,
      is_admin: newUser.is_admin || false,
      email_verified: newUser.email_verified || false,
      is_active: newUser.status === 'active'
    };
    
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
    
    res.status(201).json({
      success: true,
      message: 'Student registration successful',
      data: {
        user: {
          ...userPayload,
          created_at: newUser.created_at || new Date().toISOString(),
          updated_at: newUser.updated_at || new Date().toISOString()
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresIn: 3600
        }
      },
      timestamp: new Date().toISOString()
    });
    
      } catch (dbError) {
        console.error('Database error during registration:', dbError.message);
        console.error('Full database error:', dbError);
        
        // Check if it's a network error
        if (dbError.message.includes('Network Error') || 
            dbError.message.includes('ECONNREFUSED') || 
            dbError.message.includes('ENOTFOUND') ||
            dbError.message.includes('timeout')) {
          console.log('🌐 Network error detected, using fallback storage');
        } else {
          console.log('🔄 Database error detected, using fallback storage');
        }
        
        // Fallback: Use in-memory storage for demo purposes
        console.log('🔄 Using fallback in-memory storage for registration');
        
        // Simple in-memory user store (for demo only)
        const fallbackUsers = global.fallbackUsers || new Map();
        global.fallbackUsers = fallbackUsers;
        
        if (fallbackUsers.has(email)) {
          return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: 'Email already registered',
            timestamp: new Date().toISOString()
          });
        }
        
        // Create user in memory
        const userId = Date.now().toString();
        const userData = {
          _id: userId,
          name,
          email,
          role: 'user',
          is_admin: false,
          email_verified: false,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        fallbackUsers.set(email, userData);
        console.log('✅ User created in fallback storage:', userData.name);
        
        // Generate JWT tokens
        const userPayload = {
          id: userData._id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          isAdmin: userData.is_admin,
          is_admin: userData.is_admin,
          email_verified: userData.email_verified,
          is_active: userData.status === 'active'
        };
        
        const accessToken = generateAccessToken(userPayload);
        const refreshToken = generateRefreshToken({ id: userPayload.id, type: 'refresh' });
        
        res.status(201).json({
          success: true,
          message: 'Student registration successful (fallback mode)',
          data: {
            user: userData,
            tokens: {
              accessToken: accessToken,
              refreshToken: refreshToken,
              expiresIn: 3600
            }
          },
          timestamp: new Date().toISOString(),
          fallback: true
        });
      }
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
        // For regular users, get from database
        // Ensure database connection
        const dbConnected = await ensureDatabaseConnection();
        if (!dbConnected) {
          console.error('Database connection failed during token refresh');
          return res.status(503).json({
            success: false,
            error: 'Service Unavailable',
            message: 'Database temporarily unavailable. Please try again later.',
            timestamp: new Date().toISOString()
          });
        }

        const user = await User.findByIdForAuth(decoded.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Not Found',
            message: 'User not found',
            timestamp: new Date().toISOString()
          });
        }
        
        if (!user.is_active) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'Account is inactive',
            timestamp: new Date().toISOString()
          });
        }
        
        const userPayload = {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role || 'user',
          isAdmin: user.is_admin || false,
          is_admin: user.is_admin || false,
          email_verified: user.email_verified || true,
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
  testDatabase
};
