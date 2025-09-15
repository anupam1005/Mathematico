/**
 * Currency formatting utilities for INR (Indian Rupees)
 */

/**
 * Format a number as INR currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatINR = (
  amount: number, 
  options: Intl.NumberFormatOptions = {}
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };

  return new Intl.NumberFormat('en-IN', defaultOptions).format(amount);
};

/**
 * Format a number as INR with symbol only (no currency code)
 * @param amount - The amount to format
 * @returns Formatted currency string with ₹ symbol
 */
export const formatINRSymbol = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Format a number as INR for display in tables and cards
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatINRDisplay = (amount: number): string => {
  if (amount === 0) return 'Free';
  return formatINRSymbol(amount);
};

/**
 * Format a price range (original price and discounted price)
 * @param originalPrice - The original price
 * @param currentPrice - The current/discounted price
 * @returns Formatted price range string
 */
export const formatPriceRange = (originalPrice: number, currentPrice: number): string => {
  if (originalPrice === currentPrice) {
    return formatINRDisplay(currentPrice);
  }
  
  return `${formatINRDisplay(currentPrice)} <span class="line-through text-muted-foreground">${formatINRDisplay(originalPrice)}</span>`;
};

/**
 * Calculate and format savings amount
 * @param originalPrice - The original price
 * @param currentPrice - The current/discounted price
 * @returns Formatted savings string
 */
export const formatSavings = (originalPrice: number, currentPrice: number): string => {
  const savings = originalPrice - currentPrice;
  if (savings <= 0) return '';
  
  return `Save ${formatINRDisplay(savings)}`;
};
