/**
 * Validation Helpers
 * Business-specific validation functions beyond basic form validation
 */

/**
 * Validate weight (positive number with max 3 decimals)
 * @param value - Weight value to validate
 * @returns True if valid
 */
export const isValidWeight = (value: number): boolean => {
  if (value < 0) return false;
  const decimals = value.toString().split('.')[1];
  return !decimals || decimals.length <= 3;
};

/**
 * Validate amount (positive number with max 2 decimals)
 * @param value - Amount value to validate
 * @returns True if valid
 */
export const isValidAmount = (value: number): boolean => {
  if (value < 0) return false;
  const decimals = value.toString().split('.')[1];
  return !decimals || decimals.length <= 2;
};

/**
 * Validate invoice items
 * @param items - Array of invoice items
 * @returns Error message or null if valid
 */
export const validateInvoiceItems = (items: any[]): string | null => {
  if (items.length === 0) {
    return 'Please add at least one item';
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.item_name || item.item_name.trim() === '') {
      return `Item ${i + 1}: Name is required`;
    }

    if (!item.quantity || item.quantity <= 0) {
      return `Item ${i + 1}: Quantity must be greater than 0`;
    }

    if (!item.net_weight || item.net_weight <= 0) {
      return `Item ${i + 1}: Net weight must be greater than 0`;
    }

    if (!item.gold_rate || item.gold_rate <= 0) {
      return `Item ${i + 1}: Gold rate must be greater than 0`;
    }

    if (item.gross_weight && item.gross_weight < item.net_weight) {
      return `Item ${i + 1}: Gross weight cannot be less than net weight`;
    }
  }

  return null;
};

/**
 * Validate payment amount
 * @param paidAmount - Amount being paid
 * @param totalAmount - Total amount due
 * @returns Error message or null if valid
 */
export const validatePayment = (
  paidAmount: number,
  totalAmount: number
): string | null => {
  if (paidAmount < 0) {
    return 'Payment amount cannot be negative';
  }

  if (paidAmount > totalAmount) {
    return 'Payment amount cannot exceed total amount';
  }

  return null;
};

/**
 * Validate loan amount against gold value
 * @param loanAmount - Requested loan amount
 * @param goldValue - Total gold value
 * @param maxLtvRatio - Maximum LTV ratio (default: 0.75)
 * @returns Error message or null if valid
 */
export const validateLoanAmount = (
  loanAmount: number,
  goldValue: number,
  maxLtvRatio: number = 0.75
): string | null => {
  if (loanAmount <= 0) {
    return 'Loan amount must be greater than 0';
  }

  const maxLoan = goldValue * maxLtvRatio;
  if (loanAmount > maxLoan) {
    return `Loan amount cannot exceed ${(maxLtvRatio * 100).toFixed(0)}% of gold value (₹${maxLoan.toFixed(2)})`;
  }

  return null;
};

/**
 * Validate credit limit
 * @param creditLimit - Credit limit being set
 * @param outstandingBalance - Current outstanding balance
 * @returns Error message or null if valid
 */
export const validateCreditLimit = (
  creditLimit: number,
  outstandingBalance: number
): string | null => {
  if (creditLimit < 0) {
    return 'Credit limit cannot be negative';
  }

  if (creditLimit < outstandingBalance) {
    return `Credit limit cannot be less than current outstanding balance (₹${outstandingBalance.toFixed(2)})`;
  }

  return null;
};

/**
 * Validate stock quantity
 * @param requestedQty - Requested quantity
 * @param availableStock - Available stock
 * @returns Error message or null if valid
 */
export const validateStockQuantity = (
  requestedQty: number,
  availableStock: number
): string | null => {
  if (requestedQty <= 0) {
    return 'Quantity must be greater than 0';
  }

  if (requestedQty > availableStock) {
    return `Insufficient stock. Available: ${availableStock}`;
  }

  return null;
};

/**
 * Validate date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Error message or null if valid
 */
export const validateDateRange = (startDate: Date, endDate: Date): string | null => {
  if (startDate > endDate) {
    return 'Start date cannot be after end date';
  }

  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    return 'Date range cannot exceed 1 year';
  }

  return null;
};

/**
 * Validate metal purity
 * @param purity - Purity value (0-1)
 * @returns Error message or null if valid
 */
export const validateMetalPurity = (purity: number): string | null => {
  if (purity < 0 || purity > 1) {
    return 'Purity must be between 0 and 1';
  }

  return null;
};
