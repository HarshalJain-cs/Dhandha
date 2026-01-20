import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { SyncQueue } from '../database/models/SyncQueue';
import { SyncStatus } from '../database/models/SyncStatus';
import { sequelize } from '../database/connection';
import { Op } from 'sequelize';
import log from 'electron-log';
import ConfigService from './configService';

/**
 * Sync Service
 * Handles bidirectional synchronization between local PostgreSQL and Supabase cloud
 */

export class SyncService {
  private static syncInterval: NodeJS.Timeout | null = null;

  /**
   * Get current branch ID from config
   */
  private static getCurrentBranchId(): number {
    return ConfigService.getBranchId();
  }

  /**
   * Initialize sync service
   */
  static async initialize(branchId?: number): Promise<void> {
    // Use provided branchId or get from config
    const currentBranchId = branchId ?? this.getCurrentBranchId();

    // Update config if branchId was provided
    if (branchId !== undefined) {
      ConfigService.setBranchId(branchId);
    }

    if (!isSupabaseConfigured()) {
      log.info('ℹ  Supabase not configured. Sync service disabled.');
      log.info('   App will work in local-only mode.');
      return;
    }

    try {
      // Get or create sync status for this branch
      let syncStatus = await SyncStatus.findOne({
        where: { branch_id: currentBranchId },
      });

      if (!syncStatus) {
        syncStatus = await SyncStatus.create({
          branch_id: currentBranchId,
          sync_enabled: true,
          sync_interval_minutes: 5,
        });
        log.info('✓ Sync status initialized for branch', currentBranchId);
      }

      // Start periodic sync if enabled
      if (syncStatus.sync_enabled) {
        this.startPeriodicSync(syncStatus.sync_interval_minutes);
      }

      log.info('✓ Sync service initialized successfully');
    } catch (error: any) {
      log.error('✗ Failed to initialize sync service:', error.message);
    }
  }

  /**
   * Start periodic synchronization
   */
  static startPeriodicSync(intervalMinutes: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Run sync immediately
    this.performSync().catch((error) => {
      log.error('Sync error:', error);
    });

    // Then run periodically
    this.syncInterval = setInterval(() => {
      this.performSync().catch((error) => {
        log.error('Sync error:', error);
      });
    }, intervalMinutes * 60 * 1000);

    log.info(`✓ Periodic sync started (every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop periodic synchronization
   */
  static stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      log.info('✓ Periodic sync stopped');
    }
  }

  /**
   * Perform full synchronization (push + pull)
   */
  static async performSync(): Promise<{
    success: boolean;
    message: string;
    pushed: number;
    pulled: number;
  }> {
    const syncStatus = await SyncStatus.findOne({
      where: { branch_id: this.getCurrentBranchId() },
    });

    if (!syncStatus || !syncStatus.sync_enabled) {
      return {
        success: false,
        message: 'Sync is disabled',
        pushed: 0,
        pulled: 0,
      };
    }

    if (syncStatus.is_syncing) {
      return {
        success: false,
        message: 'Sync already in progress',
        pushed: 0,
        pulled: 0,
      };
    }

    try {
      await syncStatus.startSync();

      // Push local changes to cloud
      const pushedCount = await this.pushChanges();

      // Pull changes from cloud
      const pulledCount = await this.pullChanges();

      await syncStatus.updateSyncTimestamp('both');
      await syncStatus.endSync();

      return {
        success: true,
        message: 'Sync completed successfully',
        pushed: pushedCount,
        pulled: pulledCount,
      };
    } catch (error: any) {
      await syncStatus.setSyncError(error.message);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        pushed: 0,
        pulled: 0,
      };
    }
  }

  /**
   * Push local changes to Supabase cloud
   */
  static async pushChanges(): Promise<number> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get pending changes from queue
    const pendingChanges = await SyncQueue.findAll({
      where: {
        sync_status: 'pending',
        branch_id: this.getCurrentBranchId(),
      },
      order: [['created_at', 'ASC']],
      limit: 100, // Process in batches
    });

    let pushedCount = 0;

    for (const change of pendingChanges) {
      try {
        await change.update({ sync_status: 'syncing' });

        // Sync to Supabase based on operation type
        switch (change.operation) {
          case 'insert':
            await supabase.from(change.table_name).insert(change.data);
            break;

          case 'update':
            await supabase
              .from(change.table_name)
              .update(change.data)
              .eq('id', change.record_id);
            break;

          case 'delete':
            await supabase
              .from(change.table_name)
              .delete()
              .eq('id', change.record_id);
            break;
        }

        await change.markAsSynced();
        pushedCount++;
      } catch (error: any) {
        await change.markAsFailed(error.message);
        log.error(`Failed to sync change ${change.id}:`, error.message);
      }
    }

    // Update sync status
    const syncStatus = await SyncStatus.findOne({
      where: { branch_id: this.getCurrentBranchId() },
    });
    if (syncStatus) {
      await syncStatus.updateSyncTimestamp('push');
    }

    return pushedCount;
  }

  /**
   * Pull changes from Supabase cloud
   */
  static async pullChanges(): Promise<number> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const syncStatus = await SyncStatus.findOne({
      where: { branch_id: this.getCurrentBranchId() },
    });

    if (!syncStatus) {
      throw new Error('Sync status not found');
    }

    const lastPullAt = syncStatus.last_pull_at;
    let pulledCount = 0;

    // Define tables to sync (excluding local-only tables)
    const tablesToSync = [
      'users',
      'products',
      'customers',
      'categories',
      'metal_types',
      'stones',
      // Add more tables as needed
    ];

    for (const tableName of tablesToSync) {
      try {
        // Query changes since last pull
        let query = supabase.from(tableName).select('*');

        if (lastPullAt) {
          query = query.gt('updated_at', lastPullAt.toISOString());
        }

        // Filter out changes from current branch to avoid conflicts
        query = query.neq('branch_id', this.getCurrentBranchId());

        const { data, error } = await query;

        if (error) {
          log.error(`Error pulling ${tableName}:`, error.message);
          continue;
        }

        if (!data || data.length === 0) {
          continue;
        }

        // Upsert changes to local database
        for (const record of data) {
          await this.upsertLocalRecord(tableName, record);
          pulledCount++;
        }
      } catch (error: any) {
        log.error(`Failed to pull ${tableName}:`, error.message);
      }
    }

    // Update sync status
    if (syncStatus) {
      await syncStatus.updateSyncTimestamp('pull');
    }

    return pulledCount;
  }

  /**
   * Upsert record to local database
   */
  private static async upsertLocalRecord(
    tableName: string,
    record: any
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Use raw query for upsert (ON CONFLICT DO UPDATE)
      await sequelize.query(
        `
        INSERT INTO ${tableName} (${Object.keys(record).join(', ')})
        VALUES (${Object.keys(record)
          .map((_, i) => `$${i + 1}`)
          .join(', ')})
        ON CONFLICT (id)
        DO UPDATE SET
          ${Object.keys(record)
            .map((key, i) => `${key} = $${i + 1}`)
            .join(', ')}
      `,
        {
          bind: Object.values(record),
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Queue a change for synchronization
   */
  static async queueChange(
    tableName: string,
    operation: 'insert' | 'update' | 'delete',
    recordId: number,
    data: any
  ): Promise<void> {
    try {
      await SyncQueue.create({
        table_name: tableName,
        operation,
        record_id: recordId,
        data,
        branch_id: this.getCurrentBranchId(),
      });

      // Update pending count
      const syncStatus = await SyncStatus.findOne({
        where: { branch_id: this.getCurrentBranchId() },
      });

      if (syncStatus) {
        const pendingCount = await SyncQueue.count({
          where: {
            branch_id: this.getCurrentBranchId(),
            sync_status: 'pending',
          },
        });
        await syncStatus.updatePendingCount(pendingCount);
      }
    } catch (error: any) {
      log.error('Failed to queue change:', error.message);
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<SyncStatus | null> {
    return SyncStatus.findOne({
      where: { branch_id: this.getCurrentBranchId() },
    });
  }

  /**
   * Enable/disable sync
   */
  static async toggleSync(enabled: boolean): Promise<void> {
    const syncStatus = await SyncStatus.findOne({
      where: { branch_id: this.getCurrentBranchId() },
    });

    if (syncStatus) {
      syncStatus.sync_enabled = enabled;
      await syncStatus.save();

      if (enabled) {
        this.startPeriodicSync(syncStatus.sync_interval_minutes);
      } else {
        this.stopPeriodicSync();
      }
    }
  }

  /**
   * Manual sync trigger
   */
  static async triggerManualSync(): Promise<{
    success: boolean;
    message: string;
    pushed: number;
    pulled: number;
  }> {
    log.info('⚙  Manual sync triggered');
    return this.performSync();
  }

  /**
   * Cleanup old synced records
   */
  static async cleanup(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await SyncQueue.destroy({
      where: {
        sync_status: 'synced',
        synced_at: {
          [Op.lt]: cutoffDate,
        },
      },
    });

    log.info(`✓ Cleaned up ${result} old sync records`);
    return result;
  }
}

export default SyncService;
