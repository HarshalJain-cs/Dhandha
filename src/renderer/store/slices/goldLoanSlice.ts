import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Gold Loan Interface
 */
export interface GoldLoan {
  id: number;
  loan_number: string;
  loan_date: string;
  customer_id: number;
  customer_name: string;
  customer_mobile: string;
  customer_address: string | null;
  customer_aadhar: string | null;
  customer_pan: string | null;
  item_description: string;
  gross_weight: number;
  stone_weight: number;
  net_weight: number;
  purity_percentage: number;
  fine_weight: number;
  current_gold_rate: number;
  appraised_value: number;
  ltv_ratio: number;
  loan_amount: number;
  interest_rate: number;
  interest_calculation_type: 'monthly' | 'quarterly' | 'maturity';
  tenure_months: number;
  disbursement_date: string | null;
  maturity_date: string;
  total_interest: number;
  processing_fee: number;
  total_payable: number;
  amount_paid: number;
  balance_due: number;
  status: 'sanctioned' | 'disbursed' | 'active' | 'partial_repaid' | 'closed' | 'defaulted' | 'foreclosed';
  payment_status: 'pending' | 'partial' | 'paid';
  approved_date: string | null;
  disbursed_date: string | null;
  last_payment_date: string | null;
  closed_date: string | null;
  defaulted_date: string | null;
  item_photos: string[] | null;
  customer_photo: string | null;
  documents: string[] | null;
  agreement_terms: string | null;
  special_conditions: string | null;
  notes: string | null;
  requires_approval: boolean;
  approved_by: number | null;
  approved_at: string | null;
  is_overdue: boolean;
  days_overdue: number;
  risk_level: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Loan Payment Interface
 */
export interface LoanPayment {
  id: number;
  payment_number: string;
  loan_id: number;
  payment_date: string;
  payment_type: 'partial' | 'full' | 'interest_only' | 'principal_only';
  payment_mode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  principal_amount: number;
  interest_amount: number;
  penalty_amount: number;
  total_amount: number;
  transaction_reference: string | null;
  bank_name: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  card_last_4_digits: string | null;
  upi_transaction_id: string | null;
  payment_status: 'pending' | 'verified' | 'cleared' | 'bounced';
  verified_by: number | null;
  verified_at: string | null;
  loan_balance_before: number;
  loan_balance_after: number;
  notes: string | null;
  receipt_url: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Gold Loan Filters Interface
 */
export interface GoldLoanFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  customer_id?: number;
  is_overdue?: boolean;
  risk_level?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Pagination Interface
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Gold Loan Statistics Interface
 */
export interface GoldLoanStats {
  total_loans: number;
  active_loans: number;
  closed_loans: number;
  defaulted_loans: number;
  overdue_loans: number;
  total_disbursed_amount: number;
  total_outstanding_balance: number;
  total_amount_paid: number;
  total_collateral_value: number;
  average_ltv: number;
  high_risk_loans: number;
  medium_risk_loans: number;
  low_risk_loans: number;
}

/**
 * Gold Loan State Interface
 */
export interface GoldLoanState {
  loans: GoldLoan[];
  currentLoan: GoldLoan | null;
  payments: LoanPayment[];
  filters: GoldLoanFilters;
  pagination: Pagination;
  stats: GoldLoanStats | null;
  overdueLoans: GoldLoan[];
  maturingSoonLoans: GoldLoan[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: GoldLoanState = {
  loans: [],
  currentLoan: null,
  payments: [],
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  stats: null,
  overdueLoans: [],
  maturingSoonLoans: [],
  loading: false,
  error: null,
};

/**
 * Gold Loan Slice
 */
const goldLoanSlice = createSlice({
  name: 'goldLoan',
  initialState,
  reducers: {
    /**
     * Set Loading State
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set Error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Set Loans with Pagination
     */
    setLoans: (
      state,
      action: PayloadAction<{
        loans: GoldLoan[];
        pagination?: Pagination;
      }>
    ) => {
      state.loans = action.payload.loans;
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Current Loan
     */
    setCurrentLoan: (state, action: PayloadAction<GoldLoan | null>) => {
      state.currentLoan = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Add Loan
     */
    addLoan: (state, action: PayloadAction<GoldLoan>) => {
      state.loans.unshift(action.payload);
      state.pagination.total += 1;
      state.loading = false;
      state.error = null;
    },

    /**
     * Update Loan
     */
    updateLoan: (state, action: PayloadAction<GoldLoan>) => {
      const index = state.loans.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.loans[index] = action.payload;
      }
      if (state.currentLoan?.id === action.payload.id) {
        state.currentLoan = action.payload;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Filters
     */
    setFilters: (state, action: PayloadAction<GoldLoanFilters>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page on filter change
    },

    /**
     * Set Pagination
     */
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },

    /**
     * Set Payments
     */
    setPayments: (state, action: PayloadAction<LoanPayment[]>) => {
      state.payments = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Add Payment
     */
    addPayment: (state, action: PayloadAction<LoanPayment>) => {
      state.payments.unshift(action.payload);
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Statistics
     */
    setStats: (state, action: PayloadAction<GoldLoanStats>) => {
      state.stats = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Overdue Loans
     */
    setOverdueLoans: (state, action: PayloadAction<GoldLoan[]>) => {
      state.overdueLoans = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Maturing Soon Loans
     */
    setMaturingSoonLoans: (state, action: PayloadAction<GoldLoan[]>) => {
      state.maturingSoonLoans = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Clear Loans
     */
    clearLoans: (state) => {
      state.loans = [];
      state.currentLoan = null;
      state.pagination = initialState.pagination;
    },

    /**
     * Clear Payments
     */
    clearPayments: (state) => {
      state.payments = [];
    },

    /**
     * Clear All
     */
    clearAll: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  setLoans,
  setCurrentLoan,
  addLoan,
  updateLoan,
  setFilters,
  setPagination,
  setPayments,
  addPayment,
  setStats,
  setOverdueLoans,
  setMaturingSoonLoans,
  clearLoans,
  clearPayments,
  clearAll,
} = goldLoanSlice.actions;

export default goldLoanSlice.reducer;
