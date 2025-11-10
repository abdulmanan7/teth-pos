# Direct Market Purchases Feature

## Overview
The Direct Market Purchases feature allows salespersons to quickly record items purchased directly from the market without creating a formal Purchase Order. This is ideal for businesses that buy items from open markets, local vendors, or farmers on a weekly basis.

## Problem It Solves
- **No PO Required**: Skip the formal purchase order process for informal market purchases
- **Quick Entry**: Fast data entry for items picked up from the market
- **Batch Tracking**: Automatically creates batches for expiry tracking
- **Multi-Expiry Support**: Handle different expiry dates for the same product in one purchase

## Key Features

### 1. Quick Purchase Recording
- Record items directly to inventory without PO
- No vendor setup required (can use generic "Open Market")
- Immediate batch creation for expiry tracking

### 2. Automatic Batch Creation
- Each item creates a batch automatically
- Batches track:
  - Quantity
  - Expiry date
  - Manufacture date
  - Cost per unit
  - Supplier information

### 3. Multi-Expiry Support
```
Example: Buy 10 Milk items
- 3 items expire Dec 9 → Batch 1
- 7 items expire Dec 15 → Batch 2
Both tracked separately for FIFO selling
```

### 4. Warehouse Management
- Assign purchases to specific warehouses
- Track inventory by location
- Support multi-warehouse operations

## User Interface

### Main Screen
- **Header**: "Direct Market Purchases" with shopping cart icon
- **Info Box**: Explains the feature and use cases
- **Search**: Filter purchases by number, supplier, warehouse, or amount
- **Add Button**: "Record Purchase" button to create new purchase

### Purchase List
Each purchase card shows:
- Purchase number (auto-generated: MKT-TIMESTAMP-RANDOM)
- Supplier name (defaults to "Market")
- Warehouse location
- Total amount
- Purchase date
- Expandable items list with expiry dates

### Create Purchase Form
**Required Fields:**
- Warehouse (dropdown)
- Items (at least one)
  - Product (dropdown)
  - Quantity
  - Cost per unit

**Optional Fields:**
- Supplier name
- Purchased by (staff name)
- Expiry date (per item)
- Manufacture date (per item)
- Notes

## API Endpoints

### Create Market Purchase
```
POST /api/market-purchases
```

**Request:**
```json
{
  "warehouse_id": "warehouse-1",
  "supplier_name": "Market A",
  "purchased_by": "John Doe",
  "items": [
    {
      "product_id": "milk-123",
      "quantity": 3,
      "cost_per_unit": 50,
      "expiry_date": "2025-12-09",
      "manufacture_date": "2025-11-09",
      "notes": "Fresh milk"
    },
    {
      "product_id": "milk-123",
      "quantity": 7,
      "cost_per_unit": 50,
      "expiry_date": "2025-12-15",
      "manufacture_date": "2025-11-09"
    }
  ],
  "notes": "Weekly market purchase"
}
```

**Response:**
```json
{
  "success": true,
  "purchase": {
    "purchase_number": "MKT-ABC123-XYZ",
    "warehouse_id": "warehouse-1",
    "supplier_name": "Market A",
    "items": [...],
    "total_amount": 500,
    "purchase_date": "2025-11-09T10:30:00Z"
  },
  "batches_created": 2,
  "message": "Market purchase recorded successfully! 2 batch(es) created."
}
```

### Get All Market Purchases
```
GET /api/market-purchases
```

Returns list of all market purchases grouped by date.

### Delete Market Purchase
```
DELETE /api/market-purchases/:id
```

Deletes a market purchase record.

## Workflow Example

### Step 1: Salesperson Goes to Market
- Buys 10 units of Milk
- 3 units expire Dec 9
- 7 units expire Dec 15

### Step 2: Record Purchase in System
1. Open Admin Panel → Market Purchases
2. Click "Record Purchase"
3. Select Warehouse: "Main Store"
4. Supplier: "Market A"
5. Purchased by: "Ahmed"

### Step 3: Add Items
**Item 1:**
- Product: Milk
- Quantity: 3
- Cost/Unit: 50
- Expiry: 2025-12-09

**Item 2:**
- Product: Milk
- Quantity: 7
- Cost/Unit: 50
- Expiry: 2025-12-15

### Step 4: Submit
- System creates 2 batches automatically
- Stock updated: Milk +10 units
- Expiry tracking enabled
- Purchase recorded with timestamp

### Step 5: Selling (FIFO)
When customer buys Milk:
1. System checks batches (earliest expiry first)
2. Sells from Batch 1 (expires Dec 9) first
3. Then sells from Batch 2 (expires Dec 15)
4. Reduces batch quantities automatically

## Integration Points

### With Product Batches
- Each item creates a ProductBatch record
- Batches track expiry dates
- Enables FIFO selling
- Supports batch-level operations

### With Inventory
- Product stock updated immediately
- No separate goods receipt needed
- Direct inventory increase

### With Accounting
- Cost per unit recorded for valuation
- Can be used for inventory costing
- Supports FIFO/LIFO calculations

### With Expiry Tracking
- Batches monitored for expiry
- Alerts generated for expiring items
- Supports expiry notifications

## Benefits

### For Salespersons
- ✅ Quick data entry (no PO process)
- ✅ No vendor setup required
- ✅ Immediate inventory update
- ✅ Track expiry dates per batch

### For Business
- ✅ Simplified procurement for informal purchases
- ✅ Better expiry management
- ✅ FIFO selling support
- ✅ Reduced paperwork

### For Inventory
- ✅ Automatic batch creation
- ✅ Multi-expiry support
- ✅ Warehouse tracking
- ✅ Cost tracking per batch

## Comparison: Market Purchase vs Purchase Order

| Feature | Market Purchase | Purchase Order |
|---------|-----------------|----------------|
| Setup | Quick | Formal |
| Vendor Required | No | Yes |
| Goods Receipt | Not needed | Required |
| Batch Creation | Automatic | Manual |
| Expiry Tracking | Built-in | Optional |
| Best For | Informal purchases | Formal suppliers |
| Speed | Fast | Slower |

## Best Practices

### 1. Consistent Supplier Names
Use consistent names for market purchases:
- "Market A", "Market B"
- "Local Vendor", "Farmer"
- "Wholesale Market"

### 2. Record Expiry Dates
Always enter expiry dates for perishable items:
- Enables automatic alerts
- Supports FIFO selling
- Prevents waste

### 3. Use Warehouse Codes
Assign to correct warehouse:
- Main Store
- Branch 1
- Storage

### 4. Document Notes
Add notes for tracking:
- "Fresh batch"
- "Premium quality"
- "Bulk purchase"

## Troubleshooting

### Issue: Batch not created
- **Cause**: Product not found
- **Solution**: Ensure product exists in system

### Issue: Wrong expiry date
- **Cause**: Date entry error
- **Solution**: Edit batch manually via Product Batches

### Issue: Stock not updated
- **Cause**: System error
- **Solution**: Check server logs, retry purchase

## Future Enhancements

1. **Bulk Upload**: CSV import for multiple purchases
2. **Supplier Ratings**: Rate suppliers by quality
3. **Price History**: Track price trends over time
4. **Batch Merging**: Combine similar batches
5. **Auto-Alerts**: Alert when expiry approaching
6. **Mobile App**: Mobile purchase recording
7. **Barcode Scanning**: Scan products during entry
8. **Photo Upload**: Attach receipt photos

## Related Features

- **Product Batches**: Detailed batch management
- **Expiry Notifications**: Monitor expiring items
- **Stock Adjustments**: Adjust batch quantities
- **FIFO Selling**: Automatic earliest-expiry-first
- **Inventory Analytics**: Track purchase patterns

## Support

For issues or questions:
1. Check the Product Batches documentation
2. Review Expiry Tracking guide
3. Contact system administrator
