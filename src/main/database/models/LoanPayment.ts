import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { sequelize } from '../connection';

/**
 * LoanPayment Attributes Interface
 */
export interface LoanPaymentAttributes {
  id: number;
  payment_number: string;
  loan_id: number;
  payment_date: Date;
  payment_type: 'partial' | 'full' | 'interest_only' | 'principal_only';
  payment_mode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';

  // Payment amount breakdown
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  total_amount: number;

  // Payment method details (for non-cash)
  transaction_reference: string | null;
  bank_name: string | null;
  cheque_number: string | null;
  cheque_date: Date | null;
  card_last_4_digits: string | null;
  upi_transaction_id: string | null;

  // Status
  payment_status: 'pending' | 'verified' | 'cleared' | 'bounced';
  verified_by: number | null;
  verified_at: Date | null;

  // Balance tracking
  loan_balance_before: number;
  loan_balance_after: number;

  notes: string | null;
  receipt_url: string | null;

  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * LoanPayment Creation Attributes
 */
export interface LoanPaymentCreationAttributes
  extends Optional<
    LoanPaymentAttributes,
    | 'id'
    | 'payment_number'
    | 'payment_type'
    | 'penalty_amount'
    | 'transaction_reference'
    | 'bank_name'
    | 'cheque_number'
    | 'cheque_date'
    | 'card_last_4_digits'
    | 'upi_transaction_id'
    | 'payment_status'
    | 'verified_by'
    | 'verified_at'
    | 'notes'
    | 'receipt_url'
    | 'is_active'
    | 'created_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * LoanPayment Model
 */
export class LoanPayment
  extends Model<LoanPaymentAttributes, LoanPaymentCreationAttributes>
  implements LoanPaymentAttributes
{
  public id!: number;
  public payment_number!: string;
  public loan_id!: number;
  public payment_date!: Date;
  public payment_type!: 'partial' | 'full' | 'interest_only' | 'principal_only';
  public payment_mode!: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';

  public principal_amount!: number;
  public interest_amount!: number;
  public penalty_amount!: number;
  public total_amount!: number;

  public transaction_reference!: string | null;
  public bank_name!: string | null;
  public cheque_number!: string | null;
  public cheque_date!: Date | null;
  public card_last_4_digits!: string | null;
  public upi_transaction_id!: string | null;

  public payment_status!: 'pending' | 'verified' | 'cleared' | 'bounced';
  public verified_by!: number | null;
  public verified_at!: Date | null;

  public loan_balance_before!: number;
  public loan_balance_after!: number;

  public notes!: string | null;
  public receipt_url!: string | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate unique payment number (LP-YYYYMMDD-###)
   */
  public static async generatePaymentNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const pattern = `LP-${dateStr}-%`;

    const lastPayment = await LoanPayment.findOne({
      where: {
        payment_number: {
          [require('sequelize').Op.like]: pattern,
        },
      },
      order: [['payment_number', 'DESC']],
    });

    let sequence = 1;
    if (lastPayment && lastPayment.payment_number) {
      const lastSequence = parseInt(lastPayment.payment_number.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `LP-${dateStr}-${seqStr}`;
  }

  /**
   * Verify payment
   */
  public async verify(userId: number): Promise<void> {
    this.payment_status = 'verified';
    this.verified_by = userId;
    this.verified_at = new Date();
    await this.save();
  }

  /**
   * Mark payment as bounced (for cheques)
   */
  public async markAsBounced(reason: string): Promise<void> {
    if (this.payment_mode !== 'cheque') {
      throw new Error('Only cheque payments can be marked as bounced');
    }

    this.payment_status = 'bounced';
    this.notes = this.notes
      ? `${this.notes}\n\nBounced Reason: ${reason}`
      : `Bounced Reason: ${reason}`;

    await this.save();
  }

  /**
   * Validate payment details based on payment mode
   */
  public validatePaymentDetails(): boolean {
    switch (this.payment_mode) {
      case 'cash':
        // No additional validation needed for cash
        return true;

      case 'card':
        if (!this.card_last_4_digits || this.card_last_4_digits.length !== 4) {
          throw new Error('Card last 4 digits are required');
        }
        if (!this.transaction_reference) {
          throw new Error('Transaction reference is required for card payments');
        }
        return true;

      case 'upi':
        if (!this.upi_transaction_id) {
          throw new Error('UPI transaction ID is required');
        }
        return true;

      case 'bank_transfer':
        if (!this.transaction_reference) {
          throw new Error('Transaction reference is required for bank transfers');
        }
        if (!this.bank_name) {
          throw new Error('Bank name is required for bank transfers');
        }
        return true;

      case 'cheque':
        if (!this.cheque_number) {
          throw new Error('Cheque number is required');
        }
        if (!this.cheque_date) {
          throw new Error('Cheque date is required');
        }
        if (!this.bank_name) {
          throw new Error('Bank name is required for cheque payments');
        }
        return true;

      default:
        throw new Error('Invalid payment mode');
    }
  }
}

/**
 * Initialize LoanPayment Model
 */
LoanPayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    payment_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    loan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'gold_loans',
        key: 'id',
      },
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payment_type: {
      type: DataTypes.ENUM('partial', 'full', 'interest_only', 'principal_only'),
      allowNull: false,
      defaultValue: 'partial',
    },
    payment_mode: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'cheque'),
      allowNull: false,
      defaultValue: 'cash',
    },
    principal_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    interest_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    penalty_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    transaction_reference: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(200),
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
    card_last_4_digits: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    upi_transaction_id: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'verified', 'cleared', 'bounced'),
      allowNull: false,
      defaultValue: 'pending',
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loan_balance_before: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    loan_balance_after: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receipt_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
    tableName: 'loan_payments',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['payment_number'],
      },
      {
        fields: ['loan_id'],
      },
      {
        fields: ['payment_date'],
      },
      {
        fields: ['payment_status'],
      },
    ],
  }
);

export default LoanPayment;
