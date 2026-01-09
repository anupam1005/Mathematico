import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Storage utility that works on both web and mobile
export class Storage {
  static async setItem(key: string, value: any): Promise<void> {
    try {
      // Stringify the value if it's an object
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      
      console.log(`Storage: Setting ${key} = ${typeof value === 'string' 
        ? value.substring(0, 20) + '...' 
        : '[Object]'}`);
        
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.setItem(key, valueToStore);
        console.log(`Storage: Set ${key} in localStorage`);
      } else {
        // Use SecureStore for mobile
        await SecureStore.setItemAsync(key, valueToStore);
        console.log(`Storage: Set ${key} in SecureStore`);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Storage setItem failed';
      console.error('Storage setItem error:', errMsg);
      throw new Error(errMsg);
    }
  }

  static async getItem<T = any>(key: string, parseJson: boolean = true): Promise<T | string | null> {
    try {
      console.log(`Storage: Getting ${key}`);
      let result: string | null = null;
      
      if (Platform.OS === 'web') {
        // Use localStorage for web
        result = localStorage.getItem(key);
        console.log(`Storage: Got ${key} from localStorage:`, result ? (result.length > 20 ? result.substring(0, 20) + '...' : result) : 'null');
      } else {
        // Use SecureStore for mobile
        result = await SecureStore.getItemAsync(key);
        console.log(`Storage: Got ${key} from SecureStore:`, result ? (result.length > 20 ? result.substring(0, 20) + '...' : result) : 'null');
      }
      
      if (!result) return null;
      
      // Try to parse JSON if it looks like JSON and parseJson is true
      if (parseJson && (result.startsWith('{') || result.startsWith('['))) {
        try {
          return JSON.parse(result) as T;
        } catch (e) {
          console.warn(`Failed to parse stored JSON for key ${key}:`, e);
          return result;
        }
      }
      
      return result;
    } catch (error: any) {
      const errMsg = error?.message || 'Storage getItem failed';
      console.error('Storage getItem error:', errMsg);
      return null;
    }
  }

  static async deleteItem(key: string): Promise<void> {
    try {
      console.log(`Storage: Deleting ${key}`);
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.removeItem(key);
        console.log(`Storage: Deleted ${key} from localStorage`);
      } else {
        // Use SecureStore for mobile
        await SecureStore.deleteItemAsync(key);
        console.log(`Storage: Deleted ${key} from SecureStore`);
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Storage deleteItem failed';
      console.error('Storage deleteItem error:', errMsg);
      throw new Error(errMsg);
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
      const errMsg = error?.message || 'Storage clear failed';
      console.error('Storage clear error:', errMsg);
      throw new Error(errMsg);
    }
  }
}
