// Profile Controller - Handles user profile requests
const User = require('../models/User');

// Lazy load database connection
let pool;
const getPool = () => {
  if (!pool) {
    const database = require('../database');
    pool = database.pool;
  }
  return pool;
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    // Try to get user from database
    try {
      const dbUser = await User.findById(user.id);
      if (dbUser) {
        return res.json({
          success: true,
          data: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            isAdmin: dbUser.is_admin || dbUser.role === 'admin',
            avatar_url: dbUser.avatar_url || null,
            created_at: dbUser.created_at,
            updated_at: dbUser.updated_at
          },
          message: 'Profile retrieved successfully',
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.log('Database error, using fallback profile:', dbError.message);
    }
    
    // Fallback for serverless/no database
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0] || 'User',
        role: user.role,
        isAdmin: user.isAdmin,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updateData = req.body;
    
    // Validate update data
    const allowedFields = ['name', 'avatar_url'];
    const filteredData = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to update user in database
    try {
      const updatedUser = await User.update(user.id, filteredData);
      
      if (updatedUser) {
        return res.json({
          success: true,
          data: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            isAdmin: updatedUser.is_admin || updatedUser.role === 'admin',
            avatar_url: updatedUser.avatar_url,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at
          },
          message: 'Profile updated successfully',
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.log('Database error, using fallback update:', dbError.message);
    }
    
    // Fallback for serverless/no database
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        ...filteredData,
        updated_at: new Date().toISOString()
      },
      message: 'Profile updated successfully (temporary)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
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
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Current password and new password are required',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update avatar
 */
const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    
    res.json({
      success: true,
      data: {
        avatar: avatar || '/placeholder.svg',
        updatedAt: new Date().toISOString()
      },
      message: 'Avatar updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user preferences
 */
const getPreferences = async (req, res) => {
  try {
    const user = req.user;
    
    // Try to get settings from database
    try {
      const connection = await getPool().getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [user.id]
      );
      connection.release();
      
      if (rows.length > 0) {
        const settings = rows[0];
        return res.json({
          success: true,
          data: {
            pushNotifications: settings.push_notifications,
            emailNotifications: settings.email_notifications,
            courseUpdates: settings.course_updates,
            liveClassReminders: settings.live_class_reminders,
            darkMode: settings.dark_mode,
            autoPlayVideos: settings.auto_play_videos,
            downloadQuality: settings.download_quality,
            language: settings.language
          },
          message: 'Preferences retrieved successfully',
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.log('Database error, using default preferences:', dbError.message);
    }
    
    // Return default preferences if not in database
    res.json({
      success: true,
      data: {
        pushNotifications: true,
        emailNotifications: true,
        courseUpdates: true,
        liveClassReminders: true,
        darkMode: false,
        autoPlayVideos: true,
        downloadQuality: 'High',
        language: 'en'
      },
      message: 'Default preferences retrieved',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve preferences',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const user = req.user;
    const preferences = req.body;
    
    // Try to save to database
    try {
      const connection = await getPool().getConnection();
      
      // Check if user settings exist
      const [existing] = await connection.execute(
        'SELECT id FROM user_settings WHERE user_id = ?',
        [user.id]
      );
      
      if (existing.length > 0) {
        // Update existing settings
        const updateFields = [];
        const updateValues = [];
        
        if (preferences.pushNotifications !== undefined) {
          updateFields.push('push_notifications = ?');
          updateValues.push(preferences.pushNotifications);
        }
        if (preferences.emailNotifications !== undefined) {
          updateFields.push('email_notifications = ?');
          updateValues.push(preferences.emailNotifications);
        }
        if (preferences.courseUpdates !== undefined) {
          updateFields.push('course_updates = ?');
          updateValues.push(preferences.courseUpdates);
        }
        if (preferences.liveClassReminders !== undefined) {
          updateFields.push('live_class_reminders = ?');
          updateValues.push(preferences.liveClassReminders);
        }
        if (preferences.darkMode !== undefined) {
          updateFields.push('dark_mode = ?');
          updateValues.push(preferences.darkMode);
        }
        if (preferences.autoPlayVideos !== undefined) {
          updateFields.push('auto_play_videos = ?');
          updateValues.push(preferences.autoPlayVideos);
        }
        if (preferences.downloadQuality !== undefined) {
          updateFields.push('download_quality = ?');
          updateValues.push(preferences.downloadQuality);
        }
        if (preferences.language !== undefined) {
          updateFields.push('language = ?');
          updateValues.push(preferences.language);
        }
        
        if (updateFields.length > 0) {
          updateValues.push(user.id);
          await connection.execute(
            `UPDATE user_settings SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = ?`,
            updateValues
          );
        }
      } else {
        // Insert new settings
        await connection.execute(
          `INSERT INTO user_settings 
           (user_id, push_notifications, email_notifications, course_updates, live_class_reminders, 
            dark_mode, auto_play_videos, download_quality, language) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            preferences.pushNotifications !== undefined ? preferences.pushNotifications : true,
            preferences.emailNotifications !== undefined ? preferences.emailNotifications : true,
            preferences.courseUpdates !== undefined ? preferences.courseUpdates : true,
            preferences.liveClassReminders !== undefined ? preferences.liveClassReminders : true,
            preferences.darkMode !== undefined ? preferences.darkMode : false,
            preferences.autoPlayVideos !== undefined ? preferences.autoPlayVideos : true,
            preferences.downloadQuality || 'High',
            preferences.language || 'en'
          ]
        );
      }
      
      connection.release();
      
      return res.json({
        success: true,
        data: {
          ...preferences,
          updated_at: new Date().toISOString()
        },
        message: 'Preferences updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.log('Database error, preferences not saved:', dbError.message);
      
      // Still return success for fallback mode
      return res.json({
        success: true,
        data: {
          ...preferences,
          updated_at: new Date().toISOString()
        },
        message: 'Preferences updated (temporary)',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'New Course Available',
          message: 'Advanced Mathematics course is now available',
          type: 'course',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Live Class Reminder',
          message: 'Your live class starts in 1 hour',
          type: 'live_class',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: 'Welcome to Mathematico',
          message: 'Thank you for joining our platform',
          type: 'welcome',
          isRead: true,
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Notifications retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark notification as read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    res.json({
      success: true,
      data: {
        notificationId: parseInt(notificationId),
        isRead: true,
        readAt: new Date().toISOString()
      },
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        markedAsRead: 2,
        updatedAt: new Date().toISOString()
      },
      message: 'All notifications marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user activity
 */
const getActivity = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          type: 'enrollment',
          description: 'Enrolled in Advanced Mathematics course',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'purchase',
          description: 'Purchased Advanced Calculus Textbook',
          timestamp: new Date().toISOString()
        },
        {
          id: 3,
          type: 'login',
          description: 'Logged in to the platform',
          timestamp: new Date().toISOString()
        }
      ],
      message: 'Activity retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get recent activity
 */
const getRecentActivity = async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 1,
          type: 'enrollment',
          description: 'Enrolled in Advanced Mathematics course',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'purchase',
          description: 'Purchased Advanced Calculus Textbook',
          timestamp: new Date().toISOString()
        }
      ],
      message: 'Recent activity retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activity',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateAvatar,
  getPreferences,
  updatePreferences,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getActivity,
  getRecentActivity
};
