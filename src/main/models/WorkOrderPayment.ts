import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import WorkOrder from './WorkOrder';

interface WorkOrderPaymentAttributes {
  id: number;
  workOrderId: number;
  paymentDate: Date;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkOrderPaymentCreationAttributes extends Optional<WorkOrderPaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class WorkOrderPayment extends Model<WorkOrderPaymentAttributes, WorkOrderPaymentCreationAttributes> implements WorkOrderPaymentAttributes {
  public id!: number;
  public workOrderId!: number;
  public paymentDate!: Date;
  public amount!: number;
  public paymentMethod!: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
  public referenceNumber?: string;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkOrderPayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    workOrderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'work_orders',
        key: 'id',
      },
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI'),
      allowNull: false,
    },
    referenceNumber: {
      type: DataTypes.STRING,
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
    tableName: 'work_order_payments',
    timestamps: true,
  }
);

// Associations
WorkOrderPayment.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });
WorkOrder.hasMany(WorkOrderPayment, { foreignKey: 'workOrderId', as: 'payments' });

export default WorkOrderPayment;
