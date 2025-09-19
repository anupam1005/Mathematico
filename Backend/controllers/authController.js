const { generateJWT } = require('../middlewares/auth');
const User = require('../models/User');

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
    
    // Check if it's the hardcoded admin user
    if (email === 'dc2006089@gmail.com' && password === 'Myname*321') {
      // Generate JWT token for admin
      const token = generateJWT({ 
        userId: 1, 
        email: email, 
        role: 'admin' 
      });
      
      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: 1,
            email: email,
            name: 'Admin User',
            role: 'admin',
            isAdmin: true
          },
          token: token,
          expiresIn: '24h'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      // Check for student in database
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
      const isPasswordValid = await User.comparePassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate JWT token for student
      const token = generateJWT({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      res.json({
        success: true,
        message: 'Student login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isAdmin: false
          },
          token: token,
          expiresIn: '24h'
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
    if (email === 'dc2006089@gmail.com') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already exists',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if student already exists
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
    const newUser = await User.create({
      name,
      email,
      password,
      role: 'user'
    });
    
    // Generate JWT token
    const token = generateJWT({ 
      userId: newUser.id, 
      email: newUser.email, 
      role: newUser.role 
    });
    
    res.status(201).json({
      success: true,
      message: 'Student registration successful',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isAdmin: false
        },
        token: token,
        expiresIn: '24h'
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
 * Refresh token
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
    
    // Simple token refresh (in production, use proper JWT)
    const newToken = generateToken('refreshed');
    
    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newToken,
          refreshToken: newToken,
          expiresIn: 3600
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Refresh token endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Token refresh failed',
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

module.exports = {
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getProfile
};
