/**
 * Update IPC Handlers
 * Exposes update service methods to renderer process
 */

import { ipcMain } from 'electron';
import updateService from '../services/updateService';
import log from 'electron-log';

/**
 * Setup update IPC handlers
 */
export function setupUpdateHandlers(): void {
  /**
   * Check for updates
   * Args: silent (boolean) - If true, don't show notifications
   */
  ipcMain.handle('update:check', async (_event, silent: boolean = false) => {
    try {
      log.info('IPC: Checking for updates (silent:', silent, ')');
      await updateService.checkForUpdates(silent);
      return { success: true };
    } catch (error) {
      log.error('IPC: Error checking for updates:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  /**
   * Download update
   */
  ipcMain.handle('update:download', async () => {
    try {
      log.info('IPC: Downloading update');
      await updateService.downloadUpdate();
      return { success: true };
    } catch (error) {
      log.error('IPC: Error downloading update:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  /**
   * Install update and restart
   */
  ipcMain.handle('update:install', () => {
    try {
      log.info('IPC: Installing update and restarting');
      updateService.quitAndInstall();
      return { success: true };
    } catch (error) {
      log.error('IPC: Error installing update:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  /**
   * Get update status
   */
  ipcMain.handle('update:getStatus', () => {
    try {
      const status = updateService.getStatus();
      return { success: true, status };
    } catch (error) {
      log.error('IPC: Error getting update status:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  /**
   * Update settings
   * Args: settings (Partial<UpdateSettings>)
   */
  ipcMain.handle('update:updateSettings', (_event, settings: any) => {
    try {
      log.info('IPC: Updating settings:', settings);
      updateService.updateSettings(settings);
      return { success: true };
    } catch (error) {
      log.error('IPC: Error updating settings:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  /**
   * Get current settings
   */
  ipcMain.handle('update:getSettings', () => {
    try {
      const settings = updateService.getSettings();
      return { success: true, settings };
    } catch (error) {
      log.error('IPC: Error getting settings:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  });

  log.info('Update IPC handlers registered');
}
