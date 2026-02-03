import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { safeCatch } from './safeCatch';

// Storage utility that works on both web and mobile
export class Storage {
  static async setItem(key: string, value: any): Promise<void> {
    try {
      // Stringify the value if it's an object
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.setItem(key, valueToStore);
      } else {
        // Use SecureStore for mobile
        await SecureStore.setItemAsync(key, valueToStore);
      }
    } catch (error: any) {
      safeCatch('Storage.setItem')(error);
      throw new Error('Storage setItem failed');
    }
  }

  static async getItem<T = any>(key: string, parseJson: boolean = true): Promise<T | string | null> {
    try {
      let result: string | null = null;
      
      if (Platform.OS === 'web') {
        // Use localStorage for web
        result = localStorage.getItem(key);
      } else {
        // Use SecureStore for mobile
        result = await SecureStore.getItemAsync(key);
      }
      
      if (!result) return null;
      
      // Try to parse JSON if it looks like JSON and parseJson is true
      if (parseJson && (result.startsWith('{') || result.startsWith('['))) {
        try {
          return JSON.parse(result) as T;
        } catch (e) {
          safeCatch('Storage.getItem.parseJson')(e);
          return result;
        }
      }
      
      return result;
    } catch (error: any) {
      safeCatch('Storage.getItem')(error);
      return null;
    }
  }

  static async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.removeItem(key);
      } else {
        // Use SecureStore for mobile
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error: any) {
      safeCatch('Storage.deleteItem')(error);
      throw new Error('Storage deleteItem failed');
    }
  }

  static async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Clear localStorage for web
        localStorage.clear();
      } else {
        // Clear SecureStore for mobile
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
      }
    } catch (error: any) {
      safeCatch('Storage.clear')(error);
      throw new Error('Storage clear failed');
    }
  }
}
