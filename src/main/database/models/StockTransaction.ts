import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Stock Transaction Attributes Interface
 */
export interface StockTransactionAttributes {
  id: number;
  product_id: number;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'production';
  quantity: number;
  running_balance: number;
  unit_cost: number | null;
  total_value: number | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  metadata: any | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Stock Transaction Creation Attributes
 */
export interface StockTransactionCreationAttributes extends Optional<StockTransactionAttributes, 'id' | 'unit_cost' | 'total_value' | 'reference_type' | 'reference_id' | 'notes' | 'metadata' | 'created_by' | 'created_at' | 'updated_at'> {}

/**
 * Stock Transaction Model Class
 */
export class StockTransaction extends Model<StockTransactionAttributes, StockTransactionCreationAttributes> implements StockTransactionAttributes {
  public id!: number;
  public product_id!: number;
  public transaction_type!: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'production';
  public quantity!: number;
  public running_balance!: number;
  public unit_cost!: number | null;
  public total_value!: number | null;
  public reference_type!: string | null;
  public reference_id!: number | null;
  public notes!: string | null;
  public metadata!: any | null;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Get transaction direction (in/out)
   */
  public getDirection(): 'in' | 'out' | 'neutral' {
    if (this.quantity > 0) {
      return 'in';
    } else if (this.quantity < 0) {
      return 'out';
    }
    return 'neutral';
  }

  /**
   * Get formatted transaction type label
   */
  public getTypeLabel(): string {
    const labels: Record<string, string> = {
      purchase: 'Purchase Order',
      sale: 'Sale',
      adjustment: 'Stock Adjustment',
      return: 'Return',
      transfer: 'Transfer',
      production: 'Production',
    };
    return labels[this.transaction_type] || this.transaction_type;
  }

  /**
   * Calculate value if not provided
   */
  public calculateValue(): number {
    if (this.total_value !== null) {
      return this.total_value;
    }
    if (this.unit_cost !== null) {
      return Math.abs(this.quantity) * this.unit_cost;
    }
    return 0;
  }
}

/**
 * Initialize StockTransaction Model
 */
StockTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    transaction_type: {
      type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer', 'production'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Quantity change (can be negative for sales/reductions)',
    },
    running_balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stock level after this transaction',
    },
    unit_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Unit cost at time of transaction',
    },
    total_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Total transaction value',
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of reference document (invoice, purchase_order, etc.)',
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of reference document',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional transaction metadata',
    },
    created_by: {
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
    tableName: 'stock_transactions',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['product_id', 'created_at'],
        name: 'stock_transactions_product_date_idx',
      },
      {
        fields: ['transaction_type'],
        name: 'stock_transactions_type_idx',
      },
      {
        fields: ['reference_type', 'reference_id'],
        name: 'stock_transactions_reference_idx',
      },
      {
        fields: ['created_at'],
        name: 'stock_transactions_created_at_idx',
      },
    ],
  }
);

export default StockTransaction;
