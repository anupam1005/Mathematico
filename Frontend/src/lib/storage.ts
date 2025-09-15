/**
 * A utility class for handling localStorage with type safety and error handling
 */
class StorageUtil {
  /**
   * Get an item from localStorage
   * @param key The key to get
   * @param defaultValue The default value to return if the key doesn't exist
   * @returns The parsed value or the default value
   */
  static get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * Set an item in localStorage
   * @param key The key to set
   * @param value The value to set (will be stringified)
   */
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item in localStorage: ${key}`, error);
    }
  }

  /**
   * Remove an item from localStorage
   * @param key The key to remove
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key The key to check
   * @returns True if the key exists, false otherwise
   */
  static has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error(`Error checking item in localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Get multiple items from localStorage
   * @param keys Array of keys to get
   * @returns An object with keys and their values
   */
  static getMany<T>(keys: string[]): Record<string, T | null> {
    return keys.reduce((result, key) => {
      result[key] = this.get<T>(key, null);
      return result;
    }, {} as Record<string, T | null>);
  }

  /**
   * Set multiple items in localStorage
   * @param items Object with keys and values to set
   */
  static setMany<T>(items: Record<string, T>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  /**
   * Remove multiple items from localStorage
   * @param keys Array of keys to remove
   */
  static removeMany(keys: string[]): void {
    keys.forEach(key => this.remove(key));
  }
}

export { StorageUtil };
