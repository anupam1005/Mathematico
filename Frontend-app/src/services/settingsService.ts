// Settings Service - Handles user settings and preferences (No Database Version)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';
import { API_CONFIG } from '../config';

const SETTINGS_STORAGE_KEY = 'mathematico_user_settings';

// Create a service error handler for settingsService
const errorHandler = createServiceErrorHandler('settingsService');

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
  learning: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    subjects: string[];
    studyReminders: boolean;
  };
}

export interface SettingsResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class SettingsService {
  // Legacy method for backward compatibility
  async getSettings(): Promise<SettingsResponse> {
    try {
      // First try to get from local storage
      const localSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (localSettings) {
        const parsedSettings = JSON.parse(localSettings);
        errorHandler.logInfo('📱 Loaded settings from local storage:', parsedSettings);
        return {
          success: true,
          data: parsedSettings,
          message: 'Settings loaded from local storage'
        };
      }

      // If no local settings, try API
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      const mobileUrl = `${backendUrl}/api/v1/mobile`;
      
      console.log('SettingsService: Fetching settings from:', `${mobileUrl}/settings`);
      
      const response = await fetch(`${mobileUrl}/settings`);
      const data = await response.json();
      
      if (data.success) {
        // Save to local storage for future use
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data.data));
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to fetch settings');
      }
    } catch (error) {
      errorHandler.logWarning('Settings API error:', error);
      const fallbackSettings = {
        pushNotifications: true,
        emailNotifications: true,
        courseUpdates: true,
        liveClassReminders: true,
        darkMode: false,
        autoPlayVideos: true,
        downloadQuality: 'High'
      };
      
      // Save fallback settings to local storage
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fallbackSettings));
      } catch (storageError) {
        errorHandler.logWarning('Failed to save fallback settings to storage:', storageError);
      }
      
      return {
        success: true,
        data: fallbackSettings,
        message: 'Using fallback settings data'
      };
    }
  }

  // Legacy method for backward compatibility
  async updateSettings(settings: any): Promise<SettingsResponse> {
    try {
      // First get current settings from local storage
      let currentSettings = {};
      try {
        const localSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (localSettings) {
          currentSettings = JSON.parse(localSettings);
        }
      } catch (storageError) {
        errorHandler.logWarning('Failed to read current settings from storage:', storageError);
      }

      // Merge with new settings
      const updatedSettings = { ...currentSettings, ...settings };
      
      // Save to local storage immediately
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      errorHandler.logInfo('📱 Settings saved to local storage:', updatedSettings);

      // Try to sync with API (but don't fail if it doesn't work)
      try {
        const { getBackendUrl } = await import('../config');
        const backendUrl = await getBackendUrl();
        const mobileUrl = `${backendUrl}/api/v1/mobile`;
        
        console.log('SettingsService: Syncing settings to:', `${mobileUrl}/settings`);
        
        const response = await fetch(`${mobileUrl}/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedSettings)
        });
        
        const data = await response.json();
        errorHandler.logInfo('📱 Settings synced with API:', data);
      } catch (apiError) {
        errorHandler.logWarning('Settings API sync failed (continuing with local storage):', apiError);
      }
      
      return {
        success: true,
        message: 'Settings updated successfully',
        data: updatedSettings
      };
    } catch (error) {
      errorHandler.handleError('Settings update failed:', error);
      return {
        success: false,
        message: 'Failed to update settings: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  }

  async getUserSettings(userId?: string): Promise<SettingsResponse> {
    return {
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
        },
        learning: {
          difficulty: 'beginner',
          subjects: [],
          studyReminders: true
        }
      },
      message: 'Database functionality has been removed'
    };
  }

  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<SettingsResponse> {
    throw new Error('Settings update is not available. Database functionality has been removed.');
  }

  async updateNotificationSettings(userId: string, notifications: Partial<UserSettings['notifications']>): Promise<SettingsResponse> {
    throw new Error('Notification settings update is not available. Database functionality has been removed.');
  }

  async updatePrivacySettings(userId: string, privacy: Partial<UserSettings['privacy']>): Promise<SettingsResponse> {
    throw new Error('Privacy settings update is not available. Database functionality has been removed.');
  }

  async updatePreferences(userId: string, preferences: Partial<UserSettings['preferences']>): Promise<SettingsResponse> {
    throw new Error('Preferences update is not available. Database functionality has been removed.');
  }

  async updateLearningSettings(userId: string, learning: Partial<UserSettings['learning']>): Promise<SettingsResponse> {
    throw new Error('Learning settings update is not available. Database functionality has been removed.');
  }

  async resetSettings(userId: string): Promise<SettingsResponse> {
    throw new Error('Settings reset is not available. Database functionality has been removed.');
  }

  async exportSettings(userId: string): Promise<SettingsResponse> {
    return {
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
        },
        learning: {
          difficulty: 'beginner',
          subjects: [],
          studyReminders: true
        }
      },
      message: 'Database functionality has been removed'
    };
  }

  async importSettings(userId: string, settingsData: any): Promise<SettingsResponse> {
    throw new Error('Settings import is not available. Database functionality has been removed.');
  }

  // Clear all settings from local storage
  async clearSettings(): Promise<SettingsResponse> {
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      return {
        success: true,
        message: 'Settings cleared successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to clear settings: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  }

  // App-specific settings
  async getAppSettings(): Promise<SettingsResponse> {
    return {
      success: true,
      data: {
        version: '2.0.0',
        database: 'disabled',
        features: {
          userRegistration: false,
          userProfiles: false,
          courseEnrollment: false,
          bookDownloads: false,
          liveClasses: false,
          payments: false,
          notifications: false
        },
        maintenance: false,
        message: 'Database functionality has been removed. Only admin authentication is available.'
      },
      message: 'Database functionality has been removed'
    };
  }

  async updateAppSettings(settings: any): Promise<SettingsResponse> {
    throw new Error('App settings update is not available. Database functionality has been removed.');
  }
}

export const settingsService = new SettingsService();
export default settingsService;