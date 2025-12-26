import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Stone Interface
 */
export interface Stone {
  id: number;
  stone_name: string;
  stone_code: string;
  stone_type: string;
  base_rate_per_carat: number;
  unit: string;
  description: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Product Stone Interface
 */
export interface ProductStone {
  id: number;
  product_id: number;
  stone_id: number;
  quantity: number;
  carat_weight: number;
  rate_per_carat: number;
  cut_grade: string | null;
  color_grade: string | null;
  clarity_grade: string | null;
  certificate_number: string | null;
  certification_lab: string | null;
  description: string | null;
  stone?: Stone;
  base_value?: number;
  value_with_4c?: number;
}

/**
 * Stone State Interface
 */
export interface StoneState {
  stones: Stone[];
  currentStone: Stone | null;
  productStones: ProductStone[];
  stoneTypes: string[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: StoneState = {
  stones: [],
  currentStone: null,
  productStones: [],
  stoneTypes: [],
  loading: false,
  error: null,
};

/**
 * Stone Slice
 */
const stoneSlice = createSlice({
  name: 'stone',
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

    // Set stones list
    setStones: (state, action: PayloadAction<Stone[]>) => {
      state.stones = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current stone
    setCurrentStone: (state, action: PayloadAction<Stone | null>) => {
      state.currentStone = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set product stones
    setProductStones: (state, action: PayloadAction<ProductStone[]>) => {
      state.productStones = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set stone types
    setStoneTypes: (state, action: PayloadAction<string[]>) => {
      state.stoneTypes = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Add new stone to list
    addStone: (state, action: PayloadAction<Stone>) => {
      state.stones.push(action.payload);
      // Add stone type if it's new
      if (!state.stoneTypes.includes(action.payload.stone_type)) {
        state.stoneTypes.push(action.payload.stone_type);
        state.stoneTypes.sort();
      }
    },

    // Update stone in list
    updateStone: (state, action: PayloadAction<Stone>) => {
      const index = state.stones.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.stones[index] = action.payload;
      }
      if (state.currentStone?.id === action.payload.id) {
        state.currentStone = action.payload;
      }
    },

    // Remove stone from list
    removeStone: (state, action: PayloadAction<number>) => {
      state.stones = state.stones.filter(s => s.id !== action.payload);
      if (state.currentStone?.id === action.payload) {
        state.currentStone = null;
      }
    },

    // Add product stone
    addProductStone: (state, action: PayloadAction<ProductStone>) => {
      state.productStones.push(action.payload);
    },

    // Update product stone
    updateProductStone: (state, action: PayloadAction<ProductStone>) => {
      const index = state.productStones.findIndex(ps => ps.id === action.payload.id);
      if (index !== -1) {
        state.productStones[index] = action.payload;
      }
    },

    // Remove product stone
    removeProductStone: (state, action: PayloadAction<number>) => {
      state.productStones = state.productStones.filter(ps => ps.id !== action.payload);
    },

    // Clear product stones
    clearProductStones: (state) => {
      state.productStones = [];
    },

    // Clear all stone data
    clearStones: (state) => {
      state.stones = [];
      state.currentStone = null;
      state.productStones = [];
      state.stoneTypes = [];
      state.loading = false;
      state.error = null;
    },
  },
});

/**
 * Export actions
 */
export const {
  setLoading,
  setError,
  setStones,
  setCurrentStone,
  setProductStones,
  setStoneTypes,
  addStone,
  updateStone,
  removeStone,
  addProductStone,
  updateProductStone,
  removeProductStone,
  clearProductStones,
  clearStones,
} = stoneSlice.actions;

/**
 * Export reducer
 */
export default stoneSlice.reducer;
