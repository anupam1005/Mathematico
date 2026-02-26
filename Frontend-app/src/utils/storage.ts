import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        // Prefer SecureStore for mobile; fall back to AsyncStorage if SecureStore fails
        try {
          await SecureStore.setItemAsync(key, valueToStore);
        } catch (secureStoreError: any) {
          safeCatch('Storage.setItem.secureStore')(secureStoreError);
          try {
            await AsyncStorage.setItem(key, valueToStore);
          } catch (asyncStorageError: any) {
            safeCatch('Storage.setItem.asyncStorage')(asyncStorageError);
            // Swallow to avoid breaking auth flows; app may run without persistence.
          }
        }
      }
    } catch (error: any) {
      safeCatch('Storage.setItem')(error);
      // Do not throw: storage failures should not block critical flows (e.g., login/register).
    }
  }

  static async getItem<T = any>(key: string, parseJson: boolean = true): Promise<T | string | null> {
    try {
      let result: string | null = null;
      
      if (Platform.OS === 'web') {
        // Use localStorage for web
        result = localStorage.getItem(key);
      } else {
        // Prefer SecureStore for mobile; fall back to AsyncStorage if SecureStore fails
        try {
          result = await SecureStore.getItemAsync(key);
          // Validate SecureStore result in production
          if (result && typeof result === 'string' && result.length > 0) {
          }
        } catch (secureStoreError: any) {
          safeCatch('Storage.getItem.secureStore')(secureStoreError);
          try {
            result = await AsyncStorage.getItem(key);
            if (result) {
            }
          } catch (asyncStorageError: any) {
            safeCatch('Storage.getItem.asyncStorage')(asyncStorageError);
            result = null;
          }
        }
      }
      
      if (!result) {
        return null;
      }
      
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
        // Prefer SecureStore for mobile; fall back to AsyncStorage if SecureStore fails
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (secureStoreError: any) {
          safeCatch('Storage.deleteItem.secureStore')(secureStoreError);
          try {
            await AsyncStorage.removeItem(key);
          } catch (asyncStorageError: any) {
            safeCatch('Storage.deleteItem.asyncStorage')(asyncStorageError);
            // swallow
          }
        }
      }
    } catch (error: any) {
      safeCatch('Storage.deleteItem')(error);
      // Do not throw - cleanup failure should not break logout flows.
    }
  }

  static async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Clear localStorage for web
        localStorage.clear();
      } else {
        // Clear SecureStore / AsyncStorage for mobile
        const keys = ['authToken', 'refreshToken', 'user'];

        for (const k of keys) {
          try {
            await SecureStore.deleteItemAsync(k);
          } catch (secureStoreError: any) {
            safeCatch('Storage.clear.secureStore')(secureStoreError);
          }
          try {
            await AsyncStorage.removeItem(k);
          } catch (asyncStorageError: any) {
            safeCatch('Storage.clear.asyncStorage')(asyncStorageError);
          }
        }
      }
    } catch (error: any) {
      safeCatch('Storage.clear')(error);
      // Do not throw - clear is best-effort.
    }
  }
}
