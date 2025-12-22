import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * SyncStatus Attributes Interface
 * Tracks synchronization state for the branch
 */
export interface SyncStatusAttributes {
  id: number;
  branch_id: number;
  last_sync_at: Date | null;
  last_push_at: Date | null;
  last_pull_at: Date | null;
  sync_enabled: boolean;
  sync_interval_minutes: number;
  pending_changes_count: number;
  failed_changes_count: number;
  last_sync_error: string | null;
  is_syncing: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * SyncStatus Creation Attributes
 */
export interface SyncStatusCreationAttributes
  extends Optional<
    SyncStatusAttributes,
    | 'id'
    | 'last_sync_at'
    | 'last_push_at'
    | 'last_pull_at'
    | 'sync_enabled'
    | 'sync_interval_minutes'
    | 'pending_changes_count'
    | 'failed_changes_count'
    | 'last_sync_error'
    | 'is_syncing'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * SyncStatus Model Class
 * Manages synchronization status for branch
 */
export class SyncStatus
  extends Model<SyncStatusAttributes, SyncStatusCreationAttributes>
  implements SyncStatusAttributes
{
  public id!: number;
  public branch_id!: number;
  public last_sync_at!: Date | null;
  public last_push_at!: Date | null;
  public last_pull_at!: Date | null;
  public sync_enabled!: boolean;
  public sync_interval_minutes!: number;
  public pending_changes_count!: number;
  public failed_changes_count!: number;
  public last_sync_error!: string | null;
  public is_syncing!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Update sync timestamp
   */
  public async updateSyncTimestamp(type: 'push' | 'pull' | 'both'): Promise<void> {
    const now = new Date();
    if (type === 'push' || type === 'both') {
      this.last_push_at = now;
    }
    if (type === 'pull' || type === 'both') {
      this.last_pull_at = now;
    }
    this.last_sync_at = now;
    this.last_sync_error = null;
    await this.save();
  }

  /**
   * Set sync error
   */
  public async setSyncError(error: string): Promise<void> {
    this.last_sync_error = error;
    this.is_syncing = false;
    await this.save();
  }

  /**
   * Start sync operation
   */
  public async startSync(): Promise<void> {
    this.is_syncing = true;
    await this.save();
  }

  /**
   * End sync operation
   */
  public async endSync(): Promise<void> {
    this.is_syncing = false;
    await this.save();
  }

  /**
   * Update pending count
   */
  public async updatePendingCount(count: number): Promise<void> {
    this.pending_changes_count = count;
    await this.save();
  }

  /**
   * Update failed count
   */
  public async updateFailedCount(count: number): Promise<void> {
    this.failed_changes_count = count;
    await this.save();
  }

  /**
   * Check if sync is due
   */
  public isSyncDue(): boolean {
    if (!this.sync_enabled || this.is_syncing) {
      return false;
    }

    if (!this.last_sync_at) {
      return true; // Never synced
    }

    const minutesSinceLastSync =
      (Date.now() - this.last_sync_at.getTime()) / (1000 * 60);

    return minutesSinceLastSync >= this.sync_interval_minutes;
  }
}

/**
 * Initialize SyncStatus Model
 */
SyncStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'branches',
        key: 'id',
      },
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_push_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_pull_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sync_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sync_interval_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5, // Default: sync every 5 minutes
    },
    pending_changes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    failed_changes_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_sync_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_syncing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'sync_status',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['branch_id'],
        unique: true,
      },
    ],
  }
);

export default SyncStatus;
