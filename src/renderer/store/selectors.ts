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
      if (filters.metal_type && product.metal_type !== filters.metal_type) {
        return false;
      }

      // Search filter (name, code, SKU, barcode)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          product.product_name.toLowerCase().includes(searchLower) ||
          product.product_code.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.barcode?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Stock status filter
      if (filters.stock_status) {
        const inStock = product.stock_quantity > 0;
        const lowStock = product.stock_quantity <= product.reorder_level;

        if (filters.stock_status === 'in_stock' && !inStock) return false;
        if (filters.stock_status === 'out_of_stock' && inStock) return false;
        if (filters.stock_status === 'low_stock' && (!inStock || !lowStock)) return false;
      }

      return true;
    });
  }
);

/**
 * Get products with low stock
 */
export const selectLowStockProducts = createSelector([selectAllProducts], (products) =>
  products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level)
);

/**
 * Get out of stock products
 */
export const selectOutOfStockProducts = createSelector([selectAllProducts], (products) =>
  products.filter((p) => p.stock_quantity === 0 && p.is_active)
);

/**
 * Get total inventory value
 */
export const selectInventoryValue = createSelector([selectAllProducts], (products) =>
  products.reduce((sum, p) => sum + p.stock_quantity * p.cost_price, 0)
);

/**
 * Get product statistics
 */
export const selectProductStats = createSelector([selectAllProducts], (products) => {
  const active = products.filter((p) => p.is_active).length;
  const inactive = products.length - active;
  const inStock = products.filter((p) => p.stock_quantity > 0).length;
  const outOfStock = products.filter((p) => p.stock_quantity === 0 && p.is_active).length;
  const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level)
    .length;
  const totalValue = products.reduce((sum, p) => sum + p.stock_quantity * p.cost_price, 0);
  const totalQuantity = products.reduce((sum, p) => sum + p.stock_quantity, 0);

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
      // Status filter
      if (filters.status && invoice.payment_status !== filters.status) {
        return false;
      }

      // Customer filter
      if (filters.customer_id && invoice.customer_id !== filters.customer_id) {
        return false;
      }

      // Search filter (invoice number, customer name)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchLower);
        // Note: Customer name matching would require customer data to be included
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.start_date) {
        const invoiceDate = new Date(invoice.invoice_date);
        const startDate = new Date(filters.start_date);
        if (invoiceDate < startDate) return false;
      }

      if (filters.end_date) {
        const invoiceDate = new Date(invoice.invoice_date);
        const endDate = new Date(filters.end_date);
        if (invoiceDate > endDate) return false;
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
  const totalSales = invoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
  const totalPending = totalSales - totalPaid;

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

    return {
      ...user,
      fullName: `${user.first_name} ${user.last_name || ''}`,
      initials: `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase(),
    };
  }
);

/**
 * Check if user has specific permission
 */
export const makeSelectHasPermission = (permission: string) =>
  createSelector([(state: RootState) => state.auth.user], (user) => {
    if (!user) return false;
    // Implement permission logic based on user role
    // This is a placeholder - adjust based on your permission system
    return user.role === 'admin' || user.role === 'manager';
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
