import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Stone Attributes Interface
 */
export interface StoneAttributes {
  id: number;
  stone_name: string;
  stone_type: string;
  hsn_code: string | null;
  base_rate_per_carat: number;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Stone Creation Attributes
 */
export interface StoneCreationAttributes
  extends Optional<
    StoneAttributes,
    | 'id'
    | 'hsn_code'
    | 'base_rate_per_carat'
    | 'is_active'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * Stone Model Class
 * Master data for stones/diamonds
 */
export class Stone
  extends Model<StoneAttributes, StoneCreationAttributes>
  implements StoneAttributes
{
  public id!: number;
  public stone_name!: string;
  public stone_type!: string;
  public hsn_code!: string | null;
  public base_rate_per_carat!: number;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Calculate stone value
   * @param caratWeight - Weight in carats
   * @returns Total value
   */
  public calculateValue(caratWeight: number): number {
    return caratWeight * this.base_rate_per_carat;
  }

  /**
   * Get display name with type
   */
  public getDisplayName(): string {
    return `${this.stone_name} (${this.stone_type})`;
  }
}

/**
 * Initialize Stone Model
 */
Stone.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stone_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    stone_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    hsn_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    base_rate_per_carat: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
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
    tableName: 'stones',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['stone_type'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default Stone;
