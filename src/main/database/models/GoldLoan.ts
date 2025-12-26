import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import sequelize from '../index';

/**
 * GoldLoan Attributes Interface
 */
export interface GoldLoanAttributes {
  id: number;
  loan_number: string;
  loan_date: Date;
  customer_id: number;

  // Customer snapshot (at time of loan)
  customer_name: string;
  customer_mobile: string;
  customer_address: string | null;
  customer_aadhar: string | null;
  customer_pan: string | null;

  // Collateral details
  item_description: string;
  gross_weight: number;
  stone_weight: number;
  net_weight: number;
  purity_percentage: number;
  fine_weight: number;

  // Valuation
  current_gold_rate: number;
  appraised_value: number;
  ltv_ratio: number;

  // Loan terms
  loan_amount: number;
  interest_rate: number;
  interest_calculation_type: 'monthly' | 'quarterly' | 'maturity';
  tenure_months: number;
  disbursement_date: Date | null;
  maturity_date: Date;

  // Interest and payments
  total_interest: number;
  processing_fee: number;
  total_payable: number;
  amount_paid: number;
  balance_due: number;

  // Status tracking
  status: 'sanctioned' | 'disbursed' | 'active' | 'partial_repaid' | 'closed' | 'defaulted' | 'foreclosed';
  payment_status: 'pending' | 'partial' | 'paid';

  // Dates
  approved_date: Date | null;
  disbursed_date: Date | null;
  last_payment_date: Date | null;
  closed_date: Date | null;
  defaulted_date: Date | null;

  // Photos/documents
  item_photos: string[] | null;
  customer_photo: string | null;
  documents: string[] | null;

  // Agreement
  agreement_terms: string | null;
  special_conditions: string | null;
  notes: string | null;

  // Approval workflow
  requires_approval: boolean;
  approved_by: number | null;
  approved_at: Date | null;

  // Risk tracking
  is_overdue: boolean;
  days_overdue: number;
  risk_level: 'low' | 'medium' | 'high';

  // Audit fields
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * GoldLoan Creation Attributes
 */
export interface GoldLoanCreationAttributes
  extends Optional<
    GoldLoanAttributes,
    | 'id'
    | 'loan_number'
    | 'customer_address'
    | 'customer_aadhar'
    | 'customer_pan'
    | 'stone_weight'
    | 'fine_weight'
    | 'appraised_value'
    | 'disbursement_date'
    | 'total_interest'
    | 'processing_fee'
    | 'total_payable'
    | 'amount_paid'
    | 'balance_due'
    | 'status'
    | 'payment_status'
    | 'approved_date'
    | 'disbursed_date'
    | 'last_payment_date'
    | 'closed_date'
    | 'defaulted_date'
    | 'item_photos'
    | 'customer_photo'
    | 'documents'
    | 'agreement_terms'
    | 'special_conditions'
    | 'notes'
    | 'requires_approval'
    | 'approved_by'
    | 'approved_at'
    | 'is_overdue'
    | 'days_overdue'
    | 'risk_level'
    | 'is_active'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * GoldLoan Model
 */
export class GoldLoan
  extends Model<GoldLoanAttributes, GoldLoanCreationAttributes>
  implements GoldLoanAttributes
{
  public id!: number;
  public loan_number!: string;
  public loan_date!: Date;
  public customer_id!: number;

  public customer_name!: string;
  public customer_mobile!: string;
  public customer_address!: string | null;
  public customer_aadhar!: string | null;
  public customer_pan!: string | null;

  public item_description!: string;
  public gross_weight!: number;
  public stone_weight!: number;
  public net_weight!: number;
  public purity_percentage!: number;
  public fine_weight!: number;

  public current_gold_rate!: number;
  public appraised_value!: number;
  public ltv_ratio!: number;

  public loan_amount!: number;
  public interest_rate!: number;
  public interest_calculation_type!: 'monthly' | 'quarterly' | 'maturity';
  public tenure_months!: number;
  public disbursement_date!: Date | null;
  public maturity_date!: Date;

  public total_interest!: number;
  public processing_fee!: number;
  public total_payable!: number;
  public amount_paid!: number;
  public balance_due!: number;

  public status!: 'sanctioned' | 'disbursed' | 'active' | 'partial_repaid' | 'closed' | 'defaulted' | 'foreclosed';
  public payment_status!: 'pending' | 'partial' | 'paid';

  public approved_date!: Date | null;
  public disbursed_date!: Date | null;
  public last_payment_date!: Date | null;
  public closed_date!: Date | null;
  public defaulted_date!: Date | null;

  public item_photos!: string[] | null;
  public customer_photo!: string | null;
  public documents!: string[] | null;

  public agreement_terms!: string | null;
  public special_conditions!: string | null;
  public notes!: string | null;

  public requires_approval!: boolean;
  public approved_by!: number | null;
  public approved_at!: Date | null;

  public is_overdue!: boolean;
  public days_overdue!: number;
  public risk_level!: 'low' | 'medium' | 'high';

  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Generate unique loan number (LN-YYYYMMDD-###)
   */
  public static async generateLoanNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const pattern = `LN-${dateStr}-%`;

    const lastLoan = await GoldLoan.findOne({
      where: {
        loan_number: {
          [require('sequelize').Op.like]: pattern,
        },
      },
      order: [['loan_number', 'DESC']],
    });

    let sequence = 1;
    if (lastLoan && lastLoan.loan_number) {
      const lastSequence = parseInt(lastLoan.loan_number.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const seqStr = sequence.toString().padStart(3, '0');
    return `LN-${dateStr}-${seqStr}`;
  }

  /**
   * Calculate fine weight
   * Fine Weight = Net Weight × (Purity / 100)
   */
  public calculateFineWeight(): number {
    this.fine_weight = parseFloat(
      (this.net_weight * (this.purity_percentage / 100)).toFixed(3)
    );
    return this.fine_weight;
  }

  /**
   * Calculate appraised value
   * Appraised Value = Fine Weight × Current Gold Rate
   */
  public calculateAppraisedValue(): number {
    this.appraised_value = parseFloat(
      (this.fine_weight * this.current_gold_rate).toFixed(2)
    );
    return this.appraised_value;
  }

  /**
   * Calculate loan amount
   * Loan Amount = Appraised Value × (LTV Ratio / 100)
   */
  public calculateLoanAmount(): number {
    this.loan_amount = parseFloat(
      (this.appraised_value * (this.ltv_ratio / 100)).toFixed(2)
    );
    return this.loan_amount;
  }

  /**
   * Calculate interest based on calculation type
   */
  public calculateInterest(): number {
    let totalInterest = 0;

    if (this.interest_calculation_type === 'monthly') {
      const monthlyInterest = this.loan_amount * (this.interest_rate / 12 / 100);
      totalInterest = monthlyInterest * this.tenure_months;
    } else if (this.interest_calculation_type === 'quarterly') {
      const quarterlyInterest = this.loan_amount * (this.interest_rate / 4 / 100);
      const quarters = Math.ceil(this.tenure_months / 3);
      totalInterest = quarterlyInterest * quarters;
    } else if (this.interest_calculation_type === 'maturity') {
      totalInterest = this.loan_amount * (this.interest_rate * (this.tenure_months / 12) / 100);
    }

    this.total_interest = parseFloat(totalInterest.toFixed(2));
    return this.total_interest;
  }

  /**
   * Calculate total payable amount
   * Total Payable = Loan Amount + Total Interest + Processing Fee
   */
  public calculateTotalPayable(): number {
    this.total_payable = parseFloat(
      (this.loan_amount + this.total_interest + this.processing_fee).toFixed(2)
    );
    return this.total_payable;
  }

  /**
   * Update balance due
   * Balance Due = Total Payable - Amount Paid
   */
  public updateBalanceDue(): number {
    this.balance_due = parseFloat(
      (this.total_payable - this.amount_paid).toFixed(2)
    );
    return this.balance_due;
  }

  /**
   * Check if loan is overdue
   */
  public checkOverdueStatus(): void {
    const today = new Date();
    const maturityDate = new Date(this.maturity_date);

    if (today > maturityDate && this.status === 'active') {
      this.is_overdue = true;
      const diffTime = Math.abs(today.getTime() - maturityDate.getTime());
      this.days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Set risk level based on days overdue
      if (this.days_overdue <= 30) {
        this.risk_level = 'medium';
      } else if (this.days_overdue <= 90) {
        this.risk_level = 'high';
      } else {
        this.risk_level = 'high';
      }
    } else {
      this.is_overdue = false;
      this.days_overdue = 0;
      this.risk_level = 'low';
    }
  }

  /**
   * Check if loan can be disbursed
   */
  public canBeDisbursed(): boolean {
    if (this.requires_approval && !this.approved_by) {
      return false;
    }
    if (this.status !== 'sanctioned' && this.status !== 'approved') {
      return false;
    }
    if (this.disbursed_date) {
      return false;
    }
    return true;
  }

  /**
   * Check if loan can accept payment
   */
  public canAcceptPayment(): boolean {
    if (this.status === 'closed' || this.status === 'foreclosed') {
      return false;
    }
    if (!this.disbursed_date) {
      return false;
    }
    if (this.balance_due <= 0) {
      return false;
    }
    return true;
  }

  /**
   * Disburse loan
   */
  public async disburse(userId: number): Promise<void> {
    if (!this.canBeDisbursed()) {
      throw new Error('Loan cannot be disbursed');
    }

    this.status = 'disbursed';
    this.disbursed_date = new Date();
    this.updated_by = userId;
    await this.save();
  }

  /**
   * Close loan
   */
  public async close(userId: number): Promise<void> {
    if (this.balance_due > 0) {
      throw new Error('Loan cannot be closed with outstanding balance');
    }

    this.status = 'closed';
    this.payment_status = 'paid';
    this.closed_date = new Date();
    this.updated_by = userId;
    await this.save();
  }

  /**
   * Mark loan as default
   */
  public async markAsDefault(userId: number, reason?: string): Promise<void> {
    this.status = 'defaulted';
    this.defaulted_date = new Date();
    this.updated_by = userId;

    if (reason) {
      this.notes = this.notes ? `${this.notes}\n\nDefault Reason: ${reason}` : `Default Reason: ${reason}`;
    }

    await this.save();
  }

  /**
   * Update payment status based on amount paid
   */
  public updatePaymentStatus(): void {
    if (this.amount_paid === 0) {
      this.payment_status = 'pending';
    } else if (this.amount_paid >= this.total_payable) {
      this.payment_status = 'paid';
    } else {
      this.payment_status = 'partial';
    }
  }
}

/**
 * Initialize GoldLoan Model
 */
GoldLoan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    loan_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    loan_date: {
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
    customer_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    customer_mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    customer_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customer_aadhar: {
      type: DataTypes.STRING(12),
      allowNull: true,
    },
    customer_pan: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    item_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    gross_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    stone_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    },
    net_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    purity_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    fine_weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    },
    current_gold_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    appraised_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ltv_ratio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 75.0,
    },
    loan_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    interest_calculation_type: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'maturity'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    tenure_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    disbursement_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    maturity_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_interest: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    processing_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_payable: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    balance_due: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('sanctioned', 'disbursed', 'active', 'partial_repaid', 'closed', 'defaulted', 'foreclosed'),
      allowNull: false,
      defaultValue: 'sanctioned',
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid'),
      allowNull: false,
      defaultValue: 'pending',
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disbursed_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    defaulted_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    item_photos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    customer_photo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    agreement_terms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    special_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    requires_approval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    is_overdue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    days_overdue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    risk_level: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'low',
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
    tableName: 'gold_loans',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['loan_number'],
      },
      {
        fields: ['customer_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['maturity_date'],
      },
      {
        fields: ['loan_date'],
      },
      {
        fields: ['is_overdue'],
      },
    ],
  }
);

export default GoldLoan;
