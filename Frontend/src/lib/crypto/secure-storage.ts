import CryptoJS from 'crypto-js';

type StorageType = 'local' | 'session';
type StorageValue = string | number | boolean | object | null;

class SecureStorageError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'SecureStorageError';
    Object.setPrototypeOf(this, SecureStorageError.prototype);
  }
}

/**
 * Secure storage utility for encrypting data in localStorage and sessionStorage
 */
class SecureStorage {
  private storage: Storage;
  private static readonly STORAGE_KEY_PREFIX = 'secure_';
  private static readonly ENCRYPTION_KEY = this.getEncryptionKey();

  constructor(public readonly storageType: StorageType = 'local') {
    if (typeof window === 'undefined') {
      throw new SecureStorageError('SecureStorage is only available in browser environments');
    }
    
    this.storage = storageType === 'local' ? window.localStorage : window.sessionStorage;
    this.validateEnvironment();
  }

  private static getEncryptionKey(): string {
    const key = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY;
    if (!key) {
      throw new SecureStorageError('VITE_STORAGE_ENCRYPTION_KEY is not defined in environment variables');
    }
    return key;
  }

  private validateEnvironment(): void {
    try {
      this.storage.setItem('test', 'test');
      this.storage.removeItem('test');
    } catch (error) {
      throw new SecureStorageError('Storage is not available in this environment', error);
    }
  }

  private getStorageKey(key: string): string {
    return `${SecureStorage.STORAGE_KEY_PREFIX}${key}`;
  }

  /**
   * Encrypt data before storing
   */
  private encrypt(data: StorageValue): string {
    try {
      if (data === null || data === undefined) {
        throw new SecureStorageError('Cannot encrypt null or undefined value');
      }
      const dataString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(dataString, SecureStorage.ENCRYPTION_KEY).toString();
    } catch (error) {
      if (error instanceof SecureStorageError) throw error;
      throw new SecureStorageError('Failed to encrypt data', error);
    }
  }

  /**
   * Decrypt data after retrieving
   */
  private decrypt<T = unknown>(encryptedData: string): T | null {
    try {
      if (!encryptedData) {
        throw new SecureStorageError('No data provided for decryption');
      }
      const bytes = CryptoJS.AES.decrypt(encryptedData, SecureStorage.ENCRYPTION_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        throw new SecureStorageError('Failed to decrypt data - invalid key or corrupted data');
      }
      
      return JSON.parse(decryptedData) as T;
    } catch (error) {
      if (error instanceof SecureStorageError) throw error;
      throw new SecureStorageError('Failed to decrypt data', error);
    }
  }

  /**
   * Set an item in storage
   */
  setItem<T extends StorageValue>(key: string, value: T): void {
    try {
      const storageKey = this.getStorageKey(key);
      const encryptedValue = this.encrypt(value);
      this.storage.setItem(storageKey, encryptedValue);
    } catch (error) {
      if (error instanceof SecureStorageError) throw error;
      throw new SecureStorageError(`Failed to set item '${key}' in storage`, error);
    }
  }

  /**
   * Get an item from storage
   */
  getItem<T = StorageValue>(key: string, defaultValue: T | null = null): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      const encryptedValue = this.storage.getItem(storageKey);
      
      if (encryptedValue === null) {
        return defaultValue;
      }
      
      return this.decrypt<T>(encryptedValue);
    } catch (error) {
      if (error instanceof SecureStorageError) {
        console.warn(`SecureStorage getItem('${key}') failed:`, error.message);
      } else {
        console.error(`SecureStorage getItem('${key}') error:`, error);
      }
      return defaultValue;
    }
  }

  /**
   * Remove an item from storage
   */
  removeItem(key: string): void {
    try {
      const storageKey = this.getStorageKey(key);
      this.storage.removeItem(storageKey);
    } catch (error) {
      throw new SecureStorageError(`Failed to remove item '${key}' from storage`, error);
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    try {
      // Only clear items with our prefix
      const prefix = SecureStorage.STORAGE_KEY_PREFIX;
      const keysToRemove = Object.keys(this.storage).filter(key => 
        key.startsWith(prefix)
      );
      
      keysToRemove.forEach(key => this.storage.removeItem(key));
    } catch (error) {
      throw new SecureStorageError('Failed to clear secure storage', error);
    }
  }

  /**
   * Get all keys in storage (only returns keys with our prefix)
   */
  keys(): string[] {
    try {
      const prefix = SecureStorage.STORAGE_KEY_PREFIX;
      return Object.keys(this.storage)
        .filter(key => key.startsWith(prefix))
        .map(key => key.slice(prefix.length));
    } catch (error) {
      throw new SecureStorageError('Failed to get storage keys', error);
    }
  }

  /**
   * Check if a key exists in storage
   */
  hasKey(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      return this.storage.getItem(storageKey) !== null;
    } catch (error) {
      throw new SecureStorageError(`Failed to check if key '${key}' exists`, error);
    }
  }

  /**
   * Get the number of items in storage (only counts items with our prefix)
   */
  get length(): number {
    return this.keys().length;
  }
}

// Create default instances
const secureLocalStorage = new SecureStorage('local');
const secureSessionStorage = new SecureStorage('session');

export { secureLocalStorage, secureSessionStorage, SecureStorage };
