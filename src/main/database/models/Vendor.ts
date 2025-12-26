import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface VendorAttributes {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  vendor_type: 'metal_supplier' | 'diamond_supplier' | 'stone_supplier' | 'other';
  current_balance: number;
  credit_limit: number;
  payment_terms: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface VendorCreationAttributes
  extends Optional<
    VendorAttributes,
    | 'vendor_id'
    | 'contact_person'
    | 'email'
    | 'gstin'
    | 'address'
    | 'city'
    | 'state'
    | 'pincode'
    | 'vendor_type'
    | 'current_balance'
    | 'credit_limit'
    | 'payment_terms'
    | 'is_active'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

class Vendor extends Model<VendorAttributes, VendorCreationAttributes> implements VendorAttributes {
  public vendor_id!: number;
  public vendor_code!: string;
  public vendor_name!: string;
  public contact_person!: string | null;
  public phone!: string;
  public email!: string | null;
  public gstin!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public pincode!: string | null;
  public vendor_type!: 'metal_supplier' | 'diamond_supplier' | 'stone_supplier' | 'other';
  public current_balance!: number;
  public credit_limit!: number;
  public payment_terms!: string | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Vendor.init(
  {
    vendor_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    vendor_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    vendor_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    vendor_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'metal_supplier',
      allowNull: false,
    },
    current_balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    credit_limit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      allowNull: false,
    },
    payment_terms: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'vendors',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Vendor;
