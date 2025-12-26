import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuotationAttributes {
  quotation_id: number;
  quotation_number: string;
  customer_id: number;
  quotation_date: Date;
  valid_until: Date;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total_tax: number;
  grand_total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'converted';
  converted_invoice_id: number | null;
  notes: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface QuotationCreationAttributes
  extends Optional<
    QuotationAttributes,
    | 'quotation_id'
    | 'discount_percentage'
    | 'discount_amount'
    | 'status'
    | 'converted_invoice_id'
    | 'notes'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

class Quotation
  extends Model<QuotationAttributes, QuotationCreationAttributes>
  implements QuotationAttributes
{
  public quotation_id!: number;
  public quotation_number!: string;
  public customer_id!: number;
  public quotation_date!: Date;
  public valid_until!: Date;
  public subtotal!: number;
  public discount_percentage!: number;
  public discount_amount!: number;
  public total_tax!: number;
  public grand_total!: number;
  public status!: 'pending' | 'accepted' | 'rejected' | 'converted';
  public converted_invoice_id!: number | null;
  public notes!: string | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Quotation.init(
  {
    quotation_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotation_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quotation_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    total_tax: {
      type: DataTypes.DECIMAL(15, 2),
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
    converted_invoice_id: {
      type: DataTypes.INTEGER,
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
    tableName: 'quotations',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Quotation;
