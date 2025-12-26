import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SalesReturn {
  return_id: number;
  return_number: string;
  original_invoice_id: number;
  customer_id: number;
  return_date: Date;
  return_type: 'return' | 'exchange';
  reason: string | null;
  refund_amount: number;
  exchange_invoice_id: number | null;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  approved_by: number | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SalesReturnFilters {
  status?: string;
  return_type?: string;
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

export interface SalesReturnStats {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  completedReturns: number;
  totalRefundAmount: number;
}

export interface SalesReturnState {
  returns: SalesReturn[];
  currentReturn: SalesReturn | null;
  filters: SalesReturnFilters;
  pagination: Pagination;
  stats: SalesReturnStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesReturnState = {
  returns: [],
  currentReturn: null,
  filters: {
    status: '',
    return_type: '',
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

const salesReturnSlice = createSlice({
  name: 'salesReturn',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setReturns: (
      state,
      action: PayloadAction<{
        returns: SalesReturn[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.returns = action.payload.returns;
      if (action.payload.total !== undefined) state.pagination.total = action.payload.total;
      if (action.payload.page !== undefined) state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined) state.pagination.limit = action.payload.limit;
      if (action.payload.totalPages !== undefined) state.pagination.totalPages = action.payload.totalPages;
      state.loading = false;
      state.error = null;
    },

    setCurrentReturn: (state, action: PayloadAction<SalesReturn | null>) => {
      state.currentReturn = action.payload;
    },

    addReturn: (state, action: PayloadAction<SalesReturn>) => {
      state.returns.unshift(action.payload);
      state.pagination.total += 1;
    },

    updateReturn: (state, action: PayloadAction<SalesReturn>) => {
      const index = state.returns.findIndex((r) => r.return_id === action.payload.return_id);
      if (index !== -1) state.returns[index] = action.payload;
      if (state.currentReturn?.return_id === action.payload.return_id) state.currentReturn = action.payload;
    },

    removeReturn: (state, action: PayloadAction<number>) => {
      state.returns = state.returns.filter((r) => r.return_id !== action.payload);
      state.pagination.total -= 1;
      if (state.currentReturn?.return_id === action.payload) state.currentReturn = null;
    },

    setStats: (state, action: PayloadAction<SalesReturnStats>) => {
      state.stats = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<SalesReturnFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    clearFilters: (state) => {
      state.filters = { status: '', return_type: '', search: '' };
      state.pagination.page = 1;
    },

    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearReturns: (state) => {
      state.returns = [];
      state.currentReturn = null;
      state.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    },
  },
});

export const {
  setLoading,
  setError,
  setReturns,
  setCurrentReturn,
  addReturn,
  updateReturn,
  removeReturn,
  setStats,
  setFilters,
  clearFilters,
  setPagination,
  clearReturns,
} = salesReturnSlice.actions;

export default salesReturnSlice.reducer;
