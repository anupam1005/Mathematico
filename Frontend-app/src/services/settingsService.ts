// settingsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config';

export interface PendingSetting {
  id: string;
  settings: Partial<UserSettings>;
  timestamp: number;
  retryCount: number;
}

export interface Settings extends UserSettings {}

export const getLocalSettings = async (): Promise<UserSettings> => {
  try {
    const settings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    return settings ? JSON.parse(settings) : { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error getting local settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

export const getServerSettings = async (): Promise<UserSettings> => {
  try {
    const response = await fetchWithRetry(
      `${API_CONFIG.mobile}/settings`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
    const data = await response.json();
    return data.data || { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error getting server settings:', error);
    throw error;
  }
};

export const getPendingSettings = async (): Promise<PendingSetting[]> => {
  try {
    const pending = await AsyncStorage.getItem(PENDING_SETTINGS_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Error getting pending settings:', error);
    return [];
  }
};

export const addPendingSettings = async (settings: Partial<UserSettings>): Promise<PendingSetting[]> => {
  try {
    const pending = await getPendingSettings();
    const newPending: PendingSetting = {
      id: Date.now().toString(),
      settings,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    const updatedPending = [...pending, newPending];
    await AsyncStorage.setItem(PENDING_SETTINGS_KEY, JSON.stringify(updatedPending));
    return updatedPending;
  } catch (error) {
    console.error('Error adding pending settings:', error);
    throw error;
  }
};

export const clearPendingSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing pending settings:', error);
    throw error;
  }
};

export const clearLocalSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing local settings:', error);
    throw error;
  }
};

export interface SettingsResponse {
  success: boolean;
  message: string;
  data?: any;
  silent?: boolean;
  isOffline?: boolean;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };
  learning: {
    autoPlayVideos: boolean;
    downloadOverWifi: boolean;
  };
}

const SETTINGS_STORAGE_KEY = 'mathematico_user_settings';
const PENDING_SETTINGS_KEY = 'pending_settings';
const LANGUAGE_PREFERENCE_KEY = 'mathematico_language_preference';

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: true,
    showPhone: false,
  },
  preferences: {
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: 'system',
  },
  learning: {
    autoPlayVideos: true,
    downloadOverWifi: true,
  },
};

const handleError = (error: any, defaultMessage: string) => {
  console.error('Settings Service Error:', error);
  return {
    success: false,
    message: error.response?.data?.message || error.message || defaultMessage,
    silent: error.silent || false,
    isOffline: !navigator.onLine,
  };
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  timeout = 10000
): Promise<Response> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchWithRetry(url, options, retries - 1, timeout);
  }
};

export const SettingsService = {
  getSettings: async (): Promise<SettingsResponse> => {
    try {
      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;

      // Try to get settings from server if online
      if (isConnected) {
        try {
          const response = await fetchWithRetry(
            `${API_CONFIG.mobile}/settings`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
              },
            }
          );

          const data = await response.json();
          
          if (data.success && data.data) {
            // Save to local storage
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data.data));
            return {
              success: true,
              message: 'Settings loaded successfully',
              data: data.data,
            };
          }
        } catch (error) {
          console.warn('Failed to fetch settings from server, using local copy', error);
        }
      }

      // Fall back to local storage
      const localSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (localSettings) {
        return {
          success: true,
          message: 'Settings loaded from local storage',
          data: JSON.parse(localSettings),
          isOffline: !isConnected,
        };
      }

      // Return default settings if nothing is found
      return {
        success: true,
        message: 'Using default settings',
        data: DEFAULT_SETTINGS,
        isOffline: !isConnected,
      };
    } catch (error) {
      return handleError(error, 'Failed to load settings');
    }
  },

  updateSettings: async (newSettings: Partial<UserSettings>): Promise<SettingsResponse> => {
    try {
      const currentSettings = await SettingsService.getSettings();
      if (!currentSettings.success) {
        throw new Error('Failed to get current settings');
      }

      const updatedSettings = {
        ...(currentSettings.data || DEFAULT_SETTINGS),
        ...newSettings,
      };

      // Save to local storage immediately for offline support
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected ?? false;

      if (!isConnected) {
        // Queue for sync when back online
        await AsyncStorage.setItem(PENDING_SETTINGS_KEY, JSON.stringify(newSettings));
        return {
          success: true,
          message: 'Settings saved locally and will sync when online',
          data: updatedSettings,
          isOffline: true,
        };
      }

      // Try to sync with server
      try {
        const response = await fetchWithRetry(
          `${API_CONFIG.mobile}/settings`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSettings),
          }
        );

        const data = await response.json();
        
        if (data.success) {
          // Clear any pending settings
          await AsyncStorage.removeItem(PENDING_SETTINGS_KEY);
          return {
            success: true,
            message: 'Settings updated successfully',
            data: updatedSettings,
          };
        } else {
          throw new Error(data.message || 'Failed to update settings');
        }
      } catch (error) {
        // If server update fails but we have local changes, queue for sync
        await AsyncStorage.setItem(PENDING_SETTINGS_KEY, JSON.stringify(newSettings));
        return {
          success: true,
          message: 'Settings saved locally but failed to sync with server. Will retry later.',
          data: updatedSettings,
          isOffline: true,
        };
      }
    } catch (error) {
      return handleError(error, 'Failed to update settings');
    }
  },

  clearSettings: async (): Promise<SettingsResponse> => {
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
      await AsyncStorage.removeItem(PENDING_SETTINGS_KEY);
      
      return {
        success: true,
        message: 'Settings cleared successfully',
      };
    } catch (error) {
      return handleError(error, 'Failed to clear settings');
    }
  },

  syncPendingSettings: async (): Promise<boolean> => {
    try {
      const pendingSettings = await AsyncStorage.getItem(PENDING_SETTINGS_KEY);
      if (!pendingSettings) return true;

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) return false;

      const response = await fetchWithRetry(
        `${API_CONFIG.mobile}/settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: pendingSettings,
        }
      );

      if (response.ok) {
        await AsyncStorage.removeItem(PENDING_SETTINGS_KEY);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync pending settings:', error);
      return false;
    }
  },
};

// Initialize network listener for syncing pending settings
NetInfo.addEventListener((state: NetInfoState) => {
  if (state.isConnected) {
    SettingsService.syncPendingSettings();
  }
});

export default SettingsService;