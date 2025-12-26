// @ts-nocheck
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * MetalType Attributes Interface
 */
export interface MetalTypeAttributes {
  id: number;
  metal_name: string;
  purity_name: string;
  purity_percentage: number;
  current_rate_per_gram: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * MetalType Creation Attributes
 */
export interface MetalTypeCreationAttributes
  extends Optional<
    MetalTypeAttributes,
    'id' | 'current_rate_per_gram' | 'is_active' | 'created_at' | 'updated_at'
  > {}

/**
 * MetalType Model Class
 * Manages metal types and purity levels (Gold 24K, 22K, Silver, etc.)
 */
export class MetalType
  extends Model<MetalTypeAttributes, MetalTypeCreationAttributes>
  implements MetalTypeAttributes
{
  public id!: number;
  public metal_name!: string;
  public purity_name!: string;
  public purity_percentage!: number;
  public current_rate_per_gram!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Get current metal rate from metal_rates table
   */
  public async getCurrentRate(): Promise<number> {
    try {
      const result = await sequelize.query(
        `SELECT rate_per_gram FROM metal_rates
         WHERE metal_type_id = :metalTypeId
         ORDER BY effective_date DESC
         LIMIT 1`,
        {
          replacements: { metalTypeId: this.id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (result && result.length > 0) {
        return (result[0] as any).rate_per_gram;
      }

      return this.current_rate_per_gram;
    } catch (error) {
      console.error('Error fetching current rate:', error);
      return this.current_rate_per_gram;
    }
  }

  /**
   * Calculate fine weight (pure metal weight)
   * @param grossWeight - Total weight including impurities
   * @returns Fine weight in grams
   */
  public calculateFineWeight(grossWeight: number): number {
    return (grossWeight * this.purity_percentage) / 100;
  }

  /**
   * Get display name (e.g., "Gold 22K (91.6%)")
   */
  public getDisplayName(): string {
    return `${this.metal_name} ${this.purity_name} (${this.purity_percentage}%)`;
  }
}

/**
 * Initialize MetalType Model
 */
MetalType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    metal_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    purity_name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    purity_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    current_rate_per_gram: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'metal_types',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['metal_name', 'purity_name'],
        unique: true,
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export default MetalType;
