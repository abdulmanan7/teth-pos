/**
 * Calculation utilities for common math operations
 */

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TotalCalculation {
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calculate subtotal, tax, and total from cart items
 * @param items - Cart items to calculate
 * @param taxRate - Tax rate as decimal (0.1 = 10%, 0 = 0% no tax)
 */
export const calculateTotals = (
  items: CartItem[],
  taxRate: number = 0
): TotalCalculation => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Format number as currency
 */
export const formatCurrency = (amount: number): string => {
  return `Rs ${amount.toFixed(2)}`;
};

/**
 * Calculate discount
 */
export const calculateDiscount = (
  originalPrice: number,
  discountPercent: number
): number => {
  return Math.round((originalPrice * (1 - discountPercent / 100)) * 100) / 100;
};
