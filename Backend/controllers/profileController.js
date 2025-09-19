// Profile Controller - Handles user profile requests

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
        name: user.email.split('@')[0] || 'User',
        role: user.role,
        isAdmin: user.isAdmin,
        avatar: '/placeholder.svg',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
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
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        ...updateData,
        updatedAt: new Date().toISOString()
      },
      message: 'Profile updated successfully',
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
          showActivity: true
        },
        theme: {
          mode: 'light',
          primaryColor: '#3b82f6'
        },
        language: 'en',
        timezone: 'UTC'
      },
      message: 'Preferences retrieved successfully',
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
    const preferences = req.body;
    
    res.json({
      success: true,
      data: {
        ...preferences,
        updatedAt: new Date().toISOString()
      },
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    });
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
