import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Karigar Order Attributes Interface
 */
export interface KarigarOrderAttributes {
  id: number;
  order_number: string;
  karigar_id: number;
  order_date: Date;
  expected_delivery_date: Date;
  actual_delivery_date: Date | null;

  // Order details
  order_type: 'new_making' | 'repair' | 'stone_setting' | 'polishing' | 'designing' | 'custom';
  description: string;
  design_reference: string | null;
  design_images: string[] | null;

  // Product/Item details (if applicable)
  product_id: number | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number;

  // Metal issued
  metal_type: string; // Gold, Silver, etc.
  metal_issued_weight: number;
  metal_issued_purity: number;
  metal_issued_fine_weight: number;

  // Metal received
  metal_received_weight: number;
  metal_received_purity: number;
  metal_received_fine_weight: number;

  // Wastage
  wastage_weight: number;
  wastage_percentage: number;
  wastage_amount: number;

  // Payment
  labour_charges: number;
  payment_type: 'per_piece' | 'per_gram' | 'fixed';
  payment_rate: number;
  total_payment: number;
  payment_status: 'pending' | 'partial' | 'paid';
  amount_paid: number;

  // Status tracking
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Progress tracking
  progress_percentage: number;
  remarks: string | null;
  cancellation_reason: string | null;

  // Quality check
  quality_check_done: boolean;
  quality_check_passed: boolean;
  quality_remarks: string | null;

  // Dates
  started_at: Date | null;
  completed_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;

  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Karigar Order Creation Attributes
 */
export interface KarigarOrderCreationAttributes extends Optional<KarigarOrderAttributes,
  'id' | 'actual_delivery_date' | 'design_reference' | 'design_images' | 'product_id' |
  'product_code' | 'product_name' | 'metal_received_weight' | 'metal_received_purity' |
  'metal_received_fine_weight' | 'wastage_weight' | 'wastage_percentage' | 'wastage_amount' |
  'payment_status' | 'amount_paid' | 'priority' | 'progress_percentage' | 'remarks' |
  'cancellation_reason' | 'quality_check_done' | 'quality_check_passed' | 'quality_remarks' |
  'started_at' | 'completed_at' | 'delivered_at' | 'cancelled_at' | 'is_active' |
  'created_by' | 'updated_by' | 'created_at' | 'updated_at'
> {}

/**
 * Karigar Order Model Class
 */
export class KarigarOrder extends Model<KarigarOrderAttributes, KarigarOrderCreationAttributes> implements KarigarOrderAttributes {
  public id!: number;
  public order_number!: string;
  public karigar_id!: number;
  public order_date!: Date;
  public expected_delivery_date!: Date;
  public actual_delivery_date!: Date | null;

  public order_type!: 'new_making' | 'repair' | 'stone_setting' | 'polishing' | 'designing' | 'custom';
  public description!: string;
  public design_reference!: string | null;
  public design_images!: string[] | null;

  public product_id!: number | null;
  public product_code!: string | null;
  public product_name!: string | null;
  public quantity!: number;

  public metal_type!: string;
  public metal_issued_weight!: number;
  public metal_issued_purity!: number;
  public metal_issued_fine_weight!: number;

  public metal_received_weight!: number;
  public metal_received_purity!: number;
  public metal_received_fine_weight!: number;

  public wastage_weight!: number;
  public wastage_percentage!: number;
  public wastage_amount!: number;

  public labour_charges!: number;
  public payment_type!: 'per_piece' | 'per_gram' | 'fixed';
  public payment_rate!: number;
  public total_payment!: number;
  public payment_status!: 'pending' | 'partial' | 'paid';
  public amount_paid!: number;

  public status!: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  public priority!: 'low' | 'medium' | 'high' | 'urgent';

  public progress_percentage!: number;
  public remarks!: string | null;
  public cancellation_reason!: string | null;

  public quality_check_done!: boolean;
  public quality_check_passed!: boolean;
  public quality_remarks!: string | null;

  public started_at!: Date | null;
  public completed_at!: Date | null;
  public delivered_at!: Date | null;
  public cancelled_at!: Date | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate unique order number
   * Format: KOR-YYYYMMDD-###
   */
  public static async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const pattern = `KOR-${dateStr}-%`;
    const orders = await KarigarOrder.findAll({
      where: {
        order_number: {
          [Op.like]: pattern,
        },
      },
      order: [['order_number', 'DESC']],
      limit: 1,
    });

    let sequence = 1;
    if (orders.length > 0) {
      const lastCode = orders[0].order_number;
      const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `KOR-${dateStr}-${seqStr}`;
  }

  /**
   * Calculate fine weight (pure metal)
   */
  public calculateFineWeight(weight: number, purity: number): number {
    return parseFloat(((weight * purity) / 100).toFixed(3));
  }

  /**
   * Calculate wastage
   */
  public calculateWastage(metalRate: number = 0): void {
    const issuedFine = this.metal_issued_fine_weight;
    const receivedFine = this.metal_received_fine_weight;

    this.wastage_weight = parseFloat((issuedFine - receivedFine).toFixed(3));
    this.wastage_percentage = parseFloat(((this.wastage_weight / issuedFine) * 100).toFixed(2));

    if (metalRate > 0) {
      this.wastage_amount = parseFloat((this.wastage_weight * metalRate).toFixed(2));
    }
  }

  /**
   * Calculate labour charges
   */
  public calculateLabourCharges(): number {
    switch (this.payment_type) {
      case 'per_piece':
        this.total_payment = this.payment_rate * this.quantity;
        break;
      case 'per_gram':
        this.total_payment = this.payment_rate * this.metal_received_weight;
        break;
      case 'fixed':
        this.total_payment = this.payment_rate;
        break;
      default:
        this.total_payment = 0;
    }

    this.total_payment = parseFloat(this.total_payment.toFixed(2));
    return this.total_payment;
  }

  /**
   * Start order
   */
  public start(): void {
    this.status = 'in_progress';
    this.started_at = new Date();
  }

  /**
   * Complete order
   */
  public complete(): void {
    this.status = 'completed';
    this.completed_at = new Date();
    this.progress_percentage = 100;
  }

  /**
   * Deliver order
   */
  public deliver(): void {
    this.status = 'delivered';
    this.delivered_at = new Date();
    this.actual_delivery_date = new Date();
  }

  /**
   * Cancel order
   */
  public cancel(reason: string): void {
    this.status = 'cancelled';
    this.cancellation_reason = reason;
    this.cancelled_at = new Date();
  }

  /**
   * Check if order is delayed
   */
  public isDelayed(): boolean {
    if (this.status === 'delivered' || this.status === 'cancelled') {
      return false;
    }

    const today = new Date();
    return today > this.expected_delivery_date;
  }

  /**
   * Get days remaining/overdue
   */
  public getDaysRemaining(): number {
    const today = new Date();
    const diff = this.expected_delivery_date.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Update payment status
   */
  public updatePaymentStatus(): void {
    if (this.amount_paid >= this.total_payment) {
      this.payment_status = 'paid';
    } else if (this.amount_paid > 0) {
      this.payment_status = 'partial';
    } else {
      this.payment_status = 'pending';
    }
  }
}

/**
 * Initialize Karigar Order Model
 */
KarigarOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    karigar_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'karigars',
        key: 'id',
      },
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expected_delivery_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actual_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Order details
    order_type: {
      type: DataTypes.ENUM('new_making', 'repair', 'stone_setting', 'polishing', 'designing', 'custom'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    design_reference: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    design_images: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    // Product details
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    // Metal issued
    metal_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    metal_issued_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    metal_issued_purity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    metal_issued_fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    // Metal received
    metal_received_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    metal_received_purity: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    metal_received_fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },

    // Wastage
    wastage_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    wastage_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    wastage_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Payment
    labour_charges: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_type: {
      type: DataTypes.ENUM('per_piece', 'per_gram', 'fixed'),
      allowNull: false,
    },
    payment_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_payment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid'),
      defaultValue: 'pending',
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Status
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },

    // Progress
    progress_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Quality check
    quality_check_done: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    quality_check_passed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    quality_remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Dates
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
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
    tableName: 'karigar_orders',
    underscored: true,
    timestamps: true,
  }
);

export default KarigarOrder;
