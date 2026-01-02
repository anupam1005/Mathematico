<<<<<<< HEAD
// Profile Controller - Handles user profile operations
const connectDB = require('../config/database');

// Import User model
let UserModel;
try {
  UserModel = require('../models/User');
} catch (error) {
  console.warn('⚠️ User model not available:', error && error.message ? error.message : error);
}
=======
// Profile Controller - Handles user profile operations (No Database Version)
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
<<<<<<< HEAD
    const userId = req.user.id;
    
    if (!UserModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'User model unavailable' 
      });
    }

    // Connect to database
    await connectDB();

    // Find user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get public profile
    const publicUser = user.getPublicProfile();

    console.log('✅ Profile retrieved successfully:', user.email);

    return res.json({
      success: true,
      data: {
        user: publicUser
      },
      timestamp: new Date().toISOString()
    });
    
=======
    console.log('👤 User profile - database disabled');
    
    // Return user info from JWT token
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        user: user
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
<<<<<<< HEAD
      error: error.message,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
<<<<<<< HEAD
  try {
    const { name, email } = req.body;
    const userId = req.user.id;
    
    if (!UserModel) {
      return res.status(503).json({ 
        success: false, 
        message: 'User model unavailable' 
      });
    }

    // Connect to database
    await connectDB();

    // Find and update user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    
    await user.save();

    // Get updated user profile
    const updatedUser = user.getPublicProfile();

    console.log('✅ Profile updated successfully:', user.email);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
=======
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Profile update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Profile picture upload is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Delete profile picture
 */
const deleteProfilePicture = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Profile picture deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Password change is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Get user settings
 */
const getUserSettings = async (req, res) => {
  try {
    console.log('⚙️ User settings - database disabled');
    
    res.json({
      success: true,
      data: {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          theme: 'light'
        }
      },
      timestamp: new Date().toISOString(),
      message: 'Database functionality has been removed'
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user settings',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user settings
 */
const updateUserSettings = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Settings update is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Not Implemented',
    message: 'Account deletion is not available. Database functionality has been removed.',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  changePassword,
  getUserSettings,
  updateUserSettings,
  deleteAccount,
  // Aliases for route compatibility
  getPreferences: getUserSettings,
  updatePreferences: updateUserSettings
};