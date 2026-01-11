import Store from 'electron-store';

/**
 * Configuration Service
 * Manages application settings using electron-store
 */

interface AppSettings {
  branch_id: number;
  company_id: number;
  auto_backup: boolean;
  backup_interval_hours: number;
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'gu';
}

export class ConfigService {
  private static store = new Store<AppSettings>({
    name: 'app-settings',
    defaults: {
      branch_id: 1, // Default to main branch
      company_id: 1, // Default to first company
      auto_backup: true,
      backup_interval_hours: 24,
      theme: 'light',
      language: 'en',
    },
  });

  /**
   * Get current branch ID
   */
  static getBranchId(): number {
    return this.store.get('branch_id', 1);
  }

  /**
   * Set branch ID
   */
  static setBranchId(branchId: number): void {
    this.store.set('branch_id', branchId);
  }

  /**
   * Get current company ID
   */
  static getCompanyId(): number {
    return this.store.get('company_id', 1);
  }

  /**
   * Set company ID
   */
  static setCompanyId(companyId: number): void {
    this.store.set('company_id', companyId);
  }

  /**
   * Get all settings
   */
  static getSettings(): AppSettings {
    return this.store.store;
  }

  /**
   * Update settings
   */
  static updateSettings(settings: Partial<AppSettings>): void {
    Object.entries(settings).forEach(([key, value]) => {
      this.store.set(key as keyof AppSettings, value);
    });
  }

  /**
   * Reset to defaults
   */
  static reset(): void {
    this.store.clear();
  }
}

export default ConfigService;
