# Currency Configuration Guide

## Overview
The application uses a centralized currency utility system that reads configuration from the `.env` file. This ensures consistent currency formatting across the entire application.

## Configuration

### Environment Variables (.env)
```env
# Currency Configuration
CURRENCY_SYMBOL=Rs
CURRENCY_CODE=PKR
```

## Usage

### Server-Side (Node.js)

Import from `server/utils/currencyUtils.ts`:

```typescript
import {
  getCurrencySymbol,
  getCurrencyCode,
  formatCurrency,
  parseCurrency,
  getCurrencyConfig,
} from "../utils/currencyUtils";

// Get currency symbol
const symbol = getCurrencySymbol(); // "Rs"

// Get currency code
const code = getCurrencyCode(); // "PKR"

// Format amount with currency
const formatted = formatCurrency(1234.56); // "Rs 1234.56"

// Format with code
const withCode = formatCurrency(1234.56, true); // "Rs 1234.56 PKR"

// Parse currency string to number
const amount = parseCurrency("Rs 1234.56"); // 1234.56

// Get full config object
const config = getCurrencyConfig();
// { symbol: "Rs", code: "PKR", format: (amount) => "Rs X.XX" }
```

### Client-Side (React)

Import from `client/utils`:

```typescript
import {
  getCurrencySymbol,
  getCurrencyCode,
  formatCurrencyNew,
  formatCurrencyShort,
  parseCurrency,
  getCurrencyConfig,
} from "@/utils";

// Get currency symbol
const symbol = getCurrencySymbol(); // "Rs"

// Format amount (full format)
const formatted = formatCurrencyNew(1234.56); // "Rs 1234.56"

// Format amount (short format)
const short = formatCurrencyShort(1234.56); // "Rs 1234.56"

// Parse currency string
const amount = parseCurrency("Rs 1234.56"); // 1234.56

// Get config
const config = getCurrencyConfig();
```

## Examples

### In React Components

```typescript
import { formatCurrencyNew, getCurrencySymbol } from "@/utils";

export function OrderTotal({ total }: { total: number }) {
  return (
    <div className="text-lg font-bold">
      Total: {formatCurrencyNew(total)}
    </div>
  );
}

// Usage
<OrderTotal total={1234.56} /> // Displays: "Total: Rs 1234.56"
```

### In API Responses

```typescript
import { formatCurrency } from "../utils/currencyUtils";

export const getOrderSummary: RequestHandler = async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  res.json({
    orderNumber: order.orderNumber,
    total: order.total,
    totalFormatted: formatCurrency(order.total),
  });
};
```

### In Calculations

```typescript
import { formatCurrency, parseCurrency } from "../utils/currencyUtils";

// Calculate discount
const originalPrice = 1000;
const discountPercent = 10;
const discountAmount = (originalPrice * discountPercent) / 100;
const finalPrice = originalPrice - discountAmount;

console.log(`Original: ${formatCurrency(originalPrice)}`);
console.log(`Discount: ${formatCurrency(discountAmount)}`);
console.log(`Final: ${formatCurrency(finalPrice)}`);
```

## Changing Currency

To change the currency symbol and code:

1. Update `.env` file:
```env
CURRENCY_SYMBOL=$
CURRENCY_CODE=USD
```

2. Update client-side hardcoded values in `client/utils/currencyUtils.ts`:
```typescript
const CURRENCY_SYMBOL = "$";
const CURRENCY_CODE = "USD";
```

3. Restart the development server

## Best Practices

1. **Always use the utility functions** instead of hardcoding "Rs"
2. **Use `formatCurrencyNew` in React** components for consistency
3. **Use `formatCurrency` on the server** for API responses
4. **Use `parseCurrency`** when converting user input to numbers
5. **Keep `.env` and client constants in sync** for consistency

## Files

- **Server utility**: `/server/utils/currencyUtils.ts`
- **Client utility**: `/client/utils/currencyUtils.ts`
- **Shared types**: `/shared/api.ts` (CurrencyConfig interface)
- **Configuration**: `/.env`

## Notes

- Server utility reads from environment variables (dynamic)
- Client utility uses hardcoded values (static at build time)
- Both should be kept in sync for consistency
- The old `formatCurrency` in `calculations.ts` is deprecated but kept for backward compatibility
