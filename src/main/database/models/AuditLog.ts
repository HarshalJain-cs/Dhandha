import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface AuditLogAttributes {
  log_id: number;
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity_type: string | null;
  entity_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: Date;
}

interface AuditLogCreationAttributes
  extends Optional<
    AuditLogAttributes,
    'log_id' | 'entity_type' | 'entity_id' | 'old_values' | 'new_values' | 'ip_address' | 'user_agent'
  > {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public log_id!: number;
  public user_id!: number;
  public action!: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  public entity_type!: string | null;
  public entity_id!: string | null;
  public old_values!: any | null;
  public new_values!: any | null;
  public ip_address!: string | null;
  public user_agent!: string | null;
  public readonly timestamp!: Date;
}

AuditLog.init(
  {
    log_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
  }
);

export default AuditLog;
