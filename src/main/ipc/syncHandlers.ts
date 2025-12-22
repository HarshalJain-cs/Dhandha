import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { SyncService } from '../services/syncService';
import { isSupabaseConfigured } from '../services/supabaseClient';

/**
 * Sync IPC Handlers
 * Handles IPC communication for synchronization operations
 */

/**
 * Setup all sync IPC handlers
 */
export const setupSyncHandlers = (): void => {
  /**
   * Get sync status
   */
  ipcMain.handle('sync:getStatus', async (_event: IpcMainInvokeEvent) => {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: true,
          configured: false,
          message: 'Sync not configured',
        };
      }

      const status = await SyncService.getSyncStatus();

      if (!status) {
        return {
          success: false,
          message: 'Sync status not found',
        };
      }

      return {
        success: true,
        configured: true,
        status: {
          lastSyncAt: status.last_sync_at,
          lastPushAt: status.last_push_at,
          lastPullAt: status.last_pull_at,
          syncEnabled: status.sync_enabled,
          syncIntervalMinutes: status.sync_interval_minutes,
          pendingChangesCount: status.pending_changes_count,
          failedChangesCount: status.failed_changes_count,
          lastSyncError: status.last_sync_error,
          isSyncing: status.is_syncing,
        },
      };
    } catch (error: any) {
      console.error('IPC sync:getStatus error:', error);
      return {
        success: false,
        message: `Failed to get sync status: ${error.message}`,
      };
    }
  });

  /**
   * Trigger manual sync
   */
  ipcMain.handle('sync:triggerSync', async (_event: IpcMainInvokeEvent) => {
    try {
      if (!isSupabaseConfigured()) {
        return {
          success: false,
          message: 'Supabase not configured',
        };
      }

      const result = await SyncService.triggerManualSync();
      return result;
    } catch (error: any) {
      console.error('IPC sync:triggerSync error:', error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        pushed: 0,
        pulled: 0,
      };
    }
  });

  /**
   * Enable/disable sync
   */
  ipcMain.handle('sync:toggleSync', async (
    _event: IpcMainInvokeEvent,
    enabled: boolean
  ) => {
    try {
      await SyncService.toggleSync(enabled);
      return {
        success: true,
        message: `Sync ${enabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error: any) {
      console.error('IPC sync:toggleSync error:', error);
      return {
        success: false,
        message: `Failed to toggle sync: ${error.message}`,
      };
    }
  });

  /**
   * Update sync interval
   */
  ipcMain.handle('sync:updateInterval', async (
    _event: IpcMainInvokeEvent,
    intervalMinutes: number
  ) => {
    try {
      const status = await SyncService.getSyncStatus();
      if (status) {
        status.sync_interval_minutes = intervalMinutes;
        await status.save();

        // Restart periodic sync with new interval
        if (status.sync_enabled) {
          SyncService.startPeriodicSync(intervalMinutes);
        }

        return {
          success: true,
          message: `Sync interval updated to ${intervalMinutes} minutes`,
        };
      }

      return {
        success: false,
        message: 'Sync status not found',
      };
    } catch (error: any) {
      console.error('IPC sync:updateInterval error:', error);
      return {
        success: false,
        message: `Failed to update interval: ${error.message}`,
      };
    }
  });

  /**
   * Cleanup old sync records
   */
  ipcMain.handle('sync:cleanup', async (
    _event: IpcMainInvokeEvent,
    daysToKeep: number = 7
  ) => {
    try {
      const deletedCount = await SyncService.cleanup(daysToKeep);
      return {
        success: true,
        message: `Cleaned up ${deletedCount} old records`,
        deletedCount,
      };
    } catch (error: any) {
      console.error('IPC sync:cleanup error:', error);
      return {
        success: false,
        message: `Cleanup failed: ${error.message}`,
        deletedCount: 0,
      };
    }
  });

  console.log('✓ Sync IPC handlers registered');
};

export default setupSyncHandlers;
