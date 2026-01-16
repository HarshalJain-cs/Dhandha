import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import Karigar from './Karigar';

interface WorkOrderAttributes {
  id: number;
  workOrderNumber: string;
  karigarId: number;
  issueDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  metalType: string; // e.g., "Gold 22K", "Silver 925"
  grossWeight: number;
  netWeight: number;
  wastage: number;
  makingCharges: number;
  advancePayment: number;
  totalAmount: number;
  balanceAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkOrderCreationAttributes extends Optional<WorkOrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class WorkOrder extends Model<WorkOrderAttributes, WorkOrderCreationAttributes> implements WorkOrderAttributes {
  public id!: number;
  public workOrderNumber!: string;
  public karigarId!: number;
  public issueDate!: Date;
  public expectedDeliveryDate?: Date;
  public actualDeliveryDate?: Date;
  public status!: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  public priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  public description!: string;
  public metalType!: string;
  public grossWeight!: number;
  public netWeight!: number;
  public wastage!: number;
  public makingCharges!: number;
  public advancePayment!: number;
  public totalAmount!: number;
  public balanceAmount!: number;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    workOrderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    karigarId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'karigars',
        key: 'id',
      },
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expectedDeliveryDate: {
      type: DataTypes.DATE,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metalType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grossWeight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    netWeight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    wastage: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    makingCharges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    advancePayment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'work_orders',
    timestamps: true,
  }
);

// Associations
WorkOrder.belongsTo(Karigar, { foreignKey: 'karigarId', as: 'karigar' });
Karigar.hasMany(WorkOrder, { foreignKey: 'karigarId', as: 'workOrders' });

export default WorkOrder;
