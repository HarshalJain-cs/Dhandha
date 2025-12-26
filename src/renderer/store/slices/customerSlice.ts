import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Customer Interface
 */
export interface Customer {
  id: number;
  customer_code: string;
  customer_type: 'retail' | 'wholesale' | 'vip';
  first_name: string;
  last_name: string | null;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  pan_number: string | null;
  aadhar_number: string | null;
  gstin: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  date_of_birth: Date | null;
  anniversary_date: Date | null;
  credit_limit: number;
  credit_days: number;
  outstanding_balance: number;
  loyalty_points: number;
  discount_percentage: number;
  metal_account_balance: number;
  notes: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Customer Filters Interface
 */
export interface CustomerFilters {
  is_active?: boolean;
  customer_type?: 'retail' | 'wholesale' | 'vip' | '';
  search?: string;
  city?: string;
  state?: string;
  min_credit_limit?: number;
  max_credit_limit?: number;
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
 * Customer State Interface
 */
export interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  filters: CustomerFilters;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: CustomerState = {
  customers: [],
  currentCustomer: null,
  filters: {
    is_active: true,
    customer_type: '',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

/**
 * Customer Slice
 */
const customerSlice = createSlice({
  name: 'customer',
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
     * Set customers (with pagination)
     */
    setCustomers: (
      state,
      action: PayloadAction<{
        customers: Customer[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.customers = action.payload.customers;
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
     * Set current customer
     */
    setCurrentCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.currentCustomer = action.payload;
    },

    /**
     * Add customer
     */
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
      state.pagination.total += 1;
    },

    /**
     * Update customer
     */
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
      if (state.currentCustomer?.id === action.payload.id) {
        state.currentCustomer = action.payload;
      }
    },

    /**
     * Remove customer
     */
    removeCustomer: (state, action: PayloadAction<number>) => {
      state.customers = state.customers.filter((c) => c.id !== action.payload);
      state.pagination.total -= 1;
      if (state.currentCustomer?.id === action.payload) {
        state.currentCustomer = null;
      }
    },

    /**
     * Set filters
     */
    setFilters: (state, action: PayloadAction<Partial<CustomerFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset to page 1 when filters change
      state.pagination.page = 1;
    },

    /**
     * Clear filters
     */
    clearFilters: (state) => {
      state.filters = {
        is_active: true,
        customer_type: '',
        search: '',
      };
      state.pagination.page = 1;
    },

    /**
     * Set pagination
     */
    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    /**
     * Clear customers
     */
    clearCustomers: (state) => {
      state.customers = [];
      state.currentCustomer = null;
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
    },
  },
});

/**
 * Export actions
 */
export const {
  setLoading,
  setError,
  setCustomers,
  setCurrentCustomer,
  addCustomer,
  updateCustomer,
  removeCustomer,
  setFilters,
  clearFilters,
  setPagination,
  clearCustomers,
} = customerSlice.actions;

/**
 * Export reducer
 */
export default customerSlice.reducer;
