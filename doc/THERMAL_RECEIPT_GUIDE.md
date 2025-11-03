# Thermal Receipt Printer Guide

This guide explains how to integrate and use the thermal receipt printing system in your POS application.

## Overview

The thermal receipt system is optimized for 80mm thermal printers commonly used in retail environments. It includes:

- **ThermalReceipt Component** - Modal dialog for receipt preview and printing
- **Receipt Utilities** - Helper functions for generating and printing receipts
- **Branding Integration** - Automatically includes store information from branding configuration
- **Thermal Logo** - High-contrast logo optimized for thermal printers

## Files

### Components
- `client/components/receipts/ThermalReceipt.tsx` - Main receipt component

### Utilities
- `client/utils/receipt.ts` - Receipt generation and printing utilities
- `client/hooks/useBrandingConfig.ts` - Hook to fetch branding configuration

### Assets
- `client/assets/logo-thermal.svg` - Thermal printer optimized logo

### Backend
- `server/routes/branding.ts` - Branding configuration API
- `server/db/models/BrandingConfig.ts` - Branding data model

## Usage

### Method 1: Using ThermalReceipt Component (Recommended)

```tsx
import { useState } from "react";
import ThermalReceipt from "@/components/receipts/ThermalReceipt";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";
import type { Order } from "@shared/api";

export function SalesPage() {
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { config: branding } = useBrandingConfig();

  const handlePrintReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  return (
    <>
      {/* Your sales UI */}
      <button onClick={() => handlePrintReceipt(order)}>
        Print Receipt
      </button>

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && branding && (
        <ThermalReceipt
          order={selectedOrder}
          brandingConfig={{
            storeName: branding.storeName,
            phone: branding.phone,
            city: branding.city,
            email: branding.email,
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
}
```

### Method 2: Using Receipt Utilities

```tsx
import { generateThermalReceiptHTML, printThermalReceipt } from "@/utils/receipt";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";
import type { Order } from "@shared/api";

export function printOrder(order: Order) {
  const { config: branding } = useBrandingConfig();

  if (!branding) return;

  const html = generateThermalReceiptHTML(order, {
    storeName: branding.storeName,
    phone: branding.phone,
    city: branding.city,
    email: branding.email,
  });

  printThermalReceipt(html);
}
```

## Receipt Format

The thermal receipt includes:

1. **Logo** - Thermal printer optimized logo at the top
2. **Store Information** - Store name, phone, and city
3. **Receipt Header** - "SALES RECEIPT" title
4. **Receipt Details** - Receipt number, date, customer, cashier
5. **Items List** - Product name, quantity, price, and total for each item
6. **Totals** - Order total and payment method
7. **Footer** - Thank you message
8. **Timestamp** - Print timestamp

## Branding Configuration

Before printing receipts, configure your store branding:

1. Go to Admin Panel → Store Branding
2. Fill in:
   - Store Name
   - Phone Number
   - City
   - Email (optional)
   - Full address and business details

The receipt will automatically use this information.

## Thermal Printer Setup

### Printer Configuration

1. **Paper Width**: 80mm (standard thermal paper)
2. **DPI**: 96 (standard screen DPI)
3. **Font**: Monospace (for alignment)
4. **Contrast**: High (for thermal printing)

### Printer Drivers

- **Windows**: Install manufacturer's driver (Zebra, Star, Epson, etc.)
- **Mac**: Use system printer settings
- **Linux**: CUPS printer support

### Testing

1. Click "Print Receipt" button
2. Select your thermal printer from the print dialog
3. Verify alignment and formatting
4. Adjust margins if needed in print settings

## Customization

### Changing Logo

Replace `/client/assets/logo-thermal.svg` with your own thermal-optimized logo:

```svg
<svg width="200" height="60" viewBox="0 0 200 60">
  <!-- Your logo design -->
</svg>
```

### Changing Receipt Width

Edit `RECEIPT_WIDTH` in `ThermalReceipt.tsx` or `receipt.ts`:

```typescript
const RECEIPT_WIDTH = 384; // 80mm at 96dpi
// For 58mm: const RECEIPT_WIDTH = 280;
// For 100mm: const RECEIPT_WIDTH = 480;
```

### Adding Custom Fields

Modify the receipt HTML template in `generateThermalReceiptHTML()`:

```typescript
// Add custom field to receipt details
<div class="detail-row">
  <span>Order Type:</span>
  <span>${order.orderType || "Standard"}</span>
</div>
```

## API Endpoints

### Get Branding Configuration

```
GET /api/branding/config
```

Response:
```json
{
  "_id": "...",
  "storeName": "My Store",
  "phone": "+1-234-567-8900",
  "email": "info@mystore.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "website": "https://mystore.com",
  "taxId": "12-3456789",
  "businessLicense": "BL-123456",
  "description": "Your store description"
}
```

### Save Branding Configuration

```
POST /api/branding/config
Content-Type: application/json

{
  "storeName": "My Store",
  "phone": "+1-234-567-8900",
  "email": "info@mystore.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA"
}
```

## Troubleshooting

### Receipt Not Printing

1. Check printer is connected and online
2. Verify printer is selected in print dialog
3. Check browser console for errors
4. Try printing a test page from system settings

### Poor Print Quality

1. Clean thermal printer head
2. Adjust print darkness in printer settings
3. Use high-quality thermal paper
4. Check paper alignment

### Alignment Issues

1. Adjust margins in print settings
2. Modify `RECEIPT_WIDTH` value
3. Check printer paper width setting
4. Test with different paper sizes

### Missing Information

1. Verify branding configuration is saved
2. Check order data includes all required fields
3. Verify API endpoints are working
4. Check browser network tab for failed requests

## Best Practices

1. **Always preview** - Use the receipt preview before printing
2. **Test first** - Print a test receipt before going live
3. **Keep it simple** - Thermal printers have limited formatting options
4. **Use monospace fonts** - Ensures proper alignment
5. **High contrast** - Use black on white for best results
6. **Regular maintenance** - Clean printer regularly for best quality

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check server logs for API errors
4. Verify printer driver is installed correctly
