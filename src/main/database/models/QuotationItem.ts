import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface QuotationItemAttributes {
  item_id: number;
  quotation_id: number;
  product_id: number | null;
  product_name: string;
  description: string | null;
  hsn_code: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  item_total: number;
}

interface QuotationItemCreationAttributes
  extends Optional<
    QuotationItemAttributes,
    'item_id' | 'product_id' | 'description' | 'hsn_code' | 'discount'
  > {}

class QuotationItem
  extends Model<QuotationItemAttributes, QuotationItemCreationAttributes>
  implements QuotationItemAttributes
{
  public item_id!: number;
  public quotation_id!: number;
  public product_id!: number | null;
  public product_name!: string;
  public description!: string | null;
  public hsn_code!: string | null;
  public quantity!: number;
  public unit_price!: number;
  public discount!: number;
  public tax_rate!: number;
  public item_total!: number;
}

QuotationItem.init(
  {
    item_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    hsn_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    item_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'quotation_items',
    timestamps: false,
    underscored: true,
  }
);

export default QuotationItem;
