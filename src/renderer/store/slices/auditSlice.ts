import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuditLog {
  log_id: number;
  user_id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity_type: string | null;
  entity_id: string | null;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: Date;
}

export interface AuditFilters {
  user_id?: number;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditState {
  logs: AuditLog[];
  entityHistory: AuditLog[];
  userActivity: AuditLog[];
  filters: AuditFilters;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  logs: [],
  entityHistory: [],
  userActivity: [],
  filters: {
    action: '',
    entity_type: '',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setLogs: (
      state,
      action: PayloadAction<{
        logs: AuditLog[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }>
    ) => {
      state.logs = action.payload.logs;
      if (action.payload.total !== undefined) state.pagination.total = action.payload.total;
      if (action.payload.page !== undefined) state.pagination.page = action.payload.page;
      if (action.payload.limit !== undefined) state.pagination.limit = action.payload.limit;
      if (action.payload.totalPages !== undefined) state.pagination.totalPages = action.payload.totalPages;
      state.loading = false;
      state.error = null;
    },

    setEntityHistory: (state, action: PayloadAction<AuditLog[]>) => {
      state.entityHistory = action.payload;
      state.loading = false;
      state.error = null;
    },

    setUserActivity: (state, action: PayloadAction<AuditLog[]>) => {
      state.userActivity = action.payload;
      state.loading = false;
      state.error = null;
    },

    setFilters: (state, action: PayloadAction<Partial<AuditFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    clearFilters: (state) => {
      state.filters = { action: '', entity_type: '' };
      state.pagination.page = 1;
    },

    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearLogs: (state) => {
      state.logs = [];
      state.entityHistory = [];
      state.userActivity = [];
      state.pagination = { page: 1, limit: 50, total: 0, totalPages: 0 };
    },
  },
});

export const {
  setLoading,
  setError,
  setLogs,
  setEntityHistory,
  setUserActivity,
  setFilters,
  clearFilters,
  setPagination,
  clearLogs,
} = auditSlice.actions;

export default auditSlice.reducer;
