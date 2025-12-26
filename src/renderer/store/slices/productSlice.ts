import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Product Interface
 */
export interface Product {
  id: number;
  product_code: string;
  barcode: string | null;
  rfid_tag: string | null;
  huid: string | null;
  category_id: number;
  metal_type_id: number;
  product_name: string;
  description: string | null;
  design_number: string | null;
  size: string | null;
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  wastage_percentage: number;
  making_charge_type: 'per_gram' | 'percentage' | 'fixed' | 'slab';
  making_charge: number;
  hallmark_number: string | null;
  hallmark_center: string | null;
  purity: number;
  fine_weight: number;
  quantity: number;
  current_stock: number;
  min_stock_level: number;
  reorder_level: number;
  unit_price: number;
  mrp: number | null;
  location: string | null;
  rack_number: string | null;
  shelf_number: string | null;
  status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  images: string[] | null;
  tags: string[] | null;
  notes: string | null;
  custom_fields: any | null;
  is_active: boolean;
  category?: any;
  metalType?: any;
  stones?: any[];
}

/**
 * Product Filters Interface
 */
export interface ProductFilters {
  is_active?: boolean;
  category_id?: number;
  metal_type_id?: number;
  status?: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'with_karigar';
  search?: string;
  min_price?: number;
  max_price?: number;
  min_weight?: number;
  max_weight?: number;
  tags?: string[];
  low_stock?: boolean;
  out_of_stock?: boolean;
}

/**
 * Product State Interface
 */
export interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  filters: ProductFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
}

/**
 * Initial State
 */
const initialState: ProductState = {
  products: [],
  currentProduct: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
  lowStockProducts: [],
  outOfStockProducts: [],
};

/**
 * Product Slice
 */
const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Set products list
    setProducts: (state, action: PayloadAction<{
      products: Product[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>) => {
      state.products = action.payload.products;
      state.pagination = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
      state.loading = false;
      state.error = null;
    },

    // Set current product
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Add new product to list
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
      state.pagination.total += 1;
    },

    // Update product in list
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
      if (state.currentProduct?.id === action.payload.id) {
        state.currentProduct = action.payload;
      }
    },

    // Remove product from list
    removeProduct: (state, action: PayloadAction<number>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
      state.pagination.total -= 1;
      if (state.currentProduct?.id === action.payload) {
        state.currentProduct = null;
      }
    },

    // Set filters
    setFilters: (state, action: PayloadAction<ProductFilters>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page when filters change
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },

    // Set pagination
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.limit = action.payload.limit;
    },

    // Set low stock products
    setLowStockProducts: (state, action: PayloadAction<Product[]>) => {
      state.lowStockProducts = action.payload;
    },

    // Set out of stock products
    setOutOfStockProducts: (state, action: PayloadAction<Product[]>) => {
      state.outOfStockProducts = action.payload;
    },

    // Clear all product data
    clearProducts: (state) => {
      state.products = [];
      state.currentProduct = null;
      state.filters = {};
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
      state.loading = false;
      state.error = null;
      state.lowStockProducts = [];
      state.outOfStockProducts = [];
    },
  },
});

/**
 * Export actions
 */
export const {
  setLoading,
  setError,
  setProducts,
  setCurrentProduct,
  addProduct,
  updateProduct,
  removeProduct,
  setFilters,
  clearFilters,
  setPagination,
  setLowStockProducts,
  setOutOfStockProducts,
  clearProducts,
} = productSlice.actions;

/**
 * Export reducer
 */
export default productSlice.reducer;
