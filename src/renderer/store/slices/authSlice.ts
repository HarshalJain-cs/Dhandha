import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * User Interface
 */
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  branch_id: number | null;
}

/**
 * Auth State Interface
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: 'auth',
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

    // Set user and token (login success)
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },

    // Clear user (logout)
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },

    // Update user details
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

/**
 * Export actions
 */
export const {
  setLoading,
  setError,
  setUser,
  clearUser,
  updateUser,
} = authSlice.actions;

/**
 * Export reducer
 */
export default authSlice.reducer;
