import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Customer Attributes Interface
 */
export interface CustomerAttributes {
  id: number;
  customer_code: string;
  customer_type: 'retail' | 'wholesale' | 'vip';
  first_name: string;
  last_name: string | null;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  pan_number: string | null;
  aadhar_number: string | null;
  gstin: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  date_of_birth: Date | null;
  anniversary_date: Date | null;
  credit_limit: number;
  credit_days: number;
  outstanding_balance: number;
  loyalty_points: number;
  discount_percentage: number;
  metal_account_balance: number;
  notes: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Customer Creation Attributes
 */
export interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'last_name' | 'alternate_mobile' | 'email' | 'pan_number' | 'aadhar_number' | 'gstin' | 'address_line1' | 'address_line2' | 'city' | 'state' | 'pincode' | 'country' | 'date_of_birth' | 'anniversary_date' | 'credit_limit' | 'credit_days' | 'outstanding_balance' | 'loyalty_points' | 'discount_percentage' | 'metal_account_balance' | 'notes' | 'is_active' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'> {}

/**
 * Customer Model Class
 */
export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public customer_code!: string;
  public customer_type!: 'retail' | 'wholesale' | 'vip';
  public first_name!: string;
  public last_name!: string | null;
  public mobile!: string;
  public alternate_mobile!: string | null;
  public email!: string | null;
  public pan_number!: string | null;
  public aadhar_number!: string | null;
  public gstin!: string | null;
  public address_line1!: string | null;
  public address_line2!: string | null;
  public city!: string | null;
  public state!: string | null;
  public pincode!: string | null;
  public country!: string;
  public date_of_birth!: Date | null;
  public anniversary_date!: Date | null;
  public credit_limit!: number;
  public credit_days!: number;
  public outstanding_balance!: number;
  public loyalty_points!: number;
  public discount_percentage!: number;
  public metal_account_balance!: number;
  public notes!: string | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Get customer's full name
   */
  public getFullName(): string {
    return this.last_name ? `${this.first_name} ${this.last_name}` : this.first_name;
  }

  /**
   * Check if customer has credit available
   */
  public hasCreditAvailable(amount: number): boolean {
    return this.outstanding_balance + amount <= this.credit_limit;
  }

  /**
   * Add loyalty points
   */
  public addLoyaltyPoints(points: number): void {
    this.loyalty_points += points;
  }

  /**
   * Redeem loyalty points
   */
  public redeemLoyaltyPoints(points: number): boolean {
    if (this.loyalty_points >= points) {
      this.loyalty_points -= points;
      return true;
    }
    return false;
  }
}

/**
 * Initialize Customer Model
 */
Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_type: {
      type: DataTypes.ENUM('retail', 'wholesale', 'vip'),
      allowNull: false,
      defaultValue: 'retail',
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
      validate: {
        is: /^[0-9]{10,15}$/,
      },
    },
    alternate_mobile: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    pan_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i,
      },
    },
    aadhar_number: {
      type: DataTypes.STRING(12),
      allowNull: true,
      validate: {
        is: /^[0-9]{12}$/,
      },
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
      },
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address_line2: {
      type: DataTypes.STRING(255),
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
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'India',
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    anniversary_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    credit_limit: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    credit_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    outstanding_balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    metal_account_balance: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'customers',
    underscored: true,
    timestamps: true,
  }
);

export default Customer;
