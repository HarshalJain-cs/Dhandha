/**
 * Auto-Update Service
 * Handles background updates using electron-updater
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import log from 'electron-log';

/**
 * Update Settings
 */
interface UpdateSettings {
  autoDownload: boolean;
  autoInstallOnQuit: boolean;
  allowPrerelease: boolean;
  checkInterval: number; // Hours
}

/**
 * Update Service
 * Manages application auto-updates
 */
class UpdateService {
  private mainWindow: BrowserWindow | null = null;
  private settings: UpdateSettings = {
    autoDownload: true, // Auto-download by default
    autoInstallOnQuit: true, // Auto-install on quit by default
    allowPrerelease: false,
    checkInterval: 24, // Check every 24 hours
  };
  private checkIntervalHandle: NodeJS.Timeout | null = null;

  /**
   * Initialize update service
   */
  async init(window: BrowserWindow): Promise<void> {
    this.mainWindow = window;

    // Configure auto-updater
    autoUpdater.logger = log;
    autoUpdater.autoDownload = this.settings.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.settings.autoInstallOnQuit;
    autoUpdater.allowPrerelease = this.settings.allowPrerelease;

    // Set up event listeners
    this.setupEventListeners();

    // Check for updates on startup (after 10 second delay)
    setTimeout(() => {
      this.checkForUpdates(true);
    }, 10000);

    // Set up periodic checks
    this.startPeriodicChecks();

    log.info('Update service initialized');
  }

  /**
   * Set up auto-updater event listeners
   */
  private setupEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.sendToRenderer('update:checking');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendToRenderer('update:available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendToRenderer('update:not-available', info);
    });

    autoUpdater.on('download-progress', (progress) => {
      log.info('Download progress:', progress);
      this.sendToRenderer('update:download-progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendToRenderer('update:downloaded', info);
    });

    autoUpdater.on('error', (error) => {
      log.error('Update error:', error);
      this.sendToRenderer('update:error', error.message);
    });
  }

  /**
   * Send message to renderer process
   */
  private sendToRenderer(channel: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Check for updates
   * @param silent - If true, don't show notifications for "no update available"
   */
  async checkForUpdates(silent: boolean = false): Promise<void> {
    try {
      log.info('Checking for updates (silent:', silent, ')');
      const result = await autoUpdater.checkForUpdates();

      if (!result) {
        log.warn('checkForUpdates returned null');
        return;
      }

      if (silent && !result.updateInfo) {
        // Don't notify if silent and no update available
        return;
      }
    } catch (error) {
      log.error('Error checking for updates:', error);
      this.sendToRenderer('update:error', (error as Error).message);
    }
  }

  /**
   * Download update manually
   */
  async downloadUpdate(): Promise<void> {
    try {
      log.info('Downloading update...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Error downloading update:', error);
      this.sendToRenderer('update:error', (error as Error).message);
    }
  }

  /**
   * Install update and restart
   */
  quitAndInstall(): void {
    log.info('Installing update and restarting...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<UpdateSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Apply settings to auto-updater
    autoUpdater.autoDownload = this.settings.autoDownload;
    autoUpdater.autoInstallOnAppQuit = this.settings.autoInstallOnQuit;
    autoUpdater.allowPrerelease = this.settings.allowPrerelease;

    // Restart periodic checks with new interval
    if (newSettings.checkInterval !== undefined) {
      this.stopPeriodicChecks();
      this.startPeriodicChecks();
    }

    log.info('Update settings updated:', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): UpdateSettings {
    return { ...this.settings };
  }

  /**
   * Get current update status
   */
  getStatus(): any {
    return {
      checking: false, // Will be set by events
      updateAvailable: false,
      version: null,
      settings: this.settings,
    };
  }

  /**
   * Start periodic update checks
   */
  private startPeriodicChecks(): void {
    const intervalMs = this.settings.checkInterval * 60 * 60 * 1000; // Convert hours to ms

    this.checkIntervalHandle = setInterval(() => {
      this.checkForUpdates(true);
    }, intervalMs);

    log.info(`Periodic checks started (every ${this.settings.checkInterval} hours)`);
  }

  /**
   * Stop periodic update checks
   */
  private stopPeriodicChecks(): void {
    if (this.checkIntervalHandle) {
      clearInterval(this.checkIntervalHandle);
      this.checkIntervalHandle = null;
      log.info('Periodic checks stopped');
    }
  }

  /**
   * Cleanup on app quit
   */
  cleanup(): void {
    this.stopPeriodicChecks();
    log.info('Update service cleaned up');
  }
}

// Export singleton instance
export default new UpdateService();
