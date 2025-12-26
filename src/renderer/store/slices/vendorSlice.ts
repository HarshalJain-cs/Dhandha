import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Vendor {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  vendor_type: 'metal_supplier' | 'diamond_supplier' | 'stone_supplier' | 'other';
  current_balance: number;
  credit_limit: number;
  payment_terms: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VendorFilters {
  is_active?: boolean;
  vendor_type?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VendorState {
  vendors: Vendor[];
  currentVendor: Vendor | null;
  filters: VendorFilters;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: VendorState = {
  vendors: [],
  currentVendor: null,
  filters: {
    is_active: true,
    vendor_type: '',
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

const vendorSlice = createSlice({
  name: 'vendor',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setVendors: (
      state,
      action: PayloadAction<{
        vendors: Vendor[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.vendors = action.payload.vendors;
      if (action.payload.total !== undefined) state.pagination.total = action.payload.total;
      if (action.payload.page !== undefined) state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined) state.pagination.limit = action.payload.limit;
      if (action.payload.totalPages !== undefined) state.pagination.totalPages = action.payload.totalPages;
      state.loading = false;
      state.error = null;
    },

    setCurrentVendor: (state, action: PayloadAction<Vendor | null>) => {
      state.currentVendor = action.payload;
    },

    addVendor: (state, action: PayloadAction<Vendor>) => {
      state.vendors.unshift(action.payload);
      state.pagination.total += 1;
    },

    updateVendor: (state, action: PayloadAction<Vendor>) => {
      const index = state.vendors.findIndex((v) => v.vendor_id === action.payload.vendor_id);
      if (index !== -1) state.vendors[index] = action.payload;
      if (state.currentVendor?.vendor_id === action.payload.vendor_id) state.currentVendor = action.payload;
    },

    removeVendor: (state, action: PayloadAction<number>) => {
      state.vendors = state.vendors.filter((v) => v.vendor_id !== action.payload);
      state.pagination.total -= 1;
      if (state.currentVendor?.vendor_id === action.payload) state.currentVendor = null;
    },

    setFilters: (state, action: PayloadAction<Partial<VendorFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    clearFilters: (state) => {
      state.filters = { is_active: true, vendor_type: '', search: '' };
      state.pagination.page = 1;
    },

    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearVendors: (state) => {
      state.vendors = [];
      state.currentVendor = null;
      state.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    },
  },
});

export const {
  setLoading,
  setError,
  setVendors,
  setCurrentVendor,
  addVendor,
  updateVendor,
  removeVendor,
  setFilters,
  clearFilters,
  setPagination,
  clearVendors,
} = vendorSlice.actions;

export default vendorSlice.reducer;
