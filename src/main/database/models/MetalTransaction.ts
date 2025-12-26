import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Metal Transaction Attributes Interface
 * Tracks all metal movements (issue/receive) with karigars
 */
export interface MetalTransactionAttributes {
  id: number;
  transaction_number: string;
  transaction_date: Date;
  transaction_type: 'issue' | 'receive' | 'adjustment';

  // Karigar details
  karigar_id: number;
  karigar_name: string;

  // Order reference (if linked to an order)
  karigar_order_id: number | null;
  order_number: string | null;

  // Metal details
  metal_type: string; // Gold, Silver, Platinum
  metal_purity: number; // 22K, 24K, etc. (in percentage or karat)

  // Weight details
  gross_weight: number;
  stone_weight: number;
  net_weight: number;
  fine_weight: number; // Pure metal weight (net_weight × purity / 100)

  // Transaction amounts
  metal_rate: number; // Rate per gram at time of transaction
  metal_value: number; // fine_weight × metal_rate

  // For receive transactions - wastage
  expected_weight: number | null; // Expected weight to be received
  actual_weight: number | null; // Actual weight received
  wastage_weight: number;
  wastage_percentage: number;
  wastage_value: number;

  // Status
  status: 'pending' | 'completed' | 'cancelled';

  // Reference and notes
  reference_number: string | null; // External reference (if any)
  description: string | null;
  notes: string | null;

  // Approvals (for large transactions)
  requires_approval: boolean;
  approved_by: number | null;
  approved_at: Date | null;

  // Photos/documents
  photos: string[] | null;

  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Metal Transaction Creation Attributes
 */
export interface MetalTransactionCreationAttributes extends Optional<MetalTransactionAttributes,
  'id' | 'karigar_order_id' | 'order_number' | 'stone_weight' | 'expected_weight' |
  'actual_weight' | 'wastage_weight' | 'wastage_percentage' | 'wastage_value' |
  'reference_number' | 'description' | 'notes' | 'requires_approval' | 'approved_by' |
  'approved_at' | 'photos' | 'is_active' | 'created_by' | 'created_at' | 'updated_at'
> {}

/**
 * Metal Transaction Model Class
 */
export class MetalTransaction extends Model<MetalTransactionAttributes, MetalTransactionCreationAttributes> implements MetalTransactionAttributes {
  public id!: number;
  public transaction_number!: string;
  public transaction_date!: Date;
  public transaction_type!: 'issue' | 'receive' | 'adjustment';

  public karigar_id!: number;
  public karigar_name!: string;

  public karigar_order_id!: number | null;
  public order_number!: string | null;

  public metal_type!: string;
  public metal_purity!: number;

  public gross_weight!: number;
  public stone_weight!: number;
  public net_weight!: number;
  public fine_weight!: number;

  public metal_rate!: number;
  public metal_value!: number;

  public expected_weight!: number | null;
  public actual_weight!: number | null;
  public wastage_weight!: number;
  public wastage_percentage!: number;
  public wastage_value!: number;

  public status!: 'pending' | 'completed' | 'cancelled';

  public reference_number!: string | null;
  public description!: string | null;
  public notes!: string | null;

  public requires_approval!: boolean;
  public approved_by!: number | null;
  public approved_at!: Date | null;

  public photos!: string[] | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate unique transaction number
   * Format: MTX-YYYYMMDD-###
   */
  public static async generateTransactionNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const pattern = `MTX-${dateStr}-%`;
    const transactions = await MetalTransaction.findAll({
      where: {
        transaction_number: {
          [sequelize.Sequelize.Op.like]: pattern,
        },
      },
      order: [['transaction_number', 'DESC']],
      limit: 1,
    });

    let sequence = 1;
    if (transactions.length > 0) {
      const lastCode = transactions[0].transaction_number;
      const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `MTX-${dateStr}-${seqStr}`;
  }

  /**
   * Calculate fine weight (pure metal weight)
   */
  public calculateFineWeight(): number {
    this.fine_weight = parseFloat(((this.net_weight * this.metal_purity) / 100).toFixed(3));
    return this.fine_weight;
  }

  /**
   * Calculate metal value
   */
  public calculateMetalValue(): number {
    this.metal_value = parseFloat((this.fine_weight * this.metal_rate).toFixed(2));
    return this.metal_value;
  }

  /**
   * Calculate wastage (for receive transactions)
   */
  public calculateWastage(): {
    weight: number;
    percentage: number;
    value: number;
  } {
    if (this.transaction_type !== 'receive' || !this.expected_weight || !this.actual_weight) {
      return { weight: 0, percentage: 0, value: 0 };
    }

    this.wastage_weight = parseFloat((this.expected_weight - this.actual_weight).toFixed(3));
    this.wastage_percentage = parseFloat(((this.wastage_weight / this.expected_weight) * 100).toFixed(2));
    this.wastage_value = parseFloat((this.wastage_weight * this.metal_rate).toFixed(2));

    return {
      weight: this.wastage_weight,
      percentage: this.wastage_percentage,
      value: this.wastage_value,
    };
  }

  /**
   * Complete transaction
   */
  public complete(): void {
    this.status = 'completed';
  }

  /**
   * Cancel transaction
   */
  public cancel(): void {
    this.status = 'cancelled';
  }

  /**
   * Approve transaction
   */
  public approve(approvedBy: number): void {
    this.approved_by = approvedBy;
    this.approved_at = new Date();
    this.status = 'completed';
  }

  /**
   * Check if approval is needed
   * (e.g., for transactions above certain value)
   */
  public static needsApproval(metalValue: number, threshold: number = 100000): boolean {
    return metalValue >= threshold;
  }

  /**
   * Get transaction summary
   */
  public getTransactionSummary(): string {
    const type = this.transaction_type.toUpperCase();
    const metalInfo = `${this.net_weight}g ${this.metal_type} (${this.metal_purity}%)`;
    const value = `₹${this.metal_value.toFixed(2)}`;

    if (this.transaction_type === 'receive' && this.wastage_weight > 0) {
      return `${type}: ${metalInfo} = ${value} (Wastage: ${this.wastage_weight}g, ${this.wastage_percentage}%)`;
    }

    return `${type}: ${metalInfo} = ${value}`;
  }
}

/**
 * Initialize Metal Transaction Model
 */
MetalTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transaction_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    transaction_type: {
      type: DataTypes.ENUM('issue', 'receive', 'adjustment'),
      allowNull: false,
    },

    // Karigar details
    karigar_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'karigars',
        key: 'id',
      },
    },
    karigar_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    // Order reference
    karigar_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'karigar_orders',
        key: 'id',
      },
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Metal details
    metal_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    metal_purity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },

    // Weight details
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
    fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    // Value
    metal_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    metal_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Wastage (for receive)
    expected_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    actual_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    wastage_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    wastage_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    wastage_value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Status
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },

    // Reference
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Approval
    requires_approval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Photos
    photos: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    // Standard fields
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
    tableName: 'metal_transactions',
    underscored: true,
    timestamps: true,
  }
);

export default MetalTransaction;
