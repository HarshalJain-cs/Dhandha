/**
 * Storage Utilities
 * Type-safe localStorage wrapper and draft saver for forms
 */

/**
 * Type-safe local storage wrapper
 */
class LocalStorage {
  /**
   * Get item from localStorage
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns Stored value or default
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * Set item in localStorage
   * @param key - Storage key
   * @param value - Value to store
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }

  /**
   * Remove item from localStorage
   * @param key - Storage key
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * Check if key exists
   * @param key - Storage key
   * @returns True if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys
   * @returns Array of all storage keys
   */
  keys(): string[] {
    return Object.keys(localStorage);
  }
}

/**
 * Singleton instance of LocalStorage
 */
export const storage = new LocalStorage();

/**
 * Draft saver for forms
 * Auto-saves form data and provides recovery
 */
export class DraftSaver<T> {
  private key: string;
  private autosaveInterval: number;
  private timer: NodeJS.Timeout | null = null;

  /**
   * Create a new draft saver
   * @param key - Unique key for this draft
   * @param autosaveInterval - Auto-save interval in milliseconds (default: 30000)
   */
  constructor(key: string, autosaveInterval: number = 30000) {
    this.key = `draft_${key}`;
    this.autosaveInterval = autosaveInterval;
  }

  /**
   * Save draft data
   * @param data - Data to save
   */
  save(data: T): void {
    storage.set(this.key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Load draft data
   * @returns Saved draft data or null
   */
  load(): T | null {
    const saved = storage.get<{ data: T; timestamp: number }>(this.key);

    if (!saved) return null;

    // Expire drafts older than 24 hours
    const ageHours = (Date.now() - saved.timestamp) / (1000 * 60 * 60);
    if (ageHours > 24) {
      this.clear();
      return null;
    }

    return saved.data;
  }

  /**
   * Clear draft data
   */
  clear(): void {
    storage.remove(this.key);
  }

  /**
   * Start auto-save
   * @param getData - Function to get current data
   */
  startAutosave(getData: () => T): void {
    this.stopAutosave();
    this.timer = setInterval(() => {
      this.save(getData());
    }, this.autosaveInterval);
  }

  /**
   * Stop auto-save
   */
  stopAutosave(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Check if draft exists
   * @returns True if draft exists and is not expired
   */
  hasDraft(): boolean {
    return this.load() !== null;
  }

  /**
   * Get draft age in hours
   * @returns Age in hours or null if no draft
   */
  getDraftAge(): number | null {
    const saved = storage.get<{ data: T; timestamp: number }>(this.key);
    if (!saved) return null;
    return (Date.now() - saved.timestamp) / (1000 * 60 * 60);
  }
}

/**
 * User preferences manager
 * For storing user-specific settings
 */
export class UserPreferences {
  private key: string = 'user_preferences';

  /**
   * Get a preference value
   * @param key - Preference key
   * @param defaultValue - Default value
   * @returns Preference value
   */
  get<T>(key: string, defaultValue?: T): T | null {
    const prefs = storage.get<Record<string, any>>(this.key, {});
    return prefs?.[key] ?? defaultValue ?? null;
  }

  /**
   * Set a preference value
   * @param key - Preference key
   * @param value - Preference value
   */
  set<T>(key: string, value: T): void {
    const prefs = storage.get<Record<string, any>>(this.key, {});
    prefs[key] = value;
    storage.set(this.key, prefs);
  }

  /**
   * Remove a preference
   * @param key - Preference key
   */
  remove(key: string): void {
    const prefs = storage.get<Record<string, any>>(this.key, {});
    delete prefs[key];
    storage.set(this.key, prefs);
  }

  /**
   * Clear all preferences
   */
  clear(): void {
    storage.remove(this.key);
  }

  /**
   * Get all preferences
   * @returns All preferences object
   */
  getAll(): Record<string, any> {
    return storage.get<Record<string, any>>(this.key, {}) || {};
  }
}

/**
 * Singleton instance of UserPreferences
 */
export const userPreferences = new UserPreferences();

/**
 * Recent items manager
 * For storing recently accessed items (customers, products, etc.)
 */
export class RecentItems<T extends { id: string | number }> {
  private key: string;
  private maxItems: number;

  /**
   * Create a recent items manager
   * @param key - Unique key for this item type
   * @param maxItems - Maximum number of items to store (default: 10)
   */
  constructor(key: string, maxItems: number = 10) {
    this.key = `recent_${key}`;
    this.maxItems = maxItems;
  }

  /**
   * Add an item to recent items
   * @param item - Item to add
   */
  add(item: T): void {
    const items = this.getAll();
    // Remove if already exists
    const filtered = items.filter((i) => i.id !== item.id);
    // Add to beginning
    const updated = [item, ...filtered].slice(0, this.maxItems);
    storage.set(this.key, updated);
  }

  /**
   * Get all recent items
   * @returns Array of recent items
   */
  getAll(): T[] {
    return storage.get<T[]>(this.key, []) || [];
  }

  /**
   * Clear all recent items
   */
  clear(): void {
    storage.remove(this.key);
  }

  /**
   * Remove a specific item
   * @param id - Item ID to remove
   */
  remove(id: string | number): void {
    const items = this.getAll();
    const filtered = items.filter((i) => i.id !== id);
    storage.set(this.key, filtered);
  }
}
