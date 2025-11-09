/**
 * Client-side Currency Utility
 * Provides currency formatting for the frontend
 * Reads currency configuration from .env file
 */

// Currency configuration from .env file
const CURRENCY_SYMBOL = import.meta.env.VITE_PUBLIC_CURRENCY_SYMBOL || "Rs";
const CURRENCY_CODE = import.meta.env.VITE_PUBLIC_CURRENCY_CODE || "PKR";

// Get currency symbol
export const getCurrencySymbol = (): string => {
  return CURRENCY_SYMBOL;
};

// Get currency code
export const getCurrencyCode = (): string => {
  return CURRENCY_CODE;
};

// Format amount with currency symbol
export const formatCurrency = (amount: number, includeCode: boolean = false): string => {
  // Format number with 2 decimal places
  const formattedAmount = amount.toFixed(2);
  
  if (includeCode) {
    return `${CURRENCY_SYMBOL} ${formattedAmount} ${CURRENCY_CODE}`;
  }
  
  return `${CURRENCY_SYMBOL} ${formattedAmount}`;
};

// Format amount for display (shorter version)
export const formatCurrencyShort = (amount: number): string => {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
};

// Parse currency string to number
export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbol and any non-numeric characters except decimal point
  const cleaned = currencyString
    .replace(/[^\d.-]/g, "")
    .trim();
  
  return parseFloat(cleaned) || 0;
};

// Get currency configuration object
export const getCurrencyConfig = () => {
  return {
    symbol: CURRENCY_SYMBOL,
    code: CURRENCY_CODE,
    format: (amount: number) => formatCurrency(amount),
    formatShort: (amount: number) => formatCurrencyShort(amount),
  };
};
