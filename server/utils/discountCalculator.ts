/**
 * Discount Calculator Utility
 * Handles all discount calculations for items and checkout
 * Supports both percentage and fixed amount discounts
 */

export interface DiscountConfig {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

export interface ItemWithDiscount {
  price: number;
  quantity: number;
  discount?: DiscountConfig;
}

export interface DiscountCalculationResult {
  subtotal: number;
  discountAmount: number;
  totalAfterDiscount: number;
}

/**
 * Calculate discount amount for a single item
 */
export function calculateItemDiscount(
  price: number,
  quantity: number,
  discount?: DiscountConfig
): DiscountCalculationResult {
  const subtotal = price * quantity;

  if (!discount || discount.value === 0) {
    return {
      subtotal,
      discountAmount: 0,
      totalAfterDiscount: subtotal,
    };
  }

  let discountAmount = 0;

  if (discount.type === 'percentage') {
    // Validate percentage is between 0-100
    if (discount.value < 0 || discount.value > 100) {
      throw new Error(`Invalid percentage discount: ${discount.value}. Must be between 0-100`);
    }
    discountAmount = (subtotal * discount.value) / 100;
  } else if (discount.type === 'fixed') {
    // Validate fixed discount doesn't exceed subtotal
    if (discount.value < 0) {
      throw new Error(`Invalid fixed discount: ${discount.value}. Cannot be negative`);
    }
    if (discount.value > subtotal) {
      throw new Error(
        `Invalid fixed discount: ${discount.value}. Cannot exceed item subtotal: ${subtotal}`
      );
    }
    discountAmount = discount.value;
  }

  return {
    subtotal,
    discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
    totalAfterDiscount: Math.round((subtotal - discountAmount) * 100) / 100,
  };
}

/**
 * Calculate checkout-level discount
 * Applied after all item discounts
 */
export function calculateCheckoutDiscount(
  subtotalAfterItemDiscounts: number,
  discount?: DiscountConfig
): DiscountCalculationResult {
  if (!discount || discount.value === 0) {
    return {
      subtotal: subtotalAfterItemDiscounts,
      discountAmount: 0,
      totalAfterDiscount: subtotalAfterItemDiscounts,
    };
  }

  let discountAmount = 0;

  if (discount.type === 'percentage') {
    if (discount.value < 0 || discount.value > 100) {
      throw new Error(`Invalid percentage discount: ${discount.value}. Must be between 0-100`);
    }
    discountAmount = (subtotalAfterItemDiscounts * discount.value) / 100;
  } else if (discount.type === 'fixed') {
    if (discount.value < 0) {
      throw new Error(`Invalid fixed discount: ${discount.value}. Cannot be negative`);
    }
    if (discount.value > subtotalAfterItemDiscounts) {
      throw new Error(
        `Invalid fixed discount: ${discount.value}. Cannot exceed order subtotal: ${subtotalAfterItemDiscounts}`
      );
    }
    discountAmount = discount.value;
  }

  return {
    subtotal: subtotalAfterItemDiscounts,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalAfterDiscount: Math.round((subtotalAfterItemDiscounts - discountAmount) * 100) / 100,
  };
}

/**
 * Calculate complete order total with all discounts
 */
export function calculateOrderTotal(items: ItemWithDiscount[], checkoutDiscount?: DiscountConfig) {
  let orderSubtotal = 0;
  let totalItemDiscounts = 0;

  // Calculate item subtotals and discounts
  for (const item of items) {
    const itemCalc = calculateItemDiscount(item.price, item.quantity, item.discount);
    orderSubtotal += itemCalc.subtotal;
    totalItemDiscounts += itemCalc.discountAmount;
  }

  // Calculate checkout discount
  const subtotalAfterItemDiscounts = orderSubtotal - totalItemDiscounts;
  const checkoutCalc = calculateCheckoutDiscount(subtotalAfterItemDiscounts, checkoutDiscount);

  return {
    orderSubtotal,
    totalItemDiscounts,
    subtotalAfterItemDiscounts,
    checkoutDiscountAmount: checkoutCalc.discountAmount,
    finalTotal: checkoutCalc.totalAfterDiscount,
  };
}

/**
 * Validate discount configuration
 */
export function validateDiscount(discount: DiscountConfig): { valid: boolean; error?: string } {
  if (!discount.type || !['percentage', 'fixed'].includes(discount.type)) {
    return { valid: false, error: 'Invalid discount type. Must be "percentage" or "fixed"' };
  }

  if (typeof discount.value !== 'number' || discount.value < 0) {
    return { valid: false, error: 'Discount value must be a positive number' };
  }

  if (discount.type === 'percentage' && discount.value > 100) {
    return { valid: false, error: 'Percentage discount cannot exceed 100%' };
  }

  return { valid: true };
}
