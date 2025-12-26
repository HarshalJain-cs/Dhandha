import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Quotation {
  quotation_id: number;
  quotation_number: string;
  customer_id: number;
  quotation_date: Date;
  valid_until: Date;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  total_tax: number;
  grand_total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'converted';
  converted_invoice_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationFilters {
  status?: string;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QuotationStats {
  totalQuotations: number;
  pendingQuotations: number;
  acceptedQuotations: number;
  convertedQuotations: number;
  totalValue: number;
}

export interface QuotationState {
  quotations: Quotation[];
  currentQuotation: Quotation | null;
  filters: QuotationFilters;
  pagination: Pagination;
  stats: QuotationStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuotationState = {
  quotations: [],
  currentQuotation: null,
  filters: {
    status: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  stats: null,
  loading: false,
  error: null,
};

const quotationSlice = createSlice({
  name: 'quotation',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setQuotations: (
      state,
      action: PayloadAction<{
        quotations: Quotation[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.quotations = action.payload.quotations;
      if (action.payload.total !== undefined) state.pagination.total = action.payload.total;
      if (action.payload.page !== undefined) state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined) state.pagination.limit = action.payload.limit;
      if (action.payload.totalPages !== undefined) state.pagination.totalPages = action.payload.totalPages;
      state.loading = false;
      state.error = null;
    },

    setCurrentQuotation: (state, action: PayloadAction<Quotation | null>) => {
      state.currentQuotation = action.payload;
    },

    addQuotation: (state, action: PayloadAction<Quotation>) => {
      state.quotations.unshift(action.payload);
      state.pagination.total += 1;
    },

    updateQuotation: (state, action: PayloadAction<Quotation>) => {
      const index = state.quotations.findIndex((q) => q.quotation_id === action.payload.quotation_id);
      if (index !== -1) state.quotations[index] = action.payload;
      if (state.currentQuotation?.quotation_id === action.payload.quotation_id) state.currentQuotation = action.payload;
    },

    removeQuotation: (state, action: PayloadAction<number>) => {
      state.quotations = state.quotations.filter((q) => q.quotation_id !== action.payload);
      state.pagination.total -= 1;
      if (state.currentQuotation?.quotation_id === action.payload) state.currentQuotation = null;
    },

    setStats: (state, action: PayloadAction<QuotationStats>) => {
      state.stats = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<QuotationFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    clearFilters: (state) => {
      state.filters = { status: '', search: '' };
      state.pagination.page = 1;
    },

    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearQuotations: (state) => {
      state.quotations = [];
      state.currentQuotation = null;
      state.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    },
  },
});

export const {
  setLoading,
  setError,
  setQuotations,
  setCurrentQuotation,
  addQuotation,
  updateQuotation,
  removeQuotation,
  setStats,
  setFilters,
  clearFilters,
  setPagination,
  clearQuotations,
} = quotationSlice.actions;

export default quotationSlice.reducer;
