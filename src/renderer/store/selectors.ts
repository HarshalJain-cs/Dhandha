/**
 * Memoized Redux Selectors
 * Performance-optimized selectors using createSelector from Redux Toolkit
 * Prevents unnecessary re-renders by memoizing computed values
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { Customer } from './slices/customerSlice';
import type { Product } from './slices/productSlice';

// ============================================================================
// Customer Selectors
// ============================================================================

/**
 * Get all customers from state
 */
const selectAllCustomers = (state: RootState) => state.customer.customers;
const selectCustomerFilters = (state: RootState) => state.customer.filters;

/**
 * Get filtered customers based on current filters
 * Memoized to prevent recalculation on every render
 */
export const selectFilteredCustomers = createSelector(
  [selectAllCustomers, selectCustomerFilters],
  (customers, filters) => {
    return customers.filter((customer) => {
      // Active status filter
      if (filters.is_active !== undefined && customer.is_active !== filters.is_active) {
        return false;
      }

      // Customer type filter
      if (filters.customer_type && customer.customer_type !== filters.customer_type) {
        return false;
      }

      // Search filter (name, code, mobile, email)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${customer.first_name} ${customer.last_name || ''}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchLower) ||
          customer.customer_code.toLowerCase().includes(searchLower) ||
          customer.mobile?.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Outstanding filter
      if (filters.has_outstanding !== undefined) {
        const hasOutstanding = customer.outstanding_balance > 0;
        if (filters.has_outstanding !== hasOutstanding) {
          return false;
        }
      }

      // City filter
      if (filters.city && customer.city !== filters.city) {
        return false;
      }

      // State filter
      if (filters.state && customer.state !== filters.state) {
        return false;
      }

      // Credit limit range
      if (filters.min_credit_limit !== undefined && customer.credit_limit < filters.min_credit_limit) {
        return false;
      }
      if (filters.max_credit_limit !== undefined && customer.credit_limit > filters.max_credit_limit) {
        return false;
      }

      return true;
    });
  }
);

/**
 * Get customers with outstanding balance
 */
export const selectCustomersWithOutstanding = createSelector(
  [selectAllCustomers],
  (customers) => customers.filter((c) => c.outstanding_balance > 0)
);

/**
 * Get total outstanding amount across all customers
 */
export const selectTotalOutstanding = createSelector(
  [selectAllCustomers],
  (customers) => customers.reduce((sum, c) => sum + c.outstanding_balance, 0)
);

/**
 * Get customer statistics
 */
export const selectCustomerStats = createSelector([selectAllCustomers], (customers) => {
  const active = customers.filter((c) => c.is_active).length;
  const inactive = customers.length - active;
  const withOutstanding = customers.filter((c) => c.outstanding_balance > 0).length;
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0);
  const avgOutstanding = withOutstanding > 0 ? totalOutstanding / withOutstanding : 0;

  return {
    total: customers.length,
    active,
    inactive,
    withOutstanding,
    totalOutstanding,
    avgOutstanding,
  };
});

// ============================================================================
// Product Selectors
// ============================================================================

const selectAllProducts = (state: RootState) => state.product.products;
const selectProductFilters = (state: RootState) => state.product.filters;

/**
 * Get filtered products based on current filters
 */
export const selectFilteredProducts = createSelector(
  [selectAllProducts, selectProductFilters],
  (products, filters) => {
    return products.filter((product) => {
      // Active status filter
      if (filters.is_active !== undefined && product.is_active !== filters.is_active) {
        return false;
      }

      // Category filter
      if (filters.category_id && product.category_id !== filters.category_id) {
        return false;
      }

      // Metal type filter
      if (filters.metal_type_id && product.metal_type_id !== filters.metal_type_id) {
        return false;
      }

      // Search filter (name, code, barcode)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          product.product_name.toLowerCase().includes(searchLower) ||
          product.product_code.toLowerCase().includes(searchLower) ||
          product.barcode?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Low stock filter
      if (filters.low_stock) {
        const isLowStock = product.current_stock > 0 && product.current_stock <= product.reorder_level;
        if (!isLowStock) return false;
      }

      // Out of stock filter
      if (filters.out_of_stock) {
        if (product.current_stock > 0) return false;
      }

      return true;
    });
  }
);

/**
 * Get products with low stock
 */
export const selectLowStockProducts = createSelector([selectAllProducts], (products) =>
  products.filter((p) => p.current_stock > 0 && p.current_stock <= p.reorder_level)
);

/**
 * Get out of stock products
 */
export const selectOutOfStockProducts = createSelector([selectAllProducts], (products) =>
  products.filter((p) => p.current_stock === 0 && p.is_active)
);

/**
 * Get total inventory value
 */
export const selectInventoryValue = createSelector([selectAllProducts], (products) =>
  products.reduce((sum, p) => sum + p.current_stock * p.unit_price, 0)
);

/**
 * Get product statistics
 */
export const selectProductStats = createSelector([selectAllProducts], (products) => {
  const active = products.filter((p) => p.is_active).length;
  const inactive = products.length - active;
  const inStock = products.filter((p) => p.current_stock > 0).length;
  const outOfStock = products.filter((p) => p.current_stock === 0 && p.is_active).length;
  const lowStock = products.filter((p) => p.current_stock > 0 && p.current_stock <= p.reorder_level)
    .length;
  const totalValue = products.reduce((sum, p) => sum + p.current_stock * p.unit_price, 0);
  const totalQuantity = products.reduce((sum, p) => sum + p.current_stock, 0);

  return {
    total: products.length,
    active,
    inactive,
    inStock,
    outOfStock,
    lowStock,
    totalValue,
    totalQuantity,
  };
});

// ============================================================================
// Invoice Selectors
// ============================================================================

const selectAllInvoices = (state: RootState) => state.invoice?.invoices || [];
const selectInvoiceFilters = (state: RootState) => state.invoice?.filters || {};

/**
 * Get filtered invoices based on current filters
 */
export const selectFilteredInvoices = createSelector(
  [selectAllInvoices, selectInvoiceFilters],
  (invoices, filters) => {
    return invoices.filter((invoice) => {
      // Payment status filter
      if (filters.payment_status && invoice.payment_status !== filters.payment_status) {
        return false;
      }

      // Customer filter
      if (filters.customer_id && invoice.customer_id !== filters.customer_id) {
        return false;
      }

      // Invoice type filter
      if (filters.invoice_type && invoice.invoice_type !== filters.invoice_type) {
        return false;
      }

      // Date range filter
      if (filters.from_date) {
        const invoiceDate = new Date(invoice.invoice_date);
        const fromDate = new Date(filters.from_date);
        if (invoiceDate < fromDate) return false;
      }

      if (filters.to_date) {
        const invoiceDate = new Date(invoice.invoice_date);
        const toDate = new Date(filters.to_date);
        if (invoiceDate > toDate) return false;
      }

      return true;
    });
  }
);

/**
 * Get pending invoices (unpaid/partially paid)
 */
export const selectPendingInvoices = createSelector([selectAllInvoices], (invoices) =>
  invoices.filter((i) => i.payment_status === 'pending' || i.payment_status === 'partial')
);

/**
 * Get invoice statistics
 */
export const selectInvoiceStats = createSelector([selectAllInvoices], (invoices) => {
  const paid = invoices.filter((i) => i.payment_status === 'paid').length;
  const pending = invoices.filter((i) => i.payment_status === 'pending').length;
  const partial = invoices.filter((i) => i.payment_status === 'partial').length;
  const totalSales = invoices.reduce((sum, i) => sum + i.grand_total, 0);
  const totalPending = invoices.reduce((sum, i) => sum + i.balance_due, 0);
  const totalPaid = totalSales - totalPending;

  return {
    total: invoices.length,
    paid,
    pending,
    partial,
    totalSales,
    totalPaid,
    totalPending,
  };
});

// ============================================================================
// Auth Selectors
// ============================================================================

/**
 * Get current user with computed properties
 */
export const selectCurrentUser = createSelector(
  [(state: RootState) => state.auth.user],
  (user) => {
    if (!user) return null;

    const nameParts = user.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      ...user,
      firstName,
      lastName,
      initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
    };
  }
);

/**
 * Check if user has specific permission
 */
export const makeSelectHasPermission = (permission: string) =>
  createSelector([(state: RootState) => state.auth.user], (user) => {
    if (!user) return false;
    // Implement permission logic based on user role_id
    // role_id 1 = admin, role_id 2 = manager (placeholder - adjust based on your permission system)
    return user.role_id === 1 || user.role_id === 2;
  });

// ============================================================================
// Dashboard Selectors
// ============================================================================

/**
 * Get complete dashboard statistics
 * Combines data from multiple slices
 */
export const selectDashboardStats = createSelector(
  [selectCustomerStats, selectProductStats, selectInvoiceStats],
  (customerStats, productStats, invoiceStats) => ({
    customers: customerStats,
    products: productStats,
    invoices: invoiceStats,
    alerts: {
      lowStock: productStats.lowStock,
      outOfStock: productStats.outOfStock,
      pendingPayments: invoiceStats.pending + invoiceStats.partial,
      customersWithOutstanding: customerStats.withOutstanding,
    },
  })
);

// ============================================================================
// Utility Selectors
// ============================================================================

/**
 * Get loading state across multiple slices
 */
export const selectIsLoading = createSelector(
  [
    (state: RootState) => state.customer.loading,
    (state: RootState) => state.product.loading,
    (state: RootState) => state.invoice?.loading || false,
  ],
  (customerLoading, productLoading, invoiceLoading) =>
    customerLoading || productLoading || invoiceLoading
);

/**
 * Get error state across multiple slices
 */
export const selectErrors = createSelector(
  [
    (state: RootState) => state.customer.error,
    (state: RootState) => state.product.error,
    (state: RootState) => state.invoice?.error || null,
  ],
  (customerError, productError, invoiceError) => {
    const errors: string[] = [];
    if (customerError) errors.push(customerError);
    if (productError) errors.push(productError);
    if (invoiceError) errors.push(invoiceError);
    return errors;
  }
);
