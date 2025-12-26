import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MetalRate {
  rate_id: number;
  rate_date: Date;
  gold_24k: number;
  gold_22k: number;
  gold_18k: number;
  silver: number;
  platinum: number;
  source: 'manual' | 'api';
  created_at: Date;
}

export interface MetalRateState {
  currentRates: MetalRate | null;
  historicalRates: MetalRate[];
  chartData: any[];
  loading: boolean;
  error: string | null;
}

const initialState: MetalRateState = {
  currentRates: null,
  historicalRates: [],
  chartData: [],
  loading: false,
  error: null,
};

const metalRateSlice = createSlice({
  name: 'metalRate',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setCurrentRates: (state, action: PayloadAction<MetalRate>) => {
      state.currentRates = action.payload;
      state.loading = false;
      state.error = null;
    },

    setHistoricalRates: (state, action: PayloadAction<MetalRate[]>) => {
      state.historicalRates = action.payload;
      state.loading = false;
      state.error = null;
    },

    setChartData: (state, action: PayloadAction<any[]>) => {
      state.chartData = action.payload;
      state.loading = false;
      state.error = null;
    },

    updateRate: (state, action: PayloadAction<MetalRate>) => {
      state.currentRates = action.payload;
      state.historicalRates.unshift(action.payload);
    },

    clearRates: (state) => {
      state.currentRates = null;
      state.historicalRates = [];
      state.chartData = [];
    },
  },
});

export const {
  setLoading,
  setError,
  setCurrentRates,
  setHistoricalRates,
  setChartData,
  updateRate,
  clearRates,
} = metalRateSlice.actions;

export default metalRateSlice.reducer;
