import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * SyncQueue Attributes Interface
 * Tracks changes made while offline for later synchronization
 */
export interface SyncQueueAttributes {
  id: number;
  table_name: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: number;
  data: any;
  branch_id: number;
  created_at: Date;
  synced_at: Date | null;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  sync_error: string | null;
  retry_count: number;
}

/**
 * SyncQueue Creation Attributes
 */
export interface SyncQueueCreationAttributes
  extends Optional<
    SyncQueueAttributes,
    'id' | 'created_at' | 'synced_at' | 'sync_status' | 'sync_error' | 'retry_count'
  > {}

/**
 * SyncQueue Model Class
 * Manages offline change queue for synchronization
 */
export class SyncQueue
  extends Model<SyncQueueAttributes, SyncQueueCreationAttributes>
  implements SyncQueueAttributes
{
  public id!: number;
  public table_name!: string;
  public operation!: 'insert' | 'update' | 'delete';
  public record_id!: number;
  public data!: any;
  public branch_id!: number;
  public created_at!: Date;
  public synced_at!: Date | null;
  public sync_status!: 'pending' | 'syncing' | 'synced' | 'failed';
  public sync_error!: string | null;
  public retry_count!: number;

  /**
   * Mark as synced
   */
  public async markAsSynced(): Promise<void> {
    this.sync_status = 'synced';
    this.synced_at = new Date();
    await this.save();
  }

  /**
   * Mark as failed
   */
  public async markAsFailed(error: string): Promise<void> {
    this.sync_status = 'failed';
    this.sync_error = error;
    this.retry_count += 1;
    await this.save();
  }

  /**
   * Reset for retry
   */
  public async resetForRetry(): Promise<void> {
    this.sync_status = 'pending';
    this.sync_error = null;
    await this.save();
  }
}

/**
 * Initialize SyncQueue Model
 */
SyncQueue.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    table_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    operation: {
      type: DataTypes.ENUM('insert', 'update', 'delete'),
      allowNull: false,
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sync_status: {
      type: DataTypes.ENUM('pending', 'syncing', 'synced', 'failed'),
      defaultValue: 'pending',
    },
    sync_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'sync_queue',
    underscored: true,
    timestamps: false, // Using custom created_at field
    indexes: [
      {
        fields: ['sync_status'],
      },
      {
        fields: ['branch_id'],
      },
      {
        fields: ['table_name', 'record_id'],
      },
    ],
  }
);

export default SyncQueue;
