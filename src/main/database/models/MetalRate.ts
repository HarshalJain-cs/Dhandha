import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface MetalRateAttributes {
  rate_id: number;
  rate_date: Date;
  gold_24k: number;
  gold_22k: number;
  gold_18k: number;
  silver: number;
  platinum: number;
  source: 'manual' | 'api';
  created_by: number | null;
  created_at: Date;
}

interface MetalRateCreationAttributes
  extends Optional<MetalRateAttributes, 'rate_id' | 'source' | 'created_by' | 'created_at'> {}

class MetalRate
  extends Model<MetalRateAttributes, MetalRateCreationAttributes>
  implements MetalRateAttributes
{
  public rate_id!: number;
  public rate_date!: Date;
  public gold_24k!: number;
  public gold_22k!: number;
  public gold_18k!: number;
  public silver!: number;
  public platinum!: number;
  public source!: 'manual' | 'api';
  public created_by!: number | null;
  public readonly created_at!: Date;
}

MetalRate.init(
  {
    rate_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rate_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    gold_24k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    gold_22k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    gold_18k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    silver: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    platinum: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(20),
      defaultValue: 'manual',
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: 'metal_rates',
    timestamps: false,
    underscored: true,
  }
);

export default MetalRate;
