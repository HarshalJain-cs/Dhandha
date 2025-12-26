import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * OldGoldTransaction Attributes Interface
 */
export interface OldGoldTransactionAttributes {
  id: number;
  invoice_id: number;
  customer_id: number;
  transaction_date: Date;

  // Old Gold Details
  metal_type: string; // Gold, Silver, etc.
  gross_weight: number;
  stone_weight: number;
  net_weight: number;
  purity: number; // E.g., 22K, 18K, 24K (in carats or percentage)
  fine_weight: number; // Pure metal weight (net_weight × purity / 100)

  // Testing Details
  test_method: 'touchstone' | 'acid_test' | 'xrf_machine' | 'fire_assay' | 'hallmark';
  tested_purity: number; // Actual purity after testing
  tested_by: string | null; // Employee name who tested

  // Valuation
  current_rate: number; // Rate per gram of pure metal
  metal_value: number; // fine_weight × current_rate

  // Deductions
  melting_loss_percentage: number;
  melting_loss_weight: number;
  melting_loss_amount: number;

  // Final Amount
  final_weight: number; // After melting loss
  final_value: number; // Amount credited

  // Item Details
  item_description: string | null; // Description of old gold items
  item_photos: string[] | null; // Photos before melting

  // Status
  status: 'accepted' | 'tested' | 'valued' | 'settled' | 'rejected';
  rejection_reason: string | null;

  // Additional Info
  notes: string | null;

  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * OldGoldTransaction Creation Attributes
 */
export interface OldGoldTransactionCreationAttributes extends Optional<OldGoldTransactionAttributes,
  'id' | 'stone_weight' | 'tested_by' | 'melting_loss_percentage' | 'melting_loss_weight' |
  'melting_loss_amount' | 'item_description' | 'item_photos' | 'status' | 'rejection_reason' |
  'notes' | 'is_active' | 'created_by' | 'created_at' | 'updated_at'
> {}

/**
 * OldGoldTransaction Model Class
 */
export class OldGoldTransaction extends Model<OldGoldTransactionAttributes, OldGoldTransactionCreationAttributes> implements OldGoldTransactionAttributes {
  public id!: number;
  public invoice_id!: number;
  public customer_id!: number;
  public transaction_date!: Date;

  public metal_type!: string;
  public gross_weight!: number;
  public stone_weight!: number;
  public net_weight!: number;
  public purity!: number;
  public fine_weight!: number;

  public test_method!: 'touchstone' | 'acid_test' | 'xrf_machine' | 'fire_assay' | 'hallmark';
  public tested_purity!: number;
  public tested_by!: string | null;

  public current_rate!: number;
  public metal_value!: number;

  public melting_loss_percentage!: number;
  public melting_loss_weight!: number;
  public melting_loss_amount!: number;

  public final_weight!: number;
  public final_value!: number;

  public item_description!: string | null;
  public item_photos!: string[] | null;

  public status!: 'accepted' | 'tested' | 'valued' | 'settled' | 'rejected';
  public rejection_reason!: string | null;

  public notes!: string | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Calculate net weight (gross weight - stone weight)
   */
  public calculateNetWeight(): number {
    this.net_weight = this.gross_weight - this.stone_weight;
    return this.net_weight;
  }

  /**
   * Calculate fine weight (pure metal weight)
   * Formula: net_weight × purity / 100
   */
  public calculateFineWeight(): number {
    this.fine_weight = parseFloat(((this.net_weight * this.purity) / 100).toFixed(3));
    return this.fine_weight;
  }

  /**
   * Calculate metal value based on current rate
   * Formula: fine_weight × current_rate
   */
  public calculateMetalValue(): number {
    this.metal_value = parseFloat((this.fine_weight * this.current_rate).toFixed(2));
    return this.metal_value;
  }

  /**
   * Calculate melting loss
   * Standard melting loss is typically 0.5% - 1%
   */
  public calculateMeltingLoss(lossPercentage: number = 0.5): {
    weight: number;
    amount: number;
  } {
    this.melting_loss_percentage = lossPercentage;
    this.melting_loss_weight = parseFloat(((this.fine_weight * lossPercentage) / 100).toFixed(3));
    this.melting_loss_amount = parseFloat((this.melting_loss_weight * this.current_rate).toFixed(2));

    return {
      weight: this.melting_loss_weight,
      amount: this.melting_loss_amount,
    };
  }

  /**
   * Calculate final value after all deductions
   */
  public calculateFinalValue(): number {
    // Calculate melting loss if not already calculated
    if (this.melting_loss_percentage === 0) {
      this.calculateMeltingLoss();
    }

    this.final_weight = parseFloat((this.fine_weight - this.melting_loss_weight).toFixed(3));
    this.final_value = parseFloat((this.final_weight * this.current_rate).toFixed(2));

    return this.final_value;
  }

  /**
   * Complete valuation process
   */
  public completeValuation(
    testedPurity: number,
    currentRate: number,
    meltingLossPercentage: number = 0.5
  ): void {
    this.tested_purity = testedPurity;
    this.purity = testedPurity; // Use tested purity for calculations
    this.current_rate = currentRate;

    // Calculate all values
    this.calculateNetWeight();
    this.calculateFineWeight();
    this.calculateMetalValue();
    this.calculateMeltingLoss(meltingLossPercentage);
    this.calculateFinalValue();

    this.status = 'valued';
  }

  /**
   * Accept old gold
   */
  public accept(): void {
    this.status = 'accepted';
  }

  /**
   * Mark as tested
   */
  public markAsTested(testedPurity: number, testedBy: string): void {
    this.tested_purity = testedPurity;
    this.tested_by = testedBy;
    this.status = 'tested';
  }

  /**
   * Settle the transaction
   */
  public settle(): void {
    if (this.status === 'valued') {
      this.status = 'settled';
    }
  }

  /**
   * Reject old gold
   */
  public reject(reason: string): void {
    this.status = 'rejected';
    this.rejection_reason = reason;
  }

  /**
   * Get purity display string
   */
  public getPurityDisplay(): string {
    // Convert percentage to karat if metal is gold
    if (this.metal_type.toLowerCase() === 'gold') {
      const karat = (this.purity / 100) * 24;
      return `${karat.toFixed(1)}K (${this.purity}%)`;
    }
    return `${this.purity}%`;
  }

  /**
   * Get transaction summary
   */
  public getTransactionSummary(): string {
    return `${this.metal_type} - ${this.gross_weight}g (Net: ${this.net_weight}g, ${this.getPurityDisplay()}) = ₹${this.final_value.toFixed(2)}`;
  }
}

/**
 * Initialize OldGoldTransaction Model
 */
OldGoldTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    // Old Gold Details
    metal_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    gross_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    stone_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    net_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    purity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    // Testing Details
    test_method: {
      type: DataTypes.ENUM('touchstone', 'acid_test', 'xrf_machine', 'fire_assay', 'hallmark'),
      allowNull: false,
    },
    tested_purity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    tested_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Valuation
    current_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    metal_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Deductions
    melting_loss_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.5,
    },
    melting_loss_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    melting_loss_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Final Amount
    final_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    final_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Item Details
    item_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    item_photos: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    // Status
    status: {
      type: DataTypes.ENUM('accepted', 'tested', 'valued', 'settled', 'rejected'),
      defaultValue: 'accepted',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Additional Info
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Status
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
    tableName: 'old_gold_transactions',
    underscored: true,
    timestamps: true,
  }
);

export default OldGoldTransaction;
