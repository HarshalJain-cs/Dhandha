/**
 * Format Utilities
 * Centralized formatting functions for consistent display across the application
 */

/**
 * Format currency in INR
 * @param amount - Amount to format
 * @returns Formatted currency string with ₹ symbol
 * @example formatCurrency(1234.56) // "₹1,234.56"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with Indian numbering system
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * @example formatNumber(1234567.89, 2) // "12,34,567.89"
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format weight (grams)
 * @param grams - Weight in grams
 * @returns Formatted weight string with "g" suffix
 * @example formatWeight(123.456) // "123.456g"
 */
export const formatWeight = (grams: number): string => {
  return `${formatNumber(grams, 3)}g`;
};

/**
 * Format date
 * @param date - Date to format (Date object or ISO string)
 * @param format - Format type: 'short' or 'long'
 * @returns Formatted date string
 * @example formatDate(new Date(), 'short') // "24/01/2026"
 * @example formatDate(new Date(), 'long') // "24 January 2026"
 */
export const formatDate = (
  date: Date | string,
  format: 'short' | 'long' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('en-IN');
};

/**
 * Format date for input[type="date"]
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 * @example formatDateForInput(new Date()) // "2026-01-24"
 */
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Parse Indian number format (handles lakhs, crores)
 * @param str - Number string with commas
 * @returns Parsed number
 * @example parseIndianNumber("12,34,567.89") // 1234567.89
 */
export const parseIndianNumber = (str: string): number => {
  return parseFloat(str.replace(/,/g, '')) || 0;
};

/**
 * Format percentage
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 * @example formatPercentage(12.5) // "12.50%"
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 * @example formatPhone("9876543210") // "98765-43210"
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{5})(\d{5})/, '$1-$2');
  }

  return phone;
};

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 * @example truncate("Hello World", 5) // "Hello..."
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 * @example getInitials("John Doe") // "JD"
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Format time ago (relative time)
 * @param date - Date to compare against now
 * @returns Human-readable relative time string
 * @example formatTimeAgo(new Date(Date.now() - 60000)) // "1 minute ago"
 */
export const formatTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return formatDate(dateObj, 'short');
};

/**
 * Format license key in groups
 * @param key - License key string
 * @returns Formatted license key
 * @example formatLicenseKey("ABCD1234EFGH5678") // "ABCD-1234-EFGH-5678"
 */
export const formatLicenseKey = (key: string): string => {
  return key.replace(/(.{4})/g, '$1-').slice(0, -1);
};
