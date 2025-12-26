import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface PurchaseOrderAttributes {
  purchase_order_id: number;
  po_number: string;
  vendor_id: number;
  po_date: Date;
  expected_delivery_date: Date | null;
  metal_type_id: number | null;
  quantity: number;
  rate_per_gram: number;
  total_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  grand_total: number;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  received_quantity: number;
  notes: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface PurchaseOrderCreationAttributes
  extends Optional<
    PurchaseOrderAttributes,
    | 'purchase_order_id'
    | 'expected_delivery_date'
    | 'metal_type_id'
    | 'cgst_amount'
    | 'sgst_amount'
    | 'igst_amount'
    | 'status'
    | 'received_quantity'
    | 'notes'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

class PurchaseOrder
  extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes>
  implements PurchaseOrderAttributes
{
  public purchase_order_id!: number;
  public po_number!: string;
  public vendor_id!: number;
  public po_date!: Date;
  public expected_delivery_date!: Date | null;
  public metal_type_id!: number | null;
  public quantity!: number;
  public rate_per_gram!: number;
  public total_amount!: number;
  public cgst_amount!: number;
  public sgst_amount!: number;
  public igst_amount!: number;
  public grand_total!: number;
  public status!: 'pending' | 'partial' | 'received' | 'cancelled';
  public received_quantity!: number;
  public notes!: string | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PurchaseOrder.init(
  {
    purchase_order_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    po_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expected_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metal_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    rate_per_gram: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    grand_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      allowNull: false,
    },
    received_quantity: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
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
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default PurchaseOrder;
