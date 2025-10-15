import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

// Create axios instance for settings endpoints
const api = axios.create({
  baseURL: API_CONFIG.auth,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  courseUpdates: boolean;
  liveClassReminders: boolean;
  darkMode: boolean;
  autoPlayVideos: boolean;
  downloadQuality: 'Low' | 'Medium' | 'High';
  language: string;
}

const settingsService = {
  async getSettings(): Promise<{ success: boolean; data?: UserSettings; message: string }> {
    try {
      console.log('SettingsService: Fetching user settings...');
      const response = await api.get('/preferences');
      
      if (response.data.success) {
        console.log('SettingsService: Settings retrieved successfully');
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Settings retrieved successfully',
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to retrieve settings',
        };
      }
    } catch (error: any) {
      console.error('SettingsService: Error fetching settings:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to retrieve settings',
      };
    }
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; message: string }> {
    try {
      console.log('SettingsService: Updating user settings...', settings);
      const response = await api.put('/preferences', settings);
      
      if (response.data.success) {
        console.log('SettingsService: Settings updated successfully');
        return {
          success: true,
          message: response.data.message || 'Settings updated successfully',
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to update settings',
        };
      }
    } catch (error: any) {
      console.error('SettingsService: Error updating settings:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update settings',
      };
    }
  },
};

export default settingsService;

