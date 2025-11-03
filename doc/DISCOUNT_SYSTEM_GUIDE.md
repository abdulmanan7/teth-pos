# Discount System Implementation Guide

## Overview
A comprehensive two-level discount system supporting both per-product and checkout-level discounts. Follows industry-standard practices used by major POS systems worldwide.

## Features

### 1. Per-Product Discounts
- Applied at individual item level
- Each product can have independent discount
- Supports:
  - **Percentage Discount**: 0-100%
  - **Fixed Amount Discount**: Any value up to item subtotal
- Includes optional reason field for tracking (e.g., "Clearance", "Damaged", "Loyalty")

### 2. Checkout-Level Discounts
- Applied after all item discounts
- Common use cases:
  - Bulk order discounts
  - Promotional codes
  - Loyalty rewards
  - Seasonal promotions
- Same format: percentage or fixed amount

## Calculation Flow

```
┌─────────────────────────────────────┐
│ Item 1: Price × Quantity = Subtotal │
├─────────────────────────────────────┤
│ Apply Item Discount (if any)        │
├─────────────────────────────────────┤
│ Item 1 Total After Discount         │
└─────────────────────────────────────┘
                  ↓
        (Repeat for all items)
                  ↓
┌─────────────────────────────────────┐
│ Order Subtotal (sum of all items)   │
├─────────────────────────────────────┤
│ Item Discount Total (sum of all)    │
├─────────────────────────────────────┤
│ Subtotal After Item Discounts       │
├─────────────────────────────────────┤
│ Apply Checkout Discount (if any)    │
├─────────────────────────────────────┤
│ FINAL TOTAL                         │
└─────────────────────────────────────┘
```

## Data Structure

### Order Item with Discount
```typescript
{
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  discountAmount?: number;      // Calculated discount
  subtotal?: number;             // price × quantity
  totalAfterDiscount?: number;   // subtotal - discount
}
```

### Order with Discounts
```typescript
{
  orderNumber: string;
  customer: string;
  items: OrderItem[];
  subtotal: number;              // Sum of all item subtotals
  itemDiscountTotal: number;      // Sum of all item discounts
  checkoutDiscount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  checkoutDiscountAmount: number; // Calculated checkout discount
  total: number;                  // Final total after all discounts
  // ... other fields
}
```

## API Integration

### Creating Order with Discounts

**Request:**
```json
{
  "orderNumber": "ORD-1234567890",
  "customer": "Walk-in",
  "items": [
    {
      "productId": "123",
      "name": "Product A",
      "price": 1000,
      "quantity": 2,
      "discount": {
        "type": "percentage",
        "value": 10,
        "reason": "Loyalty"
      }
    },
    {
      "productId": "456",
      "name": "Product B",
      "price": 500,
      "quantity": 1
    }
  ],
  "checkoutDiscount": {
    "type": "fixed",
    "value": 100,
    "reason": "Bulk Order"
  },
  "staffId": "staff123",
  "paymentMethod": "cash"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-1234567890",
    "customer": "Walk-in",
    "items": [
      {
        "productId": "123",
        "name": "Product A",
        "price": 1000,
        "quantity": 2,
        "subtotal": 2000,
        "discount": {
          "type": "percentage",
          "value": 10,
          "reason": "Loyalty"
        },
        "discountAmount": 200,
        "totalAfterDiscount": 1800
      },
      {
        "productId": "456",
        "name": "Product B",
        "price": 500,
        "quantity": 1,
        "subtotal": 500,
        "discountAmount": 0,
        "totalAfterDiscount": 500
      }
    ],
    "subtotal": 2500,
    "itemDiscountTotal": 200,
    "checkoutDiscount": {
      "type": "fixed",
      "value": 100,
      "reason": "Bulk Order"
    },
    "checkoutDiscountAmount": 100,
    "subtotalAfterDiscount": 2200,
    "totalBeforeTax": 2200,
    "taxRate": 0.05,
    "taxAmount": 110,
    "total": 2200,
    "status": "completed",
    "staffId": "staff123",
    "paymentMethod": "cash",
    "completedAt": "2025-11-03T11:48:00Z",
    "_id": "...",
    "createdAt": "2025-11-03T11:48:00Z",
    "updatedAt": "2025-11-03T11:48:00Z"
  }
}
```

## Validation Rules

### Percentage Discount
- Must be between 0-100%
- Applied as: `discountAmount = subtotal × (percentage / 100)`

### Fixed Amount Discount
- Must be non-negative
- Cannot exceed applicable subtotal
- Applied as: `discountAmount = fixedAmount`

### Checkout Discount
- Applied to subtotal after all item discounts
- Same validation rules as item discounts
- Cannot exceed order subtotal after item discounts

## UI Components

### DiscountModalComponent
Located at: `/client/components/modals/DiscountModalComponent.tsx`

Features:
- Toggle between percentage and fixed amount
- Real-time preview of discount and total
- Optional reason field
- Validation with error messages
- Dark/light theme support

Usage:
```tsx
<DiscountModalComponent
  isDarkTheme={isDarkTheme}
  itemName="Product Name"
  subtotal={1000}
  currentDiscount={existingDiscount}
  onApply={(discount) => applyDiscount(discount)}
  onClose={() => closeModal()}
/>
```

## Utility Functions

### discountCalculator.ts

**calculateItemDiscount(price, quantity, discount)**
- Calculates single item discount
- Returns: `{ subtotal, discountAmount, totalAfterDiscount }`

**calculateCheckoutDiscount(subtotalAfterItemDiscounts, discount)**
- Calculates checkout-level discount
- Returns: `{ subtotal, discountAmount, totalAfterDiscount }`

**calculateOrderTotal(items, checkoutDiscount)**
- Calculates complete order with all discounts
- Returns: `{ orderSubtotal, totalItemDiscounts, subtotalAfterItemDiscounts, checkoutDiscountAmount, finalTotal }`

**validateDiscount(discount)**
- Validates discount configuration
- Returns: `{ valid: boolean, error?: string }`

## Receipt Display

Discounts are displayed on thermal receipts:
- Item-level discounts shown per item
- Checkout discount shown separately
- Clear breakdown of all calculations

## Examples

### Example 1: Simple Item Discount
```
Product: Shirt
Price: Rs 1000
Quantity: 1
Discount: 20% (Clearance)

Subtotal: Rs 1000
Discount: -Rs 200
Total: Rs 800
```

### Example 2: Multiple Items with Different Discounts
```
Item 1: Shirt (Rs 1000 × 1) - 10% Loyalty = Rs 900
Item 2: Pants (Rs 1500 × 1) - No discount = Rs 1500
Item 3: Shoes (Rs 2000 × 1) - Rs 200 fixed = Rs 1800

Order Subtotal: Rs 4500
Item Discounts: -Rs 400
Subtotal After Items: Rs 4100
Checkout Discount: 5% Bulk = -Rs 205
FINAL TOTAL: Rs 3895
```

### Example 3: Checkout-Only Discount
```
Item 1: Product A (Rs 500 × 2) = Rs 1000
Item 2: Product B (Rs 300 × 3) = Rs 900

Order Subtotal: Rs 1900
Item Discounts: Rs 0
Subtotal After Items: Rs 1900
Checkout Discount: Rs 100 (Promotional Code) = -Rs 100
FINAL TOTAL: Rs 1800
```

## Best Practices

1. **Always validate discounts** before applying
2. **Show preview** before confirming discount
3. **Track discount reason** for auditing
4. **Round to 2 decimals** for currency
5. **Prevent negative totals** - validate discount doesn't exceed subtotal
6. **Display all discounts** clearly on receipt
7. **Log discount transactions** for reporting

## Future Enhancements

- Discount templates/presets
- Automatic discount rules based on quantity
- Discount expiry dates
- Staff-level discount limits
- Discount analytics and reporting
- Integration with loyalty programs
