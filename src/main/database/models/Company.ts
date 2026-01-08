import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Company Attributes Interface
 */
export interface CompanyAttributes {
  id: number;
  company_name: string;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  logo_path: string | null;
  registration_number: string | null;
  established_date: Date | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Company Creation Attributes
 */
export interface CompanyCreationAttributes
  extends Optional<
    CompanyAttributes,
    | 'id'
    | 'gstin'
    | 'pan'
    | 'address'
    | 'city'
    | 'state'
    | 'pincode'
    | 'phone'
    | 'email'
    | 'logo_path'
    | 'registration_number'
    | 'established_date'
    | 'is_active'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * Company Model Class
 * Manages company/business information
 */
export class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public company_name!: string;
  public gstin!: string | null;
  public pan!: string | null;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public pincode!: string | null;
  public phone!: string | null;
  public email!: string | null;
  public logo_path!: string | null;
  public registration_number!: string | null;
  public established_date!: Date | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Get full formatted address
   */
  public getFullAddress(): string {
    const parts: string[] = [];

    if (this.address) parts.push(this.address);
    if (this.city) parts.push(this.city);
    if (this.state) parts.push(this.state);
    if (this.pincode) parts.push(this.pincode);

    return parts.join(', ');
  }

  /**
   * Check if company is GST registered
   */
  public isGSTRegistered(): boolean {
    return !!this.gstin && this.gstin.length === 15;
  }

  /**
   * Get company age in years
   */
  public getCompanyAge(): number | null {
    if (!this.established_date) {
      return null;
    }

    const now = new Date();
    const diff = now.getTime() - this.established_date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }
}

/**
 * Initialize Company Model
 */
Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Company name is required',
        },
        len: {
          args: [2, 255],
          msg: 'Company name must be between 2 and 255 characters',
        },
      },
    },
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
      unique: true,
      validate: {
        is: {
          args: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
          msg: 'Invalid GSTIN format',
        },
      },
    },
    pan: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        is: {
          args: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
          msg: 'Invalid PAN format',
        },
      },
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
      validate: {
        isNumeric: {
          msg: 'Pincode must contain only numbers',
        },
        len: {
          args: [6, 6],
          msg: 'Pincode must be 6 digits',
        },
      },
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9]{10,15}$/,
          msg: 'Phone must be 10-15 digits',
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Invalid email format',
        },
      },
    },
    logo_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    established_date: {
      type: DataTypes.DATE,
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
    tableName: 'companies',
    underscored: true,
    timestamps: true,
  }
);

export default Company;
