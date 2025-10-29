/**
 * Storage utility for safe localStorage operations with type safety
 */

export const storage = {
  /**
   * Get item from localStorage with type safety and error handling
   */
  get: <T,>(key: string, fallback?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback ?? null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return fallback ?? null;
    }
  },

  /**
   * Set item in localStorage with error handling
   */
  set: <T,>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  },

  /**
   * Clear all localStorage
   */
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      return false;
    }
  },
};
