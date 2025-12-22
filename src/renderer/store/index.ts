import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

/**
 * Redux Store Configuration
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Additional reducers will be added here
    // product: productReducer,
    // customer: customerReducer,
    // invoice: invoiceReducer,
    // etc.
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser'],
      },
    }),
});

/**
 * Export types
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
