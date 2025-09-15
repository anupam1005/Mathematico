import { useState, useEffect, useCallback } from 'react';
import { StorageUtil } from '@/lib/storage';

/**
 * A custom hook for syncing state with localStorage
 * @param key The localStorage key to use
 * @param initialValue The initial value to use if the key doesn't exist
 * @returns [storedValue, setValue] - The stored value and a function to update it
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = StorageUtil.get<T>(key);
      // Parse stored json or return initialValue
      return item !== null ? item : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        StorageUtil.set(key, valueToStore);
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  // Sync between tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== event.oldValue) {
        try {
          const newValue = event.newValue ? JSON.parse(event.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error('Error parsing localStorage value:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export { useLocalStorage };

// Example usage:
/*
const [name, setName] = useLocalStorage<string>('name', 'John');
const [count, setCount] = useLocalStorage<number>('count', 0);
const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
*/
