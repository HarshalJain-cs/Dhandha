import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Payment Attributes Interface
 */
export interface PaymentAttributes {
  id: number;
  invoice_id: number;
  payment_date: Date;
  payment_mode: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'metal_account';
  amount: number;

  // Payment Details
  transaction_ref: string | null;
  card_last4: string | null; // Last 4 digits of card
  card_type: string | null; // Visa, Mastercard, etc.
  upi_id: string | null;
  cheque_number: string | null;
  cheque_date: Date | null;
  bank_name: string | null;
  bank_account: string | null;

  // Metal Account Payment
  metal_weight: number; // If payment is in metal (gold/silver)
  metal_rate: number; // Rate at time of payment
  metal_type: string | null; // Gold, Silver

  // Status
  payment_status: 'pending' | 'cleared' | 'failed' | 'cancelled';
  cleared_date: Date | null;

  // Additional Info
  notes: string | null;
  receipt_number: string | null;

  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Payment Creation Attributes
 */
export interface PaymentCreationAttributes extends Optional<PaymentAttributes,
  'id' | 'transaction_ref' | 'card_last4' | 'card_type' | 'upi_id' | 'cheque_number' |
  'cheque_date' | 'bank_name' | 'bank_account' | 'metal_weight' | 'metal_rate' | 'metal_type' |
  'payment_status' | 'cleared_date' | 'notes' | 'receipt_number' | 'is_active' | 'created_by' |
  'created_at' | 'updated_at'
> {}

/**
 * Payment Model Class
 */
export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public invoice_id!: number;
  public payment_date!: Date;
  public payment_mode!: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'metal_account';
  public amount!: number;

  public transaction_ref!: string | null;
  public card_last4!: string | null;
  public card_type!: string | null;
  public upi_id!: string | null;
  public cheque_number!: string | null;
  public cheque_date!: Date | null;
  public bank_name!: string | null;
  public bank_account!: string | null;

  public metal_weight!: number;
  public metal_rate!: number;
  public metal_type!: string | null;

  public payment_status!: 'pending' | 'cleared' | 'failed' | 'cancelled';
  public cleared_date!: Date | null;

  public notes!: string | null;
  public receipt_number!: string | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate receipt number
   * Format: RCP-YYYYMMDD-###
   */
  public static async generateReceiptNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const pattern = `RCP-${dateStr}-%`;
    const payments = await Payment.findAll({
      where: {
        receipt_number: {
          [Op.like]: pattern,
        },
      },
      order: [['receipt_number', 'DESC']],
      limit: 1,
    });

    let sequence = 1;
    if (payments.length > 0) {
      const lastCode = payments[0].receipt_number;
      if (lastCode) {
        const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
        sequence = lastSeq + 1;
      }
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `RCP-${dateStr}-${seqStr}`;
  }

  /**
   * Validate payment details based on payment mode
   */
  public validatePaymentDetails(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.amount <= 0) {
      errors.push('Payment amount must be greater than zero');
    }

    switch (this.payment_mode) {
      case 'card':
        if (!this.transaction_ref) {
          errors.push('Transaction reference is required for card payments');
        }
        break;

      case 'upi':
        if (!this.upi_id && !this.transaction_ref) {
          errors.push('UPI ID or transaction reference is required for UPI payments');
        }
        break;

      case 'cheque':
        if (!this.cheque_number) {
          errors.push('Cheque number is required for cheque payments');
        }
        if (!this.bank_name) {
          errors.push('Bank name is required for cheque payments');
        }
        break;

      case 'bank_transfer':
        if (!this.transaction_ref) {
          errors.push('Transaction reference is required for bank transfers');
        }
        break;

      case 'metal_account':
        if (!this.metal_weight || this.metal_weight <= 0) {
          errors.push('Metal weight must be specified for metal account payments');
        }
        if (!this.metal_rate || this.metal_rate <= 0) {
          errors.push('Metal rate must be specified for metal account payments');
        }
        if (!this.metal_type) {
          errors.push('Metal type must be specified for metal account payments');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Mark payment as cleared
   */
  public markAsCleared(): void {
    this.payment_status = 'cleared';
    this.cleared_date = new Date();
  }

  /**
   * Mark payment as failed
   */
  public markAsFailed(): void {
    this.payment_status = 'failed';
  }

  /**
   * Mark payment as cancelled
   */
  public markAsCancelled(): void {
    this.payment_status = 'cancelled';
  }

  /**
   * Check if payment can be cancelled
   */
  public canBeCancelled(): boolean {
    return this.payment_status !== 'cleared' && this.payment_status !== 'cancelled';
  }

  /**
   * Get payment summary for display
   */
  public getPaymentSummary(): string {
    switch (this.payment_mode) {
      case 'cash':
        return `Cash Payment - ₹${this.amount.toFixed(2)}`;

      case 'card':
        return `Card Payment - ₹${this.amount.toFixed(2)} ${this.card_type ? `(${this.card_type})` : ''} ${this.card_last4 ? `****${this.card_last4}` : ''}`;

      case 'upi':
        return `UPI Payment - ₹${this.amount.toFixed(2)} ${this.upi_id ? `(${this.upi_id})` : ''}`;

      case 'cheque':
        return `Cheque Payment - ₹${this.amount.toFixed(2)} ${this.cheque_number ? `(Cheque# ${this.cheque_number})` : ''} ${this.bank_name ? `- ${this.bank_name}` : ''}`;

      case 'bank_transfer':
        return `Bank Transfer - ₹${this.amount.toFixed(2)} ${this.transaction_ref ? `(Ref: ${this.transaction_ref})` : ''}`;

      case 'metal_account':
        return `Metal Account - ${this.metal_weight}g ${this.metal_type || 'Metal'} @ ₹${this.metal_rate}/g = ₹${this.amount.toFixed(2)}`;

      default:
        return `Payment - ₹${this.amount.toFixed(2)}`;
    }
  }
}

/**
 * Initialize Payment Model
 */
Payment.init(
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
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payment_mode: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'cheque', 'bank_transfer', 'metal_account'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    // Payment Details
    transaction_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    card_last4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    card_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    upi_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    cheque_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cheque_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bank_account: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Metal Account
    metal_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },
    metal_rate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    metal_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Status
    payment_status: {
      type: DataTypes.ENUM('pending', 'cleared', 'failed', 'cancelled'),
      defaultValue: 'cleared',
    },
    cleared_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Additional Info
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
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
    tableName: 'payments',
    underscored: true,
    timestamps: true,
  }
);

export default Payment;
