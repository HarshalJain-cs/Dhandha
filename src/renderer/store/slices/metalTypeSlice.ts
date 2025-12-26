import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Metal Type Interface
 */
export interface MetalType {
  id: number;
  metal_name: string;
  metal_code: string;
  purity_percentage: number;
  current_rate_per_gram: number;
  unit: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Metal Rate Interface
 */
export interface MetalRate {
  id: number;
  metal_name: string;
  metal_code: string;
  purity_percentage: number;
  rate_per_gram: number;
  unit: string;
}

/**
 * Metal Type State Interface
 */
export interface MetalTypeState {
  metalTypes: MetalType[];
  currentMetalType: MetalType | null;
  currentRates: MetalRate[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: MetalTypeState = {
  metalTypes: [],
  currentMetalType: null,
  currentRates: [],
  loading: false,
  error: null,
};

/**
 * Metal Type Slice
 */
const metalTypeSlice = createSlice({
  name: 'metalType',
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

    // Set metal types list
    setMetalTypes: (state, action: PayloadAction<MetalType[]>) => {
      state.metalTypes = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current metal type
    setCurrentMetalType: (state, action: PayloadAction<MetalType | null>) => {
      state.currentMetalType = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current rates
    setCurrentRates: (state, action: PayloadAction<MetalRate[]>) => {
      state.currentRates = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Add new metal type to list
    addMetalType: (state, action: PayloadAction<MetalType>) => {
      state.metalTypes.push(action.payload);
    },

    // Update metal type in list
    updateMetalType: (state, action: PayloadAction<MetalType>) => {
      const index = state.metalTypes.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.metalTypes[index] = action.payload;
      }
      if (state.currentMetalType?.id === action.payload.id) {
        state.currentMetalType = action.payload;
      }
      // Update current rates if this metal type exists there
      const rateIndex = state.currentRates.findIndex(r => r.id === action.payload.id);
      if (rateIndex !== -1) {
        state.currentRates[rateIndex] = {
          ...state.currentRates[rateIndex],
          metal_name: action.payload.metal_name,
          metal_code: action.payload.metal_code,
          purity_percentage: action.payload.purity_percentage,
          rate_per_gram: action.payload.current_rate_per_gram,
          unit: action.payload.unit,
        };
      }
    },

    // Update metal rate
    updateMetalRate: (state, action: PayloadAction<{ id: number; rate: number }>) => {
      const metalType = state.metalTypes.find(m => m.id === action.payload.id);
      if (metalType) {
        metalType.current_rate_per_gram = action.payload.rate;
      }
      if (state.currentMetalType?.id === action.payload.id) {
        state.currentMetalType.current_rate_per_gram = action.payload.rate;
      }
      const rateIndex = state.currentRates.findIndex(r => r.id === action.payload.id);
      if (rateIndex !== -1) {
        state.currentRates[rateIndex].rate_per_gram = action.payload.rate;
      }
    },

    // Remove metal type from list
    removeMetalType: (state, action: PayloadAction<number>) => {
      state.metalTypes = state.metalTypes.filter(m => m.id !== action.payload);
      state.currentRates = state.currentRates.filter(r => r.id !== action.payload);
      if (state.currentMetalType?.id === action.payload) {
        state.currentMetalType = null;
      }
    },

    // Clear all metal type data
    clearMetalTypes: (state) => {
      state.metalTypes = [];
      state.currentMetalType = null;
      state.currentRates = [];
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
  setMetalTypes,
  setCurrentMetalType,
  setCurrentRates,
  addMetalType,
  updateMetalType,
  updateMetalRate,
  removeMetalType,
  clearMetalTypes,
} = metalTypeSlice.actions;

/**
 * Export reducer
 */
export default metalTypeSlice.reducer;
