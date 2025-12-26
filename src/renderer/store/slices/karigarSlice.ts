import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Karigar (Craftsman) Interface
 */
export interface Karigar {
  id: number;
  karigar_code: string;
  name: string;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  specialization: 'general' | 'stone_setting' | 'polishing' | 'casting' | 'designing' | 'engraving';
  experience_years: number;
  skill_level: 'beginner' | 'intermediate' | 'expert' | 'master';
  payment_type: 'per_piece' | 'per_gram' | 'daily_wage' | 'monthly_salary';
  payment_rate: number;
  advance_given: number;
  outstanding_balance: number;
  metal_account_gold: number;
  metal_account_silver: number;
  total_orders_completed: number;
  total_orders_pending: number;
  average_completion_days: number;
  aadhar_number: string | null;
  pan_number: string | null;
  photo_url: string | null;
  documents: string[] | null;
  status: 'active' | 'inactive' | 'suspended';
  suspension_reason: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Karigar Order Interface
 */
export interface KarigarOrder {
  id: number;
  order_number: string;
  karigar_id: number;
  order_date: string;
  expected_delivery_date: string;
  actual_delivery_date: string | null;
  order_type: 'new_making' | 'repair' | 'stone_setting' | 'polishing' | 'designing' | 'custom';
  description: string;
  design_reference: string | null;
  design_images: string[] | null;
  product_id: number | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number;
  metal_type: string;
  metal_issued_weight: number;
  metal_issued_purity: number;
  metal_issued_fine_weight: number;
  metal_received_weight: number;
  metal_received_purity: number;
  metal_received_fine_weight: number;
  wastage_weight: number;
  wastage_percentage: number;
  wastage_amount: number;
  labour_charges: number;
  payment_type: 'per_piece' | 'per_gram' | 'fixed';
  payment_rate: number;
  total_payment: number;
  payment_status: 'pending' | 'partial' | 'paid';
  amount_paid: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  remarks: string | null;
  cancellation_reason: string | null;
  quality_check_done: boolean;
  quality_check_passed: boolean;
  quality_remarks: string | null;
  started_at: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  karigar?: Karigar;
}

/**
 * Karigar Filters Interface
 */
export interface KarigarFilters {
  search?: string;
  specialization?: string;
  status?: string;
  skill_level?: string;
  experience_min?: number;
  experience_max?: number;
}

/**
 * Karigar Order Filters Interface
 */
export interface KarigarOrderFilters {
  search?: string;
  karigar_id?: number;
  order_type?: string;
  status?: string;
  priority?: string;
  payment_status?: string;
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
 * Karigar Statistics Interface
 */
export interface KarigarStats {
  total_karigars: number;
  active_karigars: number;
  total_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  total_metal_gold: number;
  total_metal_silver: number;
  total_outstanding: number;
}

/**
 * Karigar State Interface
 */
export interface KarigarState {
  karigars: Karigar[];
  currentKarigar: Karigar | null;
  orders: KarigarOrder[];
  currentOrder: KarigarOrder | null;
  karigarFilters: KarigarFilters;
  orderFilters: KarigarOrderFilters;
  karigarPagination: Pagination;
  orderPagination: Pagination;
  stats: KarigarStats | null;
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: KarigarState = {
  karigars: [],
  currentKarigar: null,
  orders: [],
  currentOrder: null,
  karigarFilters: {},
  orderFilters: {},
  karigarPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  orderPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  stats: null,
  loading: false,
  error: null,
};

/**
 * Karigar Slice
 */
const karigarSlice = createSlice({
  name: 'karigar',
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
     * Set Karigars with Pagination
     */
    setKarigars: (
      state,
      action: PayloadAction<{
        karigars: Karigar[];
        pagination?: Pagination;
      }>
    ) => {
      state.karigars = action.payload.karigars;
      if (action.payload.pagination) {
        state.karigarPagination = action.payload.pagination;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Current Karigar
     */
    setCurrentKarigar: (state, action: PayloadAction<Karigar | null>) => {
      state.currentKarigar = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Add Karigar
     */
    addKarigar: (state, action: PayloadAction<Karigar>) => {
      state.karigars.unshift(action.payload);
      state.karigarPagination.total += 1;
      state.loading = false;
      state.error = null;
    },

    /**
     * Update Karigar
     */
    updateKarigar: (state, action: PayloadAction<Karigar>) => {
      const index = state.karigars.findIndex((k) => k.id === action.payload.id);
      if (index !== -1) {
        state.karigars[index] = action.payload;
      }
      if (state.currentKarigar?.id === action.payload.id) {
        state.currentKarigar = action.payload;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Remove Karigar (Soft Delete)
     */
    removeKarigar: (state, action: PayloadAction<number>) => {
      state.karigars = state.karigars.filter((k) => k.id !== action.payload);
      state.karigarPagination.total -= 1;
      if (state.currentKarigar?.id === action.payload) {
        state.currentKarigar = null;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Karigar Filters
     */
    setKarigarFilters: (state, action: PayloadAction<KarigarFilters>) => {
      state.karigarFilters = action.payload;
      state.karigarPagination.page = 1; // Reset to first page on filter change
    },

    /**
     * Set Karigar Pagination
     */
    setKarigarPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.karigarPagination = {
        ...state.karigarPagination,
        ...action.payload,
      };
    },

    /**
     * Set Orders with Pagination
     */
    setOrders: (
      state,
      action: PayloadAction<{
        orders: KarigarOrder[];
        pagination?: Pagination;
      }>
    ) => {
      state.orders = action.payload.orders;
      if (action.payload.pagination) {
        state.orderPagination = action.payload.pagination;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Current Order
     */
    setCurrentOrder: (state, action: PayloadAction<KarigarOrder | null>) => {
      state.currentOrder = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Add Order
     */
    addOrder: (state, action: PayloadAction<KarigarOrder>) => {
      state.orders.unshift(action.payload);
      state.orderPagination.total += 1;
      state.loading = false;
      state.error = null;
    },

    /**
     * Update Order
     */
    updateOrder: (state, action: PayloadAction<KarigarOrder>) => {
      const index = state.orders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
      state.loading = false;
      state.error = null;
    },

    /**
     * Set Order Filters
     */
    setOrderFilters: (state, action: PayloadAction<KarigarOrderFilters>) => {
      state.orderFilters = action.payload;
      state.orderPagination.page = 1; // Reset to first page on filter change
    },

    /**
     * Set Order Pagination
     */
    setOrderPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.orderPagination = {
        ...state.orderPagination,
        ...action.payload,
      };
    },

    /**
     * Set Statistics
     */
    setStats: (state, action: PayloadAction<KarigarStats>) => {
      state.stats = action.payload;
      state.loading = false;
      state.error = null;
    },

    /**
     * Clear Karigars
     */
    clearKarigars: (state) => {
      state.karigars = [];
      state.currentKarigar = null;
      state.karigarPagination = initialState.karigarPagination;
    },

    /**
     * Clear Orders
     */
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.orderPagination = initialState.orderPagination;
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
  setKarigars,
  setCurrentKarigar,
  addKarigar,
  updateKarigar,
  removeKarigar,
  setKarigarFilters,
  setKarigarPagination,
  setOrders,
  setCurrentOrder,
  addOrder,
  updateOrder,
  setOrderFilters,
  setOrderPagination,
  setStats,
  clearKarigars,
  clearOrders,
  clearAll,
} = karigarSlice.actions;

export default karigarSlice.reducer;
