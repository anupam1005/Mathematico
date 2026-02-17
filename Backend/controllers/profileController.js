// Profile Controller - Handles user profile operations
const connectDB = require('../config/database');

// Import User model
let UserModel;
try {
  UserModel = require('../models/User');
} catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ User model not available:', error && error.message ? error.message : error);
  }
}

const { uploadFileToCloud } = require('../utils/fileUpload');

const DEFAULT_SETTINGS = {
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: true,
    showPhone: false
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
    theme: 'system'
  },
  learning: {
    autoPlayVideos: true,
    downloadOverWifi: true
  }
};

const mergeSettings = (current = {}, updates = {}) => ({
  notifications: {
    ...DEFAULT_SETTINGS.notifications,
    ...(current.notifications || {}),
    ...(updates.notifications || {})
  },
  privacy: {
    ...DEFAULT_SETTINGS.privacy,
    ...(current.privacy || {}),
    ...(updates.privacy || {})
  },
  preferences: {
    ...DEFAULT_SETTINGS.preferences,
    ...(current.preferences || {}),
    ...(updates.preferences || {})
  },
  learning: {
    ...DEFAULT_SETTINGS.learning,
    ...(current.learning || {}),
    ...(updates.learning || {})
  }
});

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
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

    const publicUser = user.getPublicProfile();

    return res.json({
      success: true,
      data: {
        user: publicUser
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
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

    const updatedUser = user.getPublicProfile();

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
};

/**
 * Upload profile picture
 */
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        message: 'User model unavailable'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture file is required'
      });
    }

    await connectDB();

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const uploadResult = await uploadFileToCloud(req.file, 'mathematico/users/profile', 'cloudinary');
    user.profilePicture = uploadResult.url;
    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: user.profilePicture
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete profile picture
 */
const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        message: 'User model unavailable'
      });
    }

    await connectDB();
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.profilePicture = null;
    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Profile picture deleted successfully',
      data: {
        profilePicture: null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentPassword = req.body.currentPassword || req.body.oldPassword;
    const newPassword = req.body.newPassword || req.body.password;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        message: 'User model unavailable'
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

    const passwordMatches = await user.comparePassword(currentPassword);
    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.refreshTokens = [];
    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user settings
 */
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        message: 'User model unavailable'
      });
    }

    await connectDB();
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let resolvedSettings = mergeSettings(user.settings || {});

    if ((!user.settings || Object.keys(user.settings || {}).length === 0) && user.preferences) {
      resolvedSettings = mergeSettings(resolvedSettings, {
        notifications: user.preferences.notifications || {},
        preferences: {
          language: user.preferences.language,
          timezone: user.preferences.timezone,
          theme: user.preferences.theme
        }
      });
    }

    return res.json({
      success: true,
      data: resolvedSettings,
      timestamp: new Date().toISOString()
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
  try {
    const userId = req.user.id;
    const updates = req.body || {};

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        message: 'User model unavailable'
      });
    }

    await connectDB();
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const mergedSettings = mergeSettings(user.settings || {}, updates);
    user.settings = mergedSettings;

    if (!user.preferences) {
      user.preferences = {
        notifications: {},
        language: DEFAULT_SETTINGS.preferences.language,
        timezone: DEFAULT_SETTINGS.preferences.timezone,
        theme: DEFAULT_SETTINGS.preferences.theme
      };
    }

    if (updates.notifications) {
      user.preferences.notifications = {
        ...(user.preferences.notifications || {}),
        ...updates.notifications
      };
    }

    if (updates.preferences) {
      user.preferences.language = updates.preferences.language || user.preferences.language;
      user.preferences.timezone = updates.preferences.timezone || user.preferences.timezone;
      user.preferences.theme = updates.preferences.theme || user.preferences.theme;
    }

    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: mergedSettings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user settings',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user account
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!UserModel) {
      return res.status(503).json({
        success: false,
        message: 'User model unavailable'
      });
    }

    await connectDB();
    const user = await UserModel.findById(userId).select('+refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = false;
    user.deactivated = true;
    user.refreshTokens = [];
    user.updatedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Account deactivated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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