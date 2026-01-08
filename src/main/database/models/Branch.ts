import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Branch Attributes Interface
 */
export interface BranchAttributes {
  id: number;
  company_id: number;
  branch_name: string;
  branch_code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  manager_id: number | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Branch Creation Attributes
 */
export interface BranchCreationAttributes
  extends Optional<
    BranchAttributes,
    | 'id'
    | 'address'
    | 'city'
    | 'state'
    | 'pincode'
    | 'phone'
    | 'email'
    | 'gstin'
    | 'manager_id'
    | 'is_active'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * Branch Model Class
 * Manages branch/location information
 */
export class Branch extends Model<BranchAttributes, BranchCreationAttributes> implements BranchAttributes {
  public id!: number;
  public company_id!: number;
  public branch_name!: string;
  public branch_code!: string;
  public address!: string | null;
  public city!: string | null;
  public state!: string | null;
  public pincode!: string | null;
  public phone!: string | null;
  public email!: string | null;
  public gstin!: string | null;
  public manager_id!: number | null;
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
   * Get all active users in this branch
   */
  public async getActiveUsers(): Promise<any[]> {
    const User = sequelize.models.User;
    if (!User) {
      return [];
    }

    return await User.findAll({
      where: {
        branch_id: this.id,
        is_active: true,
      },
    });
  }

  /**
   * Check if branch has GST registration
   */
  public hasGSTRegistration(): boolean {
    return !!this.gstin && this.gstin.length === 15;
  }

  /**
   * Get branch display name (code - name)
   */
  public getDisplayName(): string {
    return `${this.branch_code} - ${this.branch_name}`;
  }
}

/**
 * Initialize Branch Model
 */
Branch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'Company ID is required',
        },
      },
    },
    branch_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Branch name is required',
        },
        len: {
          args: [2, 255],
          msg: 'Branch name must be between 2 and 255 characters',
        },
      },
    },
    branch_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'Branch code is required',
        },
        len: {
          args: [2, 50],
          msg: 'Branch code must be between 2 and 50 characters',
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
    gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
          msg: 'Invalid GSTIN format',
        },
      },
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'branches',
    underscored: true,
    timestamps: true,
  }
);

export default Branch;
