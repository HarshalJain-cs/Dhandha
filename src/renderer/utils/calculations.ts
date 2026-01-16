/**
 * Calculation Utilities
 * Centralized calculation functions for invoices, gold loans, and financial operations
 */

export interface InvoiceItem {
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  gold_rate: number;
  making_charges: number;
  making_charges_type?: 'per_gram' | 'fixed' | 'percentage';
  other_charges?: number;
}

export interface InvoiceCalculation {
  gold_value: number;
  making_charges_total: number;
  other_charges: number;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_before_old_gold: number;
  old_gold_amount: number;
  final_total: number;
  round_off: number;
  rounded_total: number;
}

/**
 * Calculate gold value for an item
 * @param netWeight - Net weight in grams
 * @param goldRate - Gold rate per gram
 * @returns Gold value
 * @example calculateGoldValue(10, 6000) // 60000
 */
export const calculateGoldValue = (netWeight: number, goldRate: number): number => {
  return netWeight * goldRate;
};

/**
 * Calculate making charges based on type
 * @param item - Invoice item with making charges info
 * @param goldValue - Calculated gold value
 * @returns Making charges amount
 */
export const calculateMakingCharges = (
  item: Pick<InvoiceItem, 'net_weight' | 'making_charges' | 'making_charges_type'>,
  goldValue: number
): number => {
  const { net_weight, making_charges, making_charges_type = 'per_gram' } = item;

  switch (making_charges_type) {
    case 'per_gram':
      return net_weight * making_charges;
    case 'percentage':
      return (goldValue * making_charges) / 100;
    case 'fixed':
    default:
      return making_charges;
  }
};

/**
 * Calculate item subtotal
 * @param item - Invoice item
 * @returns Item subtotal before GST
 */
export const calculateItemSubtotal = (item: InvoiceItem): number => {
  const goldValue = calculateGoldValue(item.net_weight, item.gold_rate);
  const makingCharges = calculateMakingCharges(item, goldValue);
  return goldValue + makingCharges + (item.other_charges || 0);
};

/**
 * Calculate GST (3% = 1.5% CGST + 1.5% SGST)
 * @param taxableAmount - Amount to calculate GST on
 * @param gstRate - Total GST rate (default: 3)
 * @returns Object with CGST and SGST amounts
 */
export const calculateGST = (
  taxableAmount: number,
  gstRate: number = 3
): { cgst: number; sgst: number } => {
  const halfRate = gstRate / 2;
  const cgst = (taxableAmount * halfRate) / 100;
  const sgst = (taxableAmount * halfRate) / 100;

  return { cgst, sgst };
};

/**
 * Calculate complete invoice totals
 * @param items - Array of invoice items
 * @param oldGoldWeight - Old gold weight in grams (default: 0)
 * @param oldGoldRate - Old gold rate per gram (default: 0)
 * @returns Complete invoice calculation breakdown
 */
export const calculateInvoiceTotals = (
  items: InvoiceItem[],
  oldGoldWeight: number = 0,
  oldGoldRate: number = 0
): InvoiceCalculation => {
  let subtotal = 0;
  let cgst_total = 0;
  let sgst_total = 0;

  items.forEach((item) => {
    const itemSubtotal = calculateItemSubtotal(item);
    const { cgst, sgst } = calculateGST(itemSubtotal);

    subtotal += itemSubtotal;
    cgst_total += cgst;
    sgst_total += sgst;
  });

  const totalBeforeOldGold = subtotal + cgst_total + sgst_total;
  const oldGoldAmount = oldGoldWeight * oldGoldRate;
  const finalTotal = totalBeforeOldGold - oldGoldAmount;

  // Round off calculation
  const roundedTotal = Math.round(finalTotal);
  const roundOff = roundedTotal - finalTotal;

  return {
    gold_value: items.reduce(
      (sum, item) => sum + calculateGoldValue(item.net_weight, item.gold_rate),
      0
    ),
    making_charges_total: items.reduce((sum, item) => {
      const goldValue = calculateGoldValue(item.net_weight, item.gold_rate);
      return sum + calculateMakingCharges(item, goldValue);
    }, 0),
    other_charges: items.reduce((sum, item) => sum + (item.other_charges || 0), 0),
    subtotal,
    cgst_amount: cgst_total,
    sgst_amount: sgst_total,
    igst_amount: 0,
    total_before_old_gold: totalBeforeOldGold,
    old_gold_amount: oldGoldAmount,
    final_total: finalTotal,
    round_off: roundOff,
    rounded_total: roundedTotal,
  };
};

/**
 * Calculate net weight from gross and stone weight
 * @param grossWeight - Gross weight in grams
 * @param stoneWeight - Stone weight in grams
 * @returns Net weight
 */
export const calculateNetWeight = (grossWeight: number, stoneWeight: number): number => {
  return Math.max(0, grossWeight - stoneWeight);
};

/**
 * Calculate stone weight percentage
 * @param stoneWeight - Stone weight in grams
 * @param grossWeight - Gross weight in grams
 * @returns Stone percentage
 */
export const calculateStonePercentage = (
  stoneWeight: number,
  grossWeight: number
): number => {
  if (grossWeight === 0) return 0;
  return (stoneWeight / grossWeight) * 100;
};

/**
 * Calculate wastage amount
 * @param netWeight - Net weight in grams
 * @param wastagePercentage - Wastage percentage
 * @returns Wastage amount in grams
 */
export const calculateWastage = (netWeight: number, wastagePercentage: number): number => {
  return (netWeight * wastagePercentage) / 100;
};

/**
 * Convert grams to other units
 * @param grams - Weight in grams
 * @param unit - Target unit (mg, kg, tola, bhori)
 * @returns Converted weight
 */
export const convertWeight = (
  grams: number,
  unit: 'mg' | 'kg' | 'tola' | 'bhori'
): number => {
  const conversions = {
    mg: grams * 1000,
    kg: grams / 1000,
    tola: grams / 11.664,
    bhori: grams / 11.664, // Same as tola
  };

  return conversions[unit] || grams;
};

/**
 * Calculate fine weight (pure gold)
 * @param grossWeight - Gross weight in grams
 * @param purity - Purity factor (e.g., 0.916 for 22K gold)
 * @returns Fine weight
 */
export const calculateFineWeight = (grossWeight: number, purity: number): number => {
  return grossWeight * purity;
};

/**
 * Calculate loan amount based on gold value and LTV ratio
 * @param goldValue - Total gold value
 * @param ltvRatio - Loan-to-value ratio (0-1)
 * @returns Maximum loan amount
 */
export const calculateLoanAmount = (goldValue: number, ltvRatio: number): number => {
  return goldValue * ltvRatio;
};

/**
 * Calculate simple interest
 * @param principal - Principal amount
 * @param rate - Annual interest rate (percentage)
 * @param days - Number of days
 * @returns Interest amount
 */
export const calculateSimpleInterest = (
  principal: number,
  rate: number,
  days: number
): number => {
  return (principal * rate * days) / (100 * 365);
};

/**
 * Calculate compound interest
 * @param principal - Principal amount
 * @param rate - Annual interest rate (percentage)
 * @param timesCompounded - Number of times interest is compounded per year
 * @param years - Number of years
 * @returns Total amount including compound interest
 */
export const calculateCompoundInterest = (
  principal: number,
  rate: number,
  timesCompounded: number,
  years: number
): number => {
  return principal * Math.pow(1 + rate / (100 * timesCompounded), timesCompounded * years);
};
