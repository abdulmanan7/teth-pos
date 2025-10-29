# Goods Receipt (GR) Workflow - Complete Implementation ✅

## Problem Solved

**Before:** Direct inventory update on PO "received" status
- ❌ No support for partial receipts
- ❌ No quality checks
- ❌ No barcode scanning
- ❌ No damage tracking
- ❌ No count verification

**After:** Goods Receipt process between PO and inventory
- ✅ Partial receipts supported (100 ordered, 50 received week 1, 50 week 2)
- ✅ Quality checks per item
- ✅ Barcode scanning support
- ✅ Damage tracking
- ✅ Count verification
- ✅ Full audit trail

---

## Complete Workflow

```
1. CREATE PO (draft)
   └─ Vendor stats updated
   └─ Product stock: NO CHANGE

2. SEND PO (sent)
   └─ Product stock: NO CHANGE

3. CONFIRM PO (confirmed)
   └─ Product stock: NO CHANGE

4. GOODS RECEIPT PROCESS ✅ NEW
   ├─ Create GR for partial/full receipt
   ├─ Scan barcodes for each item
   ├─ Enter received quantity vs ordered
   ├─ Mark damaged items
   ├─ Quality check (pass/fail/pending)
   ├─ Add lot/batch numbers
   ├─ Add serial numbers if applicable
   └─ Confirm GR → Inventory updated

5. INVOICE (invoiced)
   └─ Product stock: NO CHANGE

6. PAYMENT (paid)
   └─ Product stock: NO CHANGE
```

---

## Goods Receipt (GR) Model

### Fields

```typescript
GoodsReceipt {
  _id: ObjectId
  po_id: string                    // Reference to PurchaseOrder
  po_number: string                // e.g., "PO-2025-00001"
  vendor_id: string
  receipt_number: string           // e.g., "GR-2025-00001" (unique)
  
  items: [
    {
      product_id: string
      po_item_index: number        // Which item in PO
      po_quantity: number          // Originally ordered
      received_quantity: number    // Actually received
      damaged_quantity: number     // Damaged items
      quality_check: 'pass'|'fail'|'pending'
      quality_notes: string        // Why failed?
      barcodes: string[]           // Scanned barcodes
      lot_numbers: string[]        // Batch/lot numbers
      serial_numbers: string[]     // Serial numbers
    }
  ]
  
  receipt_date: Date
  received_by: string              // Who received it
  total_received: number           // Sum of all received_quantity
  total_damaged: number            // Sum of all damaged_quantity
  status: 'pending'|'partial'|'complete'
  notes: string
  createdAt: Date
  updatedAt: Date
}
```

---

## Real-World Scenarios

### Scenario 1: Partial Receipt Over Time

**Order:** 100 units of Product A

**Week 1 - First Delivery:**
```
GR-2025-00001
├─ Product A: 50 received, 0 damaged, quality: pass
├─ Status: partial
└─ Inventory: +50 units
```

**Week 2 - Second Delivery:**
```
GR-2025-00002
├─ Product A: 50 received, 0 damaged, quality: pass
├─ Status: complete
└─ Inventory: +50 units (total 100)
```

### Scenario 2: Damaged Items

**Order:** 100 units of Product B

**Delivery:**
```
GR-2025-00003
├─ Product B: 100 received, 2 damaged, quality: pass
├─ Quality notes: "2 units broken in transit"
├─ Status: complete
└─ Inventory: +98 units (100 - 2 damaged)
└─ Damage transaction: -2 units recorded
```

### Scenario 3: Quality Check Failure

**Order:** 50 units of Product C

**Delivery:**
```
GR-2025-00004
├─ Product C: 50 received, 0 damaged, quality: fail
├─ Quality notes: "Wrong color batch, need to return"
├─ Status: pending
└─ Inventory: NO UPDATE (pending quality approval)
```

After approval/correction:
```
GR-2025-00004 (updated)
├─ Status: complete
└─ Inventory: +50 units
```

---

## API Endpoints

### GET Endpoints

**Get all goods receipts:**
```
GET /api/goods-receipts
```

**Get GR by ID:**
```
GET /api/goods-receipts/:id
```

**Get GRs for a specific PO:**
```
GET /api/goods-receipts/po/:poId
```

### POST Endpoints

**Create new goods receipt:**
```
POST /api/goods-receipts
Body: {
  po_id: "507f1f77bcf86cd799439011",
  items: [
    {
      product_id: "507f1f77bcf86cd799439012",
      po_item_index: 0,
      received_quantity: 50,
      damaged_quantity: 2,
      quality_check: "pass",
      quality_notes: "2 units damaged in transit",
      barcodes: ["BARCODE001", "BARCODE002"],
      lot_numbers: ["LOT-2025-001"],
      serial_numbers: []
    }
  ],
  received_by: "John Doe",
  notes: "Received from warehouse A"
}
```

### PUT Endpoints

**Update goods receipt (before confirmation):**
```
PUT /api/goods-receipts/:id
Body: {
  items: [...],
  received_by: "Jane Doe",
  notes: "Updated notes"
}
```

**Confirm GR and update inventory:**
```
PUT /api/goods-receipts/:id/confirm
```

This endpoint:
- ✅ Increases product stock by (received_quantity - damaged_quantity)
- ✅ Creates stock_in transaction for good items
- ✅ Creates damage transaction for damaged items
- ✅ Updates purchase price info
- ✅ Marks GR as complete

### DELETE Endpoints

**Delete goods receipt:**
```
DELETE /api/goods-receipts/:id
```

---

## Inventory Update Logic (On Confirm)

When you confirm a GR:

```
For each item in GR:
  1. Get product
  2. Calculate good_quantity = received_quantity - damaged_quantity
  
  3. Update product.stock += good_quantity
  
  4. Update purchase price info:
     - last_purchase_price = PO item price
     - last_purchase_date = today
     - average_purchase_price = (old + new) / 2
  
  5. Create transactions:
     - If good_quantity > 0:
       * Type: stock_in
       * Quantity: good_quantity
       * Reference: GR number
     
     - If damaged_quantity > 0:
       * Type: damage
       * Quantity: damaged_quantity
       * Reference: GR number
       * Notes: quality_notes
```

---

## Transaction History Entries

### Stock In Transaction
```
{
  type: "stock_in",
  quantity: 50,
  reference_type: "goods_receipt",
  reference_id: "GR-2025-00001",
  notes: "Received from GR GR-2025-00001 (PO PO-2025-00001)",
  created_by: "John Doe"
}
```

### Damage Transaction
```
{
  type: "damage",
  quantity: 2,
  reference_type: "goods_receipt",
  reference_id: "GR-2025-00001",
  notes: "Damaged items from GR GR-2025-00001: 2 units broken in transit",
  created_by: "John Doe"
}
```

---

## Barcode Scanning Integration

Each GR item can store multiple barcodes:

```
GR Item {
  barcodes: [
    "EAN-123456789",
    "EAN-123456790",
    "EAN-123456791",
    ...
  ]
}
```

**Use Cases:**
- Scan each unit received
- Verify against PO
- Track individual units
- Quality control per unit
- Damage tracking per barcode

---

## Lot/Batch Number Tracking

```
GR Item {
  lot_numbers: [
    "LOT-2025-001",
    "LOT-2025-002"
  ]
}
```

**Use Cases:**
- Track batch expiry dates
- Recall specific batches
- FIFO/LIFO inventory management
- Traceability

---

## Serial Number Tracking

```
GR Item {
  serial_numbers: [
    "SN-001",
    "SN-002",
    "SN-003"
  ]
}
```

**Use Cases:**
- Track individual units
- Warranty tracking
- Asset management
- Serialized products

---

## Quality Check Workflow

### Pass
- Item accepted
- Inventory updated
- No further action

### Fail
- Item rejected
- GR status: pending
- Requires correction/return
- Inventory NOT updated until resolved

### Pending
- Awaiting decision
- Can be updated later
- Inventory NOT updated

---

## Accounting Integration

### When GR is Confirmed

**Journal Entry:**
```
Debit:  Inventory (Product.stock)
Credit: Accounts Payable

Amount: (received_quantity - damaged_quantity) × purchase_price
```

**Damage Entry (if applicable):**
```
Debit:  Damage/Loss Account
Credit: Inventory

Amount: damaged_quantity × purchase_price
```

---

## Files Created

1. **server/db/models/GoodsReceipt.ts**
   - GoodsReceipt model with all fields
   - Indexes for performance

2. **server/routes/procurement/goods-receipts.ts**
   - All CRUD endpoints
   - Inventory update logic on confirm
   - Transaction history creation

3. **server/index.ts** (modified)
   - Registered GR routes

---

## Status

✅ GoodsReceipt model created
✅ API endpoints implemented
✅ Inventory update logic complete
✅ Transaction history tracking
✅ Barcode support ready
✅ Quality check support ready
✅ Partial receipt support ready
✅ Damage tracking ready
✅ Lot number support ready
✅ Serial number support ready

---

## Next Steps

1. Create GoodsReceiptManager UI component
2. Add barcode scanning interface
3. Add quality check form
4. Integrate with PO details modal
5. Add GR listing and management

