import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PurchaseOrder {
  purchase_order_id: number;
  po_number: string;
  vendor_id: number;
  po_date: Date;
  expected_delivery_date: Date | null;
  metal_type_id: number | null;
  quantity: number;
  rate_per_gram: number;
  total_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  grand_total: number;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  received_quantity: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrderFilters {
  status?: string;
  vendor_id?: number;
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

export interface PurchaseOrderStats {
  totalPOs: number;
  pendingPOs: number;
  receivedPOs: number;
  totalValue: number;
}

export interface PurchaseOrderState {
  purchaseOrders: PurchaseOrder[];
  currentPurchaseOrder: PurchaseOrder | null;
  filters: PurchaseOrderFilters;
  pagination: Pagination;
  stats: PurchaseOrderStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseOrderState = {
  purchaseOrders: [],
  currentPurchaseOrder: null,
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

const purchaseOrderSlice = createSlice({
  name: 'purchaseOrder',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setPurchaseOrders: (
      state,
      action: PayloadAction<{
        purchaseOrders: PurchaseOrder[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.purchaseOrders = action.payload.purchaseOrders;
      if (action.payload.total !== undefined) state.pagination.total = action.payload.total;
      if (action.payload.page !== undefined) state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined) state.pagination.limit = action.payload.limit;
      if (action.payload.totalPages !== undefined) state.pagination.totalPages = action.payload.totalPages;
      state.loading = false;
      state.error = null;
    },

    setCurrentPurchaseOrder: (state, action: PayloadAction<PurchaseOrder | null>) => {
      state.currentPurchaseOrder = action.payload;
    },

    addPurchaseOrder: (state, action: PayloadAction<PurchaseOrder>) => {
      state.purchaseOrders.unshift(action.payload);
      state.pagination.total += 1;
    },

    updatePurchaseOrder: (state, action: PayloadAction<PurchaseOrder>) => {
      const index = state.purchaseOrders.findIndex((p) => p.purchase_order_id === action.payload.purchase_order_id);
      if (index !== -1) state.purchaseOrders[index] = action.payload;
      if (state.currentPurchaseOrder?.purchase_order_id === action.payload.purchase_order_id) state.currentPurchaseOrder = action.payload;
    },

    removePurchaseOrder: (state, action: PayloadAction<number>) => {
      state.purchaseOrders = state.purchaseOrders.filter((p) => p.purchase_order_id !== action.payload);
      state.pagination.total -= 1;
      if (state.currentPurchaseOrder?.purchase_order_id === action.payload) state.currentPurchaseOrder = null;
    },

    setStats: (state, action: PayloadAction<PurchaseOrderStats>) => {
      state.stats = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<PurchaseOrderFilters>>) => {
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

    clearPurchaseOrders: (state) => {
      state.purchaseOrders = [];
      state.currentPurchaseOrder = null;
      state.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    },
  },
});

export const {
  setLoading,
  setError,
  setPurchaseOrders,
  setCurrentPurchaseOrder,
  addPurchaseOrder,
  updatePurchaseOrder,
  removePurchaseOrder,
  setStats,
  setFilters,
  clearFilters,
  setPagination,
  clearPurchaseOrders,
} = purchaseOrderSlice.actions;

export default purchaseOrderSlice.reducer;
