import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface NotificationAttributes {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  read_at: Date | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: Date;
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    'notification_id' | 'type' | 'priority' | 'is_read' | 'read_at' | 'entity_type' | 'entity_id' | 'created_at'
  > {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public notification_id!: number;
  public user_id!: number;
  public title!: string;
  public message!: string;
  public type!: 'info' | 'warning' | 'error' | 'success';
  public priority!: 'low' | 'medium' | 'high';
  public is_read!: boolean;
  public read_at!: Date | null;
  public entity_type!: string | null;
  public entity_id!: string | null;
  public readonly created_at!: Date;
}

Notification.init(
  {
    notification_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      defaultValue: 'info',
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'medium',
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: false,
    underscored: true,
  }
);

export default Notification;
