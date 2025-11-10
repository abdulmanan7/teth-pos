# Product Batch Management System

## Problem Statement
A single product can be ordered in multiple quantities with **different expiry dates**:
- Order 10 units of Milk
- 3 units expire Dec 9, 2025
- 7 units expire Dec 15, 2025

The system needs to track each batch separately while maintaining the product's total stock.

## Solution: ProductBatch Model

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCT                              │
│  (Milk - Total Stock: 10 units)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │  BATCH 1       │         │  BATCH 2       │
        │  Qty: 3        │         │  Qty: 7        │
        │  Exp: Dec 9    │         │  Exp: Dec 15   │
        │  Status: Active│         │  Status: Active│
        └────────────────┘         └────────────────┘
```

### Database Schema

#### ProductBatch Collection
```javascript
{
  _id: ObjectId,
  product_id: "milk-123",
  warehouse_id: "warehouse-1",
  batch_number: "BATCH-MILK-ABC123-XYZ",  // Auto-generated
  
  // Quantity Tracking
  quantity: 3,                             // Current stock
  original_quantity: 3,                    // Original received
  
  // Expiry Information
  expiry_date: Date,                       // 2025-12-09
  manufacture_date: Date,                  // 2025-11-09
  
  // Optional Lot Tracking
  lot_id: "lot-456",                       // If using formal lots
  
  // Purchase Information
  purchase_date: Date,                     // 2025-11-09
  cost_per_unit: 50,                       // For accounting
  supplier_id: "supplier-1",               // Which supplier
  
  // Status Management
  status: "active",                        // active | expired | quarantined | sold_out
  notes: "String",
  created_by: "user-1",
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

## Real-World Workflow

### Step 1: Receive Stock from Market
```bash
POST /api/inventory/product-batches
{
  "product_id": "milk-123",
  "warehouse_id": "warehouse-1",
  "quantity": 3,
  "expiry_date": "2025-12-09",
  "cost_per_unit": 50,
  "supplier_id": "market-a"
}

Response:
{
  "batch_number": "BATCH-MILK-ABC123-XYZ",
  "quantity": 3,
  "expiry_date": "2025-12-09"
}
```

### Step 2: Receive More Stock (Different Expiry)
```bash
POST /api/inventory/product-batches
{
  "product_id": "milk-123",
  "warehouse_id": "warehouse-1",
  "quantity": 7,
  "expiry_date": "2025-12-15",
  "cost_per_unit": 50,
  "supplier_id": "market-a"
}

Response:
{
  "batch_number": "BATCH-MILK-ABC123-PQR",
  "quantity": 7,
  "expiry_date": "2025-12-15"
}
```

### Step 3: View All Batches for Product
```bash
GET /api/inventory/product-batches/product/milk-123

Response:
[
  {
    "batch_number": "BATCH-MILK-ABC123-XYZ",
    "quantity": 3,
    "expiry_date": "2025-12-09",
    "status": "active"
  },
  {
    "batch_number": "BATCH-MILK-ABC123-PQR",
    "quantity": 7,
    "expiry_date": "2025-12-15",
    "status": "active"
  }
]
```

### Step 4: Get FIFO Order (Sell Earliest First)
```bash
GET /api/inventory/product-batches/fifo/milk-123

Response (sorted by expiry_date):
[
  {
    "batch_number": "BATCH-MILK-ABC123-XYZ",
    "quantity": 3,
    "expiry_date": "2025-12-09"  // Sell this first!
  },
  {
    "batch_number": "BATCH-MILK-ABC123-PQR",
    "quantity": 7,
    "expiry_date": "2025-12-15"
  }
]
```

### Step 5: Sell Items from Batch
```bash
PUT /api/inventory/product-batches/BATCH-MILK-ABC123-XYZ/quantity
{
  "quantity_sold": 2,
  "reason": "Sold to customer"
}

Response:
{
  "batch_number": "BATCH-MILK-ABC123-XYZ",
  "quantity": 1,  // 3 - 2 = 1
  "status": "active"
}
```

### Step 6: Monitor Expiry
```bash
GET /api/inventory/product-batches/expiring

Response:
[
  {
    "batch_number": "BATCH-MILK-ABC123-XYZ",
    "quantity": 1,
    "expiry_date": "2025-12-09",  // Expires in 2 days!
    "days_until_expiry": 2
  }
]
```

### Step 7: Get Batch Summary
```bash
GET /api/inventory/product-batches/summary/milk-123

Response:
{
  "product": {
    "id": "milk-123",
    "name": "Milk",
    "total_stock": 8  // 1 + 7
  },
  "batches": {
    "total_batches": 2,
    "active_batches": 2
  },
  "inventory": {
    "total_quantity": 8,
    "expired_quantity": 0,
    "expiring_soon_quantity": 1,  // Expires within 30 days
    "healthy_quantity": 7
  }
}
```

## API Reference

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/inventory/product-batches` | Create new batch |
| GET | `/api/inventory/product-batches/product/:productId` | Get all batches for product |
| GET | `/api/inventory/product-batches/fifo/:productId` | Get FIFO order (earliest expiry first) |
| GET | `/api/inventory/product-batches/summary/:productId` | Get batch summary |
| GET | `/api/inventory/product-batches/expired` | Get all expired batches |
| GET | `/api/inventory/product-batches/expiring` | Get batches expiring soon (30 days) |
| GET | `/api/inventory/product-batches/:batchId` | Get specific batch |
| PUT | `/api/inventory/product-batches/:batchId/quantity` | Update quantity (when sold) |
| PUT | `/api/inventory/product-batches/:batchId/status` | Update status |
| GET | `/api/inventory/warehouse/:warehouseId/batches` | Get warehouse inventory |

## Integration Points

### With Lot Numbers
- If using formal lot tracking: Set `lot_id` when creating batch
- If using open market: Leave `lot_id` empty
- Both systems can coexist

### With Orders
- When customer orders: Deduct from FIFO batch (earliest expiry)
- When batch quantity reaches 0: Automatically mark as `sold_out`
- Track which batch was used for which order

### With Accounting
- `cost_per_unit` used for inventory valuation
- Batch value = `quantity × cost_per_unit`
- Supports FIFO, LIFO, or weighted average costing

### With Stock Adjustments
- Adjust specific batch quantities
- Mark batches as expired or quarantined
- Track adjustment history per batch

## Status Lifecycle

```
┌─────────┐
│ active  │  ◄─── Batch is in stock and available
└────┬────┘
     │
     ├──► expired      (Expiry date passed)
     ├──► quarantined  (Quality issue)
     └──► sold_out     (Quantity = 0)
```

## Key Features

### 1. FIFO Support
- Automatically sorts batches by expiry date
- Ensures earliest expiry is sold first
- Reduces waste and spoilage

### 2. Multi-Expiry Tracking
- Same product, different batches, different expiries
- Flexible for open market purchases
- Supports formal lot tracking too

### 3. Warehouse Awareness
- Track batches by warehouse
- View warehouse inventory with batch details
- Support for multi-warehouse operations

### 4. Accounting Integration
- Cost per unit tracking
- Inventory valuation support
- Batch-level costing

### 5. Status Management
- Active, expired, quarantined, sold_out
- Easy status updates
- Audit trail with notes

## Example Scenarios

### Scenario 1: Open Market Purchases
```
Buy 10 Yogurts from market:
- 5 expire Dec 10 → Batch 1
- 5 expire Dec 17 → Batch 2

System tracks both separately
FIFO ensures Dec 10 batch sells first
```

### Scenario 2: Formal Lot Tracking
```
Receive PO with lot numbers:
- Lot ABC123 (5 units) → Batch 1
- Lot XYZ789 (5 units) → Batch 2

Batches linked to lots for traceability
```

### Scenario 3: Supplier Comparison
```
Same product from different suppliers:
- Supplier A: 10 units, expires Dec 20
- Supplier B: 10 units, expires Dec 25

Track supplier performance
Compare quality and shelf life
```

## Performance Considerations

### Indexes
- `product_id + warehouse_id + status`
- `product_id + expiry_date`
- `warehouse_id + status`
- `expiry_date + status`

### Query Optimization
- FIFO queries use index on expiry_date
- Warehouse queries use index on warehouse_id
- Status queries use index on status

## Future Enhancements

1. **Batch History**: Track all movements of a batch
2. **Batch Alerts**: Auto-alert when batch expires
3. **Batch Discounts**: Apply discounts to expiring batches
4. **Batch Merging**: Merge similar batches
5. **Batch Splitting**: Split batch when partially sold
6. **Batch Traceability**: Full audit trail
7. **Batch Analytics**: Supplier performance, shelf life analysis

## Migration Guide

### From Product-Only to Batch System
```
1. Create batches for existing stock
2. Link to lot numbers if available
3. Set expiry dates
4. Migrate transactions to batch level
5. Update order fulfillment to use FIFO
```

### From Lot-Only to Batch System
```
1. Create batches from lot numbers
2. Link batch_id to lot_id
3. Maintain backward compatibility
4. Gradually migrate to batch-based queries
```
