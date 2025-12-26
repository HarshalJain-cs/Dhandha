import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface SalesReturnAttributes {
  return_id: number;
  return_number: string;
  original_invoice_id: number;
  customer_id: number;
  return_date: Date;
  return_type: 'return' | 'exchange';
  reason: string | null;
  refund_amount: number;
  exchange_invoice_id: number | null;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  approved_by: number | null;
  approved_at: Date | null;
  notes: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface SalesReturnCreationAttributes
  extends Optional<
    SalesReturnAttributes,
    | 'return_id'
    | 'reason'
    | 'exchange_invoice_id'
    | 'status'
    | 'approved_by'
    | 'approved_at'
    | 'notes'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
  > {}

class SalesReturn
  extends Model<SalesReturnAttributes, SalesReturnCreationAttributes>
  implements SalesReturnAttributes
{
  public return_id!: number;
  public return_number!: string;
  public original_invoice_id!: number;
  public customer_id!: number;
  public return_date!: Date;
  public return_type!: 'return' | 'exchange';
  public reason!: string | null;
  public refund_amount!: number;
  public exchange_invoice_id!: number | null;
  public status!: 'pending' | 'approved' | 'completed' | 'rejected';
  public approved_by!: number | null;
  public approved_at!: Date | null;
  public notes!: string | null;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SalesReturn.init(
  {
    return_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    return_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    original_invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    return_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    return_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refund_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    exchange_invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      allowNull: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    tableName: 'sales_returns',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SalesReturn;
