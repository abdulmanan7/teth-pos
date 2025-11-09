/**
 * Currency Utility
 * Provides centralized currency configuration and formatting
 * Reads from .env file: CURRENCY_SYMBOL and CURRENCY_CODE
 */

import "dotenv/config";

// Get currency symbol from environment
export const getCurrencySymbol = (): string => {
  const symbol = process.env.CURRENCY_SYMBOL;
  if (!symbol) {
    console.warn("CURRENCY_SYMBOL not set in .env, using default 'Rs'");
  }
  return symbol || "Rs";
};

// Get currency code from environment
export const getCurrencyCode = (): string => {
  const code = process.env.CURRENCY_CODE;
  if (!code) {
    console.warn("CURRENCY_CODE not set in .env, using default 'PKR'");
  }
  return code || "PKR";
};

// Format amount with currency symbol
export const formatCurrency = (amount: number, includeCode: boolean = false): string => {
  const symbol = getCurrencySymbol();
  const code = getCurrencyCode();
  
  // Format number with 2 decimal places
  const formattedAmount = amount.toFixed(2);
  
  if (includeCode) {
    return `${symbol} ${formattedAmount} ${code}`;
  }
  
  return `${symbol} ${formattedAmount}`;
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
    symbol: getCurrencySymbol(),
    code: getCurrencyCode(),
    format: (amount: number) => formatCurrency(amount),
  };
};
