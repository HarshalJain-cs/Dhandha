import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import categoryReducer from './slices/categorySlice';
import metalTypeReducer from './slices/metalTypeSlice';
import stoneReducer from './slices/stoneSlice';
import customerReducer from './slices/customerSlice';
import invoiceReducer from './slices/invoiceSlice';
import karigarReducer from './slices/karigarSlice';
import goldLoanReducer from './slices/goldLoanSlice';
import vendorReducer from './slices/vendorSlice';
import purchaseOrderReducer from './slices/purchaseOrderSlice';
import metalRateReducer from './slices/metalRateSlice';
import salesReturnReducer from './slices/salesReturnSlice';
import quotationReducer from './slices/quotationSlice';
import auditReducer from './slices/auditSlice';
import notificationReducer from './slices/notificationSlice';
import updateReducer from './slices/updateSlice';

/**
 * Redux Store Configuration
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    category: categoryReducer,
    metalType: metalTypeReducer,
    stone: stoneReducer,
    customer: customerReducer,
    invoice: invoiceReducer,
    karigar: karigarReducer,
    goldLoan: goldLoanReducer,
    vendor: vendorReducer,
    purchaseOrder: purchaseOrderReducer,
    metalRate: metalRateReducer,
    salesReturn: salesReturnReducer,
    quotation: quotationReducer,
    audit: auditReducer,
    notification: notificationReducer,
    update: updateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setUser', 'product/setCurrentProduct'],
      },
    }),
});

/**
 * Export types
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
