// @ts-nocheck
import { GoldLoan } from '../database/models/GoldLoan';
import { LoanPayment } from '../database/models/LoanPayment';
import { Customer } from '../database/models/Customer';
import { Op } from 'sequelize';
import { sequelize } from '../database/connection';

/**
 * Gold Loan Service Response Interface
 */
export interface GoldLoanServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Gold Loan Filters Interface
 */
export interface GoldLoanFilters {
  is_active?: boolean;
  status?: string;
  payment_status?: string;
  customer_id?: number;
  is_overdue?: boolean;
  risk_level?: string;
  search?: string;
  from_date?: Date;
  to_date?: Date;
}

/**
 * Gold Loan Service
 * Handles all gold loan-related operations
 */
export class GoldLoanService {
  /**
   * Create new gold loan
   */
  static async createGoldLoan(
    data: any,
    createdBy: number
  ): Promise<GoldLoanServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      // Validate customer exists
      const customer = await Customer.findByPk(data.customer_id);
      if (!customer) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Customer not found',
        };
      }

      // Generate loan number
      const loanNumber = await GoldLoan.generateLoanNumber();

      // Calculate net weight
      const netWeight = parseFloat(
        (data.gross_weight - (data.stone_weight || 0)).toFixed(3)
      );

      // Create loan instance for calculations
      const loan = GoldLoan.build({
        loan_number: loanNumber,
        loan_date: data.loan_date || new Date(),
        customer_id: data.customer_id,

        // Customer snapshot
        customer_name: customer.name,
        customer_mobile: customer.mobile,
        customer_address: customer.address,
        customer_aadhar: customer.aadhar_number,
        customer_pan: customer.pan_number,

        // Collateral details
        item_description: data.item_description,
        gross_weight: data.gross_weight,
        stone_weight: data.stone_weight || 0,
        net_weight: netWeight,
        purity_percentage: data.purity_percentage,

        // Valuation
        current_gold_rate: data.current_gold_rate,
        ltv_ratio: data.ltv_ratio || 75.0,

        // Loan terms
        interest_rate: data.interest_rate,
        interest_calculation_type: data.interest_calculation_type || 'monthly',
        tenure_months: data.tenure_months,
        processing_fee: data.processing_fee || 0,

        // Photos/documents
        item_photos: data.item_photos || null,
        customer_photo: data.customer_photo || null,
        documents: data.documents || null,

        // Agreement
        agreement_terms: data.agreement_terms || null,
        special_conditions: data.special_conditions || null,
        notes: data.notes || null,

        // Approval
        requires_approval: data.requires_approval !== undefined ? data.requires_approval : true,

        created_by: createdBy,
      } as any);

      // Perform all calculations
      loan.calculateFineWeight();
      loan.calculateAppraisedValue();

      // Allow manual loan amount or calculate from LTV
      if (data.loan_amount) {
        loan.loan_amount = data.loan_amount;
      } else {
        loan.calculateLoanAmount();
      }

      loan.calculateInterest();
      loan.calculateTotalPayable();
      loan.updateBalanceDue();

      // Calculate maturity date
      const maturityDate = new Date(loan.loan_date);
      maturityDate.setMonth(maturityDate.getMonth() + loan.tenure_months);
      loan.maturity_date = maturityDate;

      // Save loan
      await loan.save({ transaction });

      await transaction.commit();

      return {
        success: true,
        message: 'Gold loan created successfully',
        data: loan,
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error creating gold loan:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while creating gold loan',
      };
    }
  }

  /**
   * Get all loans with filters
   */
  static async getAllLoans(
    filters?: GoldLoanFilters,
    pagination?: { page: number; limit: number }
  ): Promise<GoldLoanServiceResponse> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.is_active !== undefined) {
          where.is_active = filters.is_active;
        }
        if (filters.status) {
          where.status = filters.status;
        }
        if (filters.payment_status) {
          where.payment_status = filters.payment_status;
        }
        if (filters.customer_id) {
          where.customer_id = filters.customer_id;
        }
        if (filters.is_overdue !== undefined) {
          where.is_overdue = filters.is_overdue;
        }
        if (filters.risk_level) {
          where.risk_level = filters.risk_level;
        }
        if (filters.search) {
          where[Op.or] = [
            { loan_number: { [Op.iLike]: `%${filters.search}%` } },
            { customer_name: { [Op.iLike]: `%${filters.search}%` } },
            { customer_mobile: { [Op.iLike]: `%${filters.search}%` } },
          ];
        }
        if (filters.from_date || filters.to_date) {
          where.loan_date = {};
          if (filters.from_date) {
            where.loan_date[Op.gte] = filters.from_date;
          }
          if (filters.to_date) {
            where.loan_date[Op.lte] = filters.to_date;
          }
        }
      }

      const query: any = {
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'customer_code', 'name', 'mobile', 'email'],
          },
        ],
        order: [['loan_date', 'DESC']],
      };

      if (pagination) {
        query.offset = (pagination.page - 1) * pagination.limit;
        query.limit = pagination.limit;
      }

      const { count, rows } = await GoldLoan.findAndCountAll(query);

      return {
        success: true,
        message: 'Loans retrieved successfully',
        data: {
          loans: rows,
          total: count,
          page: pagination?.page || 1,
          limit: pagination?.limit || count,
          totalPages: pagination ? Math.ceil(count / pagination.limit) : 1,
        },
      };
    } catch (error: any) {
      console.error('Error fetching loans:', error);
      return {
        success: false,
        message: 'An error occurred while fetching loans',
      };
    }
  }

  /**
   * Get loan by ID
   */
  static async getLoanById(id: number): Promise<GoldLoanServiceResponse> {
    try {
      const loan = await GoldLoan.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
          },
        ],
      });

      if (!loan) {
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      // Get payment history
      const payments = await LoanPayment.findAll({
        where: { loan_id: id },
        order: [['payment_date', 'DESC']],
      });

      // Update overdue status
      loan.checkOverdueStatus();
      await loan.save();

      return {
        success: true,
        message: 'Loan retrieved successfully',
        data: { ...loan.toJSON(), payments },
      };
    } catch (error: any) {
      console.error('Error fetching loan:', error);
      return {
        success: false,
        message: 'An error occurred while fetching loan',
      };
    }
  }

  /**
   * Approve loan
   */
  static async approveLoan(
    id: number,
    approvedBy: number
  ): Promise<GoldLoanServiceResponse> {
    try {
      const loan = await GoldLoan.findByPk(id);

      if (!loan) {
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      if (loan.status !== 'sanctioned') {
        return {
          success: false,
          message: 'Only sanctioned loans can be approved',
        };
      }

      loan.approved_by = approvedBy;
      loan.approved_at = new Date();
      loan.approved_date = new Date();
      loan.updated_by = approvedBy;

      await loan.save();

      return {
        success: true,
        message: 'Loan approved successfully',
        data: loan,
      };
    } catch (error: any) {
      console.error('Error approving loan:', error);
      return {
        success: false,
        message: 'An error occurred while approving loan',
      };
    }
  }

  /**
   * Disburse loan
   */
  static async disburseLoan(
    id: number,
    data: any,
    disbursedBy: number
  ): Promise<GoldLoanServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      const loan = await GoldLoan.findByPk(id);

      if (!loan) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      if (!loan.canBeDisbursed()) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Loan cannot be disbursed. Check approval status.',
        };
      }

      // Disburse the loan
      await loan.disburse(disbursedBy);

      // Update customer outstanding balance
      const customer = await Customer.findByPk(loan.customer_id);
      if (customer) {
        customer.outstanding_balance = parseFloat(
          (Number(customer.outstanding_balance) + Number(loan.loan_amount)).toFixed(2)
        );
        await customer.save({ transaction });
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Loan disbursed successfully',
        data: loan,
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error disbursing loan:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while disbursing loan',
      };
    }
  }

  /**
   * Record payment against loan
   */
  static async recordPayment(
    loanId: number,
    paymentData: any,
    createdBy: number
  ): Promise<GoldLoanServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      const loan = await GoldLoan.findByPk(loanId);

      if (!loan) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      if (!loan.canAcceptPayment()) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Loan cannot accept payment. Check loan status.',
        };
      }

      // Generate payment number
      const paymentNumber = await LoanPayment.generatePaymentNumber();

      // Calculate balance before
      const balanceBefore = loan.balance_due;

      // Calculate principal and interest breakdown
      const principalAmount = paymentData.principal_amount || 0;
      const interestAmount = paymentData.interest_amount || 0;
      const penaltyAmount = paymentData.penalty_amount || 0;
      const totalAmount = parseFloat(
        (principalAmount + interestAmount + penaltyAmount).toFixed(2)
      );

      // Create payment
      const payment = LoanPayment.build({
        payment_number: paymentNumber,
        loan_id: loanId,
        payment_date: paymentData.payment_date || new Date(),
        payment_type: paymentData.payment_type || 'partial',
        payment_mode: paymentData.payment_mode,
        principal_amount: principalAmount,
        interest_amount: interestAmount,
        penalty_amount: penaltyAmount,
        total_amount: totalAmount,
        transaction_reference: paymentData.transaction_reference || null,
        bank_name: paymentData.bank_name || null,
        cheque_number: paymentData.cheque_number || null,
        cheque_date: paymentData.cheque_date || null,
        card_last_4_digits: paymentData.card_last_4_digits || null,
        upi_transaction_id: paymentData.upi_transaction_id || null,
        payment_status: paymentData.payment_status || 'pending',
        loan_balance_before: balanceBefore,
        notes: paymentData.notes || null,
        created_by: createdBy,
      } as any);

      // Validate payment details
      payment.validatePaymentDetails();

      // Update loan
      loan.amount_paid = parseFloat(
        (Number(loan.amount_paid) + totalAmount).toFixed(2)
      );
      loan.updateBalanceDue();
      loan.last_payment_date = payment.payment_date;
      loan.updatePaymentStatus();

      // Calculate balance after
      payment.loan_balance_after = loan.balance_due;

      // Check if fully paid
      if (loan.balance_due <= 0) {
        loan.status = 'closed';
        loan.payment_status = 'paid';
        loan.closed_date = new Date();
      } else if (loan.amount_paid > 0) {
        loan.status = 'partial_repaid';
      }

      loan.updated_by = createdBy;

      // Save both
      await payment.save({ transaction });
      await loan.save({ transaction });

      // Update customer outstanding balance
      const customer = await Customer.findByPk(loan.customer_id);
      if (customer) {
        customer.outstanding_balance = parseFloat(
          (Number(customer.outstanding_balance) - totalAmount).toFixed(2)
        );
        await customer.save({ transaction });
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Payment recorded successfully',
        data: { payment, loan },
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error recording payment:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while recording payment',
      };
    }
  }

  /**
   * Close loan
   */
  static async closeLoan(
    id: number,
    closedBy: number
  ): Promise<GoldLoanServiceResponse> {
    try {
      const loan = await GoldLoan.findByPk(id);

      if (!loan) {
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      await loan.close(closedBy);

      return {
        success: true,
        message: 'Loan closed successfully',
        data: loan,
      };
    } catch (error: any) {
      console.error('Error closing loan:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while closing loan',
      };
    }
  }

  /**
   * Foreclose loan (early closure with penalty)
   */
  static async forecloseLoan(
    id: number,
    data: { penalty_amount?: number; notes?: string },
    closedBy: number
  ): Promise<GoldLoanServiceResponse> {
    const transaction = await sequelize.transaction();

    try {
      const loan = await GoldLoan.findByPk(id);

      if (!loan) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      if (!loan.canAcceptPayment()) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Loan cannot be foreclosed',
        };
      }

      // Calculate foreclosure amount (balance due + penalty)
      const penaltyAmount = data.penalty_amount || 0;
      const foreclosureAmount = parseFloat(
        (Number(loan.balance_due) + penaltyAmount).toFixed(2)
      );

      // Record final payment
      const paymentNumber = await LoanPayment.generatePaymentNumber();
      const payment = await LoanPayment.create(
        {
          payment_number: paymentNumber,
          loan_id: id,
          payment_date: new Date(),
          payment_type: 'full',
          payment_mode: 'cash',
          principal_amount: loan.balance_due,
          interest_amount: 0,
          penalty_amount: penaltyAmount,
          total_amount: foreclosureAmount,
          loan_balance_before: loan.balance_due,
          loan_balance_after: 0,
          payment_status: 'verified',
          notes: data.notes || 'Foreclosure payment',
          created_by: closedBy,
        } as any,
        { transaction }
      );

      // Update loan
      loan.amount_paid = parseFloat(
        (Number(loan.amount_paid) + foreclosureAmount).toFixed(2)
      );
      loan.updateBalanceDue();
      loan.status = 'foreclosed';
      loan.payment_status = 'paid';
      loan.closed_date = new Date();
      loan.updated_by = closedBy;

      if (data.notes) {
        loan.notes = loan.notes
          ? `${loan.notes}\n\nForeclosure: ${data.notes}`
          : `Foreclosure: ${data.notes}`;
      }

      await loan.save({ transaction });

      // Update customer outstanding balance
      const customer = await Customer.findByPk(loan.customer_id);
      if (customer) {
        customer.outstanding_balance = parseFloat(
          (Number(customer.outstanding_balance) - foreclosureAmount).toFixed(2)
        );
        await customer.save({ transaction });
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Loan foreclosed successfully',
        data: { loan, payment },
      };
    } catch (error: any) {
      await transaction.rollback();
      console.error('Error foreclosing loan:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while foreclosing loan',
      };
    }
  }

  /**
   * Mark loan as default
   */
  static async markAsDefault(
    id: number,
    reason: string,
    userId: number
  ): Promise<GoldLoanServiceResponse> {
    try {
      const loan = await GoldLoan.findByPk(id);

      if (!loan) {
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      await loan.markAsDefault(userId, reason);

      return {
        success: true,
        message: 'Loan marked as default successfully',
        data: loan,
      };
    } catch (error: any) {
      console.error('Error marking loan as default:', error);
      return {
        success: false,
        message: 'An error occurred while marking loan as default',
      };
    }
  }

  /**
   * Get loan statistics
   */
  static async getLoanStats(filters?: GoldLoanFilters): Promise<GoldLoanServiceResponse> {
    try {
      const where: any = { is_active: true };

      if (filters) {
        if (filters.customer_id) {
          where.customer_id = filters.customer_id;
        }
        if (filters.status) {
          where.status = filters.status;
        }
      }

      const loans = await GoldLoan.findAll({ where });

      const stats = {
        total_loans: loans.length,
        active_loans: loans.filter((l) => l.status === 'disbursed' || l.status === 'active' || l.status === 'partial_repaid').length,
        closed_loans: loans.filter((l) => l.status === 'closed' || l.status === 'foreclosed').length,
        defaulted_loans: loans.filter((l) => l.status === 'defaulted').length,
        overdue_loans: loans.filter((l) => l.is_overdue).length,

        total_disbursed_amount: loans
          .filter((l) => l.disbursed_date)
          .reduce((sum, l) => sum + Number(l.loan_amount), 0),
        total_outstanding_balance: loans
          .filter((l) => l.status === 'disbursed' || l.status === 'active' || l.status === 'partial_repaid')
          .reduce((sum, l) => sum + Number(l.balance_due), 0),
        total_amount_paid: loans.reduce((sum, l) => sum + Number(l.amount_paid), 0),

        total_collateral_value: loans.reduce((sum, l) => sum + Number(l.appraised_value), 0),
        average_ltv: loans.length > 0
          ? loans.reduce((sum, l) => sum + Number(l.ltv_ratio), 0) / loans.length
          : 0,

        high_risk_loans: loans.filter((l) => l.risk_level === 'high').length,
        medium_risk_loans: loans.filter((l) => l.risk_level === 'medium').length,
        low_risk_loans: loans.filter((l) => l.risk_level === 'low').length,
      };

      return {
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats,
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return {
        success: false,
        message: 'An error occurred while fetching statistics',
      };
    }
  }

  /**
   * Get overdue loans
   */
  static async getOverdueLoans(): Promise<GoldLoanServiceResponse> {
    try {
      const loans = await GoldLoan.findAll({
        where: {
          is_active: true,
          status: { [Op.in]: ['disbursed', 'active', 'partial_repaid'] },
          maturity_date: { [Op.lt]: new Date() },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'customer_code', 'name', 'mobile', 'email'],
          },
        ],
        order: [['maturity_date', 'ASC']],
      });

      // Update overdue status for each loan
      for (const loan of loans) {
        loan.checkOverdueStatus();
        await loan.save();
      }

      return {
        success: true,
        message: 'Overdue loans retrieved successfully',
        data: loans,
      };
    } catch (error: any) {
      console.error('Error fetching overdue loans:', error);
      return {
        success: false,
        message: 'An error occurred while fetching overdue loans',
      };
    }
  }

  /**
   * Get loans maturing soon
   */
  static async getMaturingSoonLoans(days: number = 30): Promise<GoldLoanServiceResponse> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const loans = await GoldLoan.findAll({
        where: {
          is_active: true,
          status: { [Op.in]: ['disbursed', 'active', 'partial_repaid'] },
          maturity_date: {
            [Op.between]: [today, futureDate],
          },
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'customer_code', 'name', 'mobile', 'email'],
          },
        ],
        order: [['maturity_date', 'ASC']],
      });

      return {
        success: true,
        message: `Loans maturing within ${days} days retrieved successfully`,
        data: loans,
      };
    } catch (error: any) {
      console.error('Error fetching maturing soon loans:', error);
      return {
        success: false,
        message: 'An error occurred while fetching maturing soon loans',
      };
    }
  }

  /**
   * Calculate current interest for a loan
   */
  static async calculateCurrentInterest(loanId: number): Promise<GoldLoanServiceResponse> {
    try {
      const loan = await GoldLoan.findByPk(loanId);

      if (!loan) {
        return {
          success: false,
          message: 'Loan not found',
        };
      }

      // Calculate days elapsed since disbursement
      if (!loan.disbursed_date) {
        return {
          success: false,
          message: 'Loan not yet disbursed',
        };
      }

      const today = new Date();
      const disbursedDate = new Date(loan.disbursed_date);
      const daysElapsed = Math.floor(
        (today.getTime() - disbursedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate accrued interest
      const dailyRate = loan.interest_rate / 365 / 100;
      const accruedInterest = parseFloat(
        (Number(loan.loan_amount) * dailyRate * daysElapsed).toFixed(2)
      );

      const breakdown = {
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        days_elapsed: daysElapsed,
        accrued_interest: accruedInterest,
        total_interest_due: loan.total_interest,
        remaining_interest: parseFloat((Number(loan.total_interest) - accruedInterest).toFixed(2)),
      };

      return {
        success: true,
        message: 'Interest calculation completed',
        data: breakdown,
      };
    } catch (error: any) {
      console.error('Error calculating interest:', error);
      return {
        success: false,
        message: 'An error occurred while calculating interest',
      };
    }
  }
}

export default GoldLoanService;
