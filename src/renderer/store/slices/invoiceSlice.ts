import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Invoice Interface
 */
export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: Date;
  customer_id: number;
  invoice_type: 'sale' | 'estimate' | 'return';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  customer_name: string;
  customer_mobile: string;
  customer_email: string | null;
  customer_address: string | null;
  customer_gstin: string | null;
  customer_state: string;
  subtotal: number;
  metal_amount: number;
  stone_amount: number;
  making_charges: number;
  wastage_amount: number;
  gst_type: 'intra' | 'inter';
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number;
  discount_percentage: number;
  discount_amount: number;
  round_off: number;
  old_gold_amount: number;
  old_gold_weight: number;
  taxable_amount: number;
  grand_total: number;
  balance_due: number;
  amount_paid: number;
  is_cancelled: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Invoice Item Interface
 */
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  category_name: string;
  metal_type_name: string;
  gross_weight: number;
  net_weight: number;
  fine_weight: number;
  purity: number;
  metal_rate: number;
  quantity: number;
  making_charge_amount: number;
  stone_amount: number;
  subtotal: number;
  total_gst: number;
  line_total: number;
}

/**
 * Payment Interface
 */
export interface Payment {
  id: number;
  invoice_id: number;
  payment_date: Date;
  payment_mode: 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'metal_account';
  amount: number;
  receipt_number: string | null;
  payment_status: 'pending' | 'cleared' | 'failed' | 'cancelled';
}

/**
 * Invoice Filters Interface
 */
export interface InvoiceFilters {
  is_active?: boolean;
  invoice_type?: 'sale' | 'estimate' | 'return' | '';
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue' | '';
  customer_id?: number;
  from_date?: Date | null;
  to_date?: Date | null;
  min_amount?: number;
  max_amount?: number;
  is_cancelled?: boolean;
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
 * Invoice State Interface
 */
export interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  currentInvoiceItems: InvoiceItem[];
  currentInvoicePayments: Payment[];
  filters: InvoiceFilters;
  pagination: Pagination;
  summary: {
    total_invoices: number;
    total_sales: number;
    total_paid: number;
    total_outstanding: number;
  };
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: InvoiceState = {
  invoices: [],
  currentInvoice: null,
  currentInvoiceItems: [],
  currentInvoicePayments: [],
  filters: {
    is_active: true,
    invoice_type: '',
    payment_status: '',
    is_cancelled: false,
    from_date: null,
    to_date: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  summary: {
    total_invoices: 0,
    total_sales: 0,
    total_paid: 0,
    total_outstanding: 0,
  },
  loading: false,
  error: null,
};

/**
 * Invoice Slice
 */
const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Set invoices (with pagination)
     */
    setInvoices: (
      state,
      action: PayloadAction<{
        invoices: Invoice[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.invoices = action.payload.invoices;
      if (action.payload.total !== undefined) {
        state.pagination.total = action.payload.total;
      }
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page;
      }
      if (action.payload.limit !== undefined) {
        state.pagination.limit = action.payload.limit;
      }
      if (action.payload.totalPages !== undefined) {
        state.pagination.totalPages = action.payload.totalPages;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set current invoice
     */
    setCurrentInvoice: (state, action: PayloadAction<Invoice | null>) => {
      state.currentInvoice = action.payload;
    },

    /**
     * Set current invoice items
     */
    setCurrentInvoiceItems: (state, action: PayloadAction<InvoiceItem[]>) => {
      state.currentInvoiceItems = action.payload;
    },

    /**
     * Set current invoice payments
     */
    setCurrentInvoicePayments: (state, action: PayloadAction<Payment[]>) => {
      state.currentInvoicePayments = action.payload;
    },

    /**
     * Add invoice
     */
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      state.invoices.unshift(action.payload);
      state.pagination.total += 1;
    },

    /**
     * Update invoice
     */
    updateInvoice: (state, action: PayloadAction<Invoice>) => {
      const index = state.invoices.findIndex((inv) => inv.id === action.payload.id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
      if (state.currentInvoice?.id === action.payload.id) {
        state.currentInvoice = action.payload;
      }
    },

    /**
     * Add payment to current invoice
     */
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.currentInvoicePayments.push(action.payload);

      // Update current invoice amount_paid and payment_status
      if (state.currentInvoice) {
        state.currentInvoice.amount_paid += action.payload.amount;
        state.currentInvoice.balance_due = state.currentInvoice.grand_total - state.currentInvoice.amount_paid;

        // Update payment status
        if (state.currentInvoice.balance_due <= 0) {
          state.currentInvoice.payment_status = 'paid';
        } else if (state.currentInvoice.amount_paid > 0) {
          state.currentInvoice.payment_status = 'partial';
        }
      }
    },

    /**
     * Cancel invoice
     */
    cancelInvoice: (state, action: PayloadAction<number>) => {
      const index = state.invoices.findIndex((inv) => inv.id === action.payload);
      if (index !== -1) {
        state.invoices[index].is_cancelled = true;
        state.invoices[index].payment_status = 'pending';
      }
      if (state.currentInvoice?.id === action.payload) {
        state.currentInvoice.is_cancelled = true;
        state.currentInvoice.payment_status = 'pending';
      }
    },

    /**
     * Set filters
     */
    setFilters: (state, action: PayloadAction<Partial<InvoiceFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    /**
     * Clear filters
     */
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    /**
     * Set pagination
     */
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    /**
     * Set summary statistics
     */
    setSummary: (
      state,
      action: PayloadAction<{
        total_invoices: number;
        total_sales: number;
        total_paid: number;
        total_outstanding: number;
      }>
    ) => {
      state.summary = action.payload;
    },

    /**
     * Clear invoices
     */
    clearInvoices: (state) => {
      state.invoices = [];
      state.pagination = initialState.pagination;
    },

    /**
     * Clear current invoice
     */
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
      state.currentInvoiceItems = [];
      state.currentInvoicePayments = [];
    },
  },
});

/**
 * Export actions
 */
export const {
  setLoading,
  setError,
  setInvoices,
  setCurrentInvoice,
  setCurrentInvoiceItems,
  setCurrentInvoicePayments,
  addInvoice,
  updateInvoice,
  addPayment,
  cancelInvoice,
  setFilters,
  clearFilters,
  setPagination,
  setSummary,
  clearInvoices,
  clearCurrentInvoice,
} = invoiceSlice.actions;

/**
 * Export reducer
 */
export default invoiceSlice.reducer;
