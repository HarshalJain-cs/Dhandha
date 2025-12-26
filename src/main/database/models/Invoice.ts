import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../connection';

/**
 * Invoice Attributes Interface
 */
export interface InvoiceAttributes {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  customer_id: number;
  invoice_type: 'sale' | 'estimate' | 'return';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';

  // Customer Details (snapshot at time of invoice)
  customer_name: string;
  customer_mobile: string;
  customer_email: string | null;
  customer_address: string | null;
  customer_gstin: string | null;
  customer_pan: string | null;
  customer_state: string;

  // Amounts
  subtotal: number;
  metal_amount: number;
  stone_amount: number;
  making_charges: number;
  wastage_amount: number;

  // GST Details
  gst_type: 'intra' | 'inter'; // intra-state (CGST+SGST) or inter-state (IGST)
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number;

  // Making Charges GST (5%)
  making_cgst: number;
  making_sgst: number;
  making_igst: number;
  total_making_gst: number;

  // Metal GST (3%)
  metal_cgst: number;
  metal_sgst: number;
  metal_igst: number;
  total_metal_gst: number;

  // Other Charges
  discount_percentage: number;
  discount_amount: number;
  round_off: number;

  // Old Gold Details
  old_gold_amount: number;
  old_gold_weight: number;

  // Totals
  taxable_amount: number;
  grand_total: number;
  balance_due: number;
  amount_paid: number;

  // Additional Info
  payment_mode: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'mixed' | null;
  transaction_ref: string | null;
  notes: string | null;
  terms_conditions: string | null;

  // E-Invoice Details
  irn: string | null; // Invoice Reference Number
  ack_no: string | null; // Acknowledgement Number
  ack_date: Date | null;
  qr_code: string | null;
  einvoice_status: 'not_generated' | 'generated' | 'cancelled';

  // Status
  is_cancelled: boolean;
  cancelled_at: Date | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;

  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Invoice Creation Attributes
 */
export interface InvoiceCreationAttributes extends Optional<InvoiceAttributes,
  'id' | 'customer_email' | 'customer_address' | 'customer_gstin' | 'customer_pan' |
  'stone_amount' | 'wastage_amount' | 'cgst_amount' | 'sgst_amount' | 'igst_amount' |
  'total_gst' | 'making_cgst' | 'making_sgst' | 'making_igst' | 'total_making_gst' |
  'metal_cgst' | 'metal_sgst' | 'metal_igst' | 'total_metal_gst' | 'discount_percentage' |
  'discount_amount' | 'round_off' | 'old_gold_amount' | 'old_gold_weight' | 'balance_due' |
  'amount_paid' | 'payment_mode' | 'transaction_ref' | 'notes' | 'terms_conditions' |
  'irn' | 'ack_no' | 'ack_date' | 'qr_code' | 'einvoice_status' | 'is_cancelled' |
  'cancelled_at' | 'cancelled_by' | 'cancellation_reason' | 'is_active' | 'created_by' |
  'updated_by' | 'created_at' | 'updated_at'
> {}

/**
 * Invoice Model Class
 */
export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public invoice_number!: string;
  public invoice_date!: Date;
  public customer_id!: number;
  public invoice_type!: 'sale' | 'estimate' | 'return';
  public payment_status!: 'pending' | 'partial' | 'paid' | 'overdue';

  public customer_name!: string;
  public customer_mobile!: string;
  public customer_email!: string | null;
  public customer_address!: string | null;
  public customer_gstin!: string | null;
  public customer_pan!: string | null;
  public customer_state!: string;

  public subtotal!: number;
  public metal_amount!: number;
  public stone_amount!: number;
  public making_charges!: number;
  public wastage_amount!: number;

  public gst_type!: 'intra' | 'inter';
  public cgst_amount!: number;
  public sgst_amount!: number;
  public igst_amount!: number;
  public total_gst!: number;

  public making_cgst!: number;
  public making_sgst!: number;
  public making_igst!: number;
  public total_making_gst!: number;

  public metal_cgst!: number;
  public metal_sgst!: number;
  public metal_igst!: number;
  public total_metal_gst!: number;

  public discount_percentage!: number;
  public discount_amount!: number;
  public round_off!: number;

  public old_gold_amount!: number;
  public old_gold_weight!: number;

  public taxable_amount!: number;
  public grand_total!: number;
  public balance_due!: number;
  public amount_paid!: number;

  public payment_mode!: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'mixed' | null;
  public transaction_ref!: string | null;
  public notes!: string | null;
  public terms_conditions!: string | null;

  public irn!: string | null;
  public ack_no!: string | null;
  public ack_date!: Date | null;
  public qr_code!: string | null;
  public einvoice_status!: 'not_generated' | 'generated' | 'cancelled';

  public is_cancelled!: boolean;
  public cancelled_at!: Date | null;
  public cancelled_by!: number | null;
  public cancellation_reason!: string | null;

  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate unique invoice number
   * Format: INV-YYYYMMDD-###
   * Example: INV-20250124-001
   */
  public static async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Find highest sequence number for today
    const pattern = `INV-${dateStr}-%`;
    const invoices = await Invoice.findAll({
      where: {
        invoice_number: {
          [Op.like]: pattern,
        },
      },
      order: [['invoice_number', 'DESC']],
      limit: 1,
    });

    let sequence = 1;
    if (invoices.length > 0) {
      const lastCode = invoices[0].invoice_number;
      const lastSeq = parseInt(lastCode.split('-').pop() || '0', 10);
      sequence = lastSeq + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `INV-${dateStr}-${seqStr}`;
  }

  /**
   * Calculate total balance due
   */
  public calculateBalanceDue(): number {
    return this.grand_total - this.amount_paid;
  }

  /**
   * Update payment status based on amount paid
   */
  public updatePaymentStatus(): void {
    const balance = this.calculateBalanceDue();

    if (balance <= 0) {
      this.payment_status = 'paid';
    } else if (this.amount_paid > 0) {
      this.payment_status = 'partial';
    } else {
      // Check if overdue (more than 30 days)
      const daysDiff = Math.floor((new Date().getTime() - this.invoice_date.getTime()) / (1000 * 60 * 60 * 24));
      this.payment_status = daysDiff > 30 ? 'overdue' : 'pending';
    }

    this.balance_due = balance;
  }

  /**
   * Check if invoice can be cancelled
   */
  public canBeCancelled(): { allowed: boolean; reason?: string } {
    if (this.is_cancelled) {
      return { allowed: false, reason: 'Invoice is already cancelled' };
    }

    if (this.einvoice_status === 'generated') {
      return { allowed: false, reason: 'E-Invoice has been generated. Please cancel through GST portal first.' };
    }

    // Allow cancellation within 24 hours
    const hoursDiff = Math.floor((new Date().getTime() - this.invoice_date.getTime()) / (1000 * 60 * 60));
    if (hoursDiff > 24) {
      return { allowed: false, reason: 'Invoice can only be cancelled within 24 hours of creation' };
    }

    return { allowed: true };
  }

  /**
   * Mark invoice as cancelled
   */
  public cancelInvoice(userId: number, reason: string): boolean {
    const check = this.canBeCancelled();
    if (!check.allowed) {
      return false;
    }

    this.is_cancelled = true;
    this.cancelled_at = new Date();
    this.cancelled_by = userId;
    this.cancellation_reason = reason;
    this.payment_status = 'pending';

    return true;
  }
}

/**
 * Initialize Invoice Model
 */
Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    invoice_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    invoice_type: {
      type: DataTypes.ENUM('sale', 'estimate', 'return'),
      allowNull: false,
      defaultValue: 'sale',
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue'),
      allowNull: false,
      defaultValue: 'pending',
    },

    // Customer Details
    customer_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    customer_mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customer_gstin: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    customer_pan: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    customer_state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Amounts
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    metal_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    stone_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    making_charges: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    wastage_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // GST Details
    gst_type: {
      type: DataTypes.ENUM('intra', 'inter'),
      allowNull: false,
      defaultValue: 'intra',
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total_gst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Making Charges GST
    making_cgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    making_sgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    making_igst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total_making_gst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Metal GST
    metal_cgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    metal_sgst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    metal_igst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total_metal_gst: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Other Charges
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    round_off: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Old Gold
    old_gold_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    old_gold_weight: {
      type: DataTypes.DECIMAL(10, 3),
      defaultValue: 0,
    },

    // Totals
    taxable_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    grand_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    balance_due: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },

    // Payment Info
    payment_mode: {
      type: DataTypes.ENUM('cash', 'card', 'upi', 'cheque', 'bank_transfer', 'mixed'),
      allowNull: true,
    },
    transaction_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    terms_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // E-Invoice
    irn: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    ack_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ack_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    einvoice_status: {
      type: DataTypes.ENUM('not_generated', 'generated', 'cancelled'),
      defaultValue: 'not_generated',
    },

    // Cancellation
    is_cancelled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    cancellation_reason: {
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
    tableName: 'invoices',
    underscored: true,
    timestamps: true,
  }
);

export default Invoice;
