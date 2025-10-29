# Purchase Price & Vendor Management System - Design Document

## Overview
A complete system to track purchase prices from multiple vendors, manage vendor relationships, and optimize procurement decisions.

---

## Core Concept

### Problem Statement
```
Need: 100 Apples

Vendor A: 10 units @ $5 each = $50
Vendor B: 90 units @ $10 each = $900
Total Cost: $950

Without tracking: Cannot optimize purchases
With system: Can compare and choose best option
```

---

## Database Schema Design

### 1. **Vendor Model** (New)
```typescript
interface Vendor {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contact_person: string;
  payment_terms: string; // Net 30, Net 60, COD, etc.
  is_active: boolean;
  rating: number; // 1-5 stars
  total_purchases: number;
  total_spent: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. **Purchase Price Model** (New)
```typescript
interface PurchasePrice {
  _id: string;
  product_id: string;
  vendor_id: string;
  purchase_price: number; // Cost per unit
  minimum_quantity: number; // Min order quantity
  maximum_quantity: number; // Max available from vendor
  lead_time_days: number; // Days to delivery
  currency: string; // USD, EUR, etc.
  is_active: boolean;
  effective_from: Date;
  effective_to: Date; // Optional expiry
  notes: string;
  last_purchased: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. **Purchase Order Model** (New)
```typescript
interface PurchaseOrderItem {
  product_id: string;
  quantity: number;
  purchase_price: number;
  line_total: number;
}

interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor_id: string;
  items: PurchaseOrderItem[];
  total_amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'invoiced' | 'paid';
  order_date: Date;
  expected_delivery: Date;
  actual_delivery: Date;
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. **Enhanced Product Model**
```typescript
// Add to existing Product model:
{
  default_vendor_id?: string;
  default_purchase_price?: number;
  last_purchase_price?: number;
  last_purchase_date?: Date;
  average_purchase_price?: number;
}
```

---

## API Endpoints Design

### Vendor Management
```
GET    /api/vendors                    - List all vendors
GET    /api/vendors/:id                - Get vendor details
POST   /api/vendors                    - Create vendor
PUT    /api/vendors/:id                - Update vendor
DELETE /api/vendors/:id                - Delete vendor
GET    /api/vendors/:id/purchase-history - Vendor purchase history
```

### Purchase Prices
```
GET    /api/purchase-prices            - List all purchase prices
GET    /api/purchase-prices/product/:id - Get prices for product
GET    /api/purchase-prices/vendor/:id  - Get prices from vendor
POST   /api/purchase-prices            - Add purchase price
PUT    /api/purchase-prices/:id        - Update purchase price
DELETE /api/purchase-prices/:id        - Delete purchase price
GET    /api/purchase-prices/compare/:productId - Compare vendors
```

### Purchase Orders
```
GET    /api/purchase-orders            - List all POs
GET    /api/purchase-orders/:id        - Get PO details
POST   /api/purchase-orders            - Create PO
PUT    /api/purchase-orders/:id        - Update PO
DELETE /api/purchase-orders/:id        - Delete PO
PUT    /api/purchase-orders/:id/status - Update PO status
GET    /api/purchase-orders/vendor/:id - Vendor's POs
```

---

## Frontend Components Design

### 1. **Vendor Management Modal**
```
┌─────────────────────────────────────┐
│ Vendor Management              [X]  │
├─────────────────────────────────────┤
│ [Search] [Add Vendor]               │
├─────────────────────────────────────┤
│ Vendor List:                        │
│                                     │
│ Vendor A                            │
│ Email: vendor@a.com                 │
│ Rating: ★★★★★                      │
│ Total Spent: $10,000                │
│ [View] [Edit] [Delete]              │
│                                     │
│ Vendor B                            │
│ Email: vendor@b.com                 │
│ Rating: ★★★★☆                      │
│ Total Spent: $5,000                 │
│ [View] [Edit] [Delete]              │
└─────────────────────────────────────┘
```

### 2. **Purchase Price Comparison Modal**
```
┌─────────────────────────────────────┐
│ Purchase Prices - Apples       [X]  │
├─────────────────────────────────────┤
│ Product: Apples (APPLE-001)         │
│ Need: 100 units                     │
├─────────────────────────────────────┤
│ Vendor A:                           │
│ Price: $5/unit                      │
│ Available: 10 units                 │
│ Lead Time: 2 days                   │
│ Total: $50                          │
│ [Select]                            │
│                                     │
│ Vendor B:                           │
│ Price: $10/unit                     │
│ Available: 90 units                 │
│ Lead Time: 5 days                   │
│ Total: $900                         │
│ [Select]                            │
│                                     │
│ Combined Order:                     │
│ Vendor A: 10 @ $5 = $50             │
│ Vendor B: 90 @ $10 = $900           │
│ Total: $950                         │
│ [Create PO]                         │
└─────────────────────────────────────┘
```

### 3. **Purchase Order Creation Modal**
```
┌─────────────────────────────────────┐
│ Create Purchase Order          [X]  │
├─────────────────────────────────────┤
│ PO Number: PO-2024-001              │
│ Vendor: [Dropdown]                  │
│ Order Date: [Date Picker]           │
│ Expected Delivery: [Date Picker]    │
├─────────────────────────────────────┤
│ Items:                              │
│ Apples: 10 @ $5 = $50               │
│ Oranges: 5 @ $2 = $10               │
│ Bananas: 20 @ $1 = $20              │
├─────────────────────────────────────┤
│ Subtotal: $80                       │
│ Tax: $8                             │
│ Total: $88                          │
│ [Create PO]                         │
└─────────────────────────────────────┘
```

### 4. **Purchase Price Management**
```
In Product Form:

Purchase Prices Section:
┌─────────────────────────────────────┐
│ Vendor A: $5/unit (Min: 10)         │
│ Available: 10 units                 │
│ Lead Time: 2 days                   │
│ [Edit] [Delete]                     │
│                                     │
│ Vendor B: $10/unit (Min: 50)        │
│ Available: 100 units                │
│ Lead Time: 5 days                   │
│ [Edit] [Delete]                     │
│                                     │
│ [+ Add Vendor Price]                │
└─────────────────────────────────────┘
```

---

## Workflow Examples

### Example 1: Simple Purchase
```
Step 1: View Product (Apples)
- See all vendor prices
- Vendor A: $5/unit (10 available)
- Vendor B: $10/unit (90 available)

Step 2: Compare Prices
- Need 100 units
- Option 1: Buy all from Vendor B = $1000
- Option 2: Buy from both = $950 (cheaper!)

Step 3: Create Purchase Order
- Add 10 from Vendor A @ $5 = $50
- Add 90 from Vendor B @ $10 = $900
- Total: $950

Step 4: Track Order
- PO created
- Monitor delivery
- Receive stock
- Update inventory
```

### Example 2: Vendor Comparison
```
Need: 100 Coffee Beans (kg)

Vendor A:
- Price: $8/kg
- Min Order: 50kg
- Available: 100kg
- Lead Time: 3 days
- Cost for 100kg: $800

Vendor B:
- Price: $6/kg
- Min Order: 100kg
- Available: 150kg
- Lead Time: 7 days
- Cost for 100kg: $600

Decision: Choose Vendor B (save $200)
```

### Example 3: Multi-Vendor Order
```
Need: 500 units

Vendor A: $2/unit, Max 200 units
Vendor B: $1.50/unit, Max 300 units
Vendor C: $1.80/unit, Max 100 units

Optimal Order:
- Vendor B: 300 @ $1.50 = $450
- Vendor C: 100 @ $1.80 = $180
- Vendor A: 100 @ $2.00 = $200
Total: $830 (vs $1000 if all from A)
```

---

## Key Features

### 1. **Vendor Management**
✅ Add/Edit/Delete vendors
✅ Track vendor ratings
✅ Monitor total purchases
✅ Payment terms tracking
✅ Contact information

### 2. **Purchase Price Tracking**
✅ Multiple prices per product
✅ Minimum order quantities
✅ Maximum availability
✅ Lead time tracking
✅ Price history
✅ Effective date ranges

### 3. **Price Comparison**
✅ Compare vendors for product
✅ Calculate total costs
✅ Consider lead times
✅ Optimize purchases
✅ Multi-vendor orders

### 4. **Purchase Orders**
✅ Create POs from prices
✅ Track order status
✅ Monitor delivery
✅ Payment tracking
✅ PO history

### 5. **Analytics**
✅ Vendor performance
✅ Price trends
✅ Cost analysis
✅ Vendor ratings
✅ Purchase history

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create Vendor model
- Create PurchasePrice model
- Basic CRUD endpoints
- Vendor management UI

### Phase 2: Purchase Orders (Week 2)
- Create PurchaseOrder model
- PO creation endpoints
- PO status tracking
- Basic PO UI

### Phase 3: Comparison & Optimization (Week 3)
- Price comparison logic
- Multi-vendor order suggestions
- Cost optimization
- Comparison UI

### Phase 4: Analytics & Reporting (Week 4)
- Vendor performance metrics
- Price trend analysis
- Cost reports
- Analytics dashboard

---

## Data Flow

```
1. Add Vendor
   ↓
2. Add Purchase Prices for Products
   ↓
3. View Product → See All Vendor Prices
   ↓
4. Compare Vendors → Get Best Price
   ↓
5. Create Purchase Order
   ↓
6. Track Order Status
   ↓
7. Receive Stock → Update Inventory
   ↓
8. Record Purchase in Accounting
```

---

## Integration with Existing System

### Product Modal
```
Add Section: "Purchase Prices"
- List all vendors for product
- Show prices and availability
- Add/Edit/Delete prices
- Quick purchase order creation
```

### Admin Panel
```
Add Tab: "Procurement"
- Vendor Management
- Purchase Prices
- Purchase Orders
- Vendor Analytics
```

### Dashboard
```
Add Widget: "Procurement Status"
- Pending POs
- Vendor performance
- Cost trends
- Upcoming deliveries
```

---

## Database Relationships

```
Vendor (1) ──→ (Many) PurchasePrice
Vendor (1) ──→ (Many) PurchaseOrder
Product (1) ──→ (Many) PurchasePrice
Product (1) ──→ (Many) PurchaseOrderItem
PurchaseOrder (1) ──→ (Many) PurchaseOrderItem
PurchasePrice (1) ──→ (Many) PurchaseOrder
```

---

## Security & Validation

✅ Validate vendor information
✅ Validate purchase prices (no negative)
✅ Validate quantities (min/max)
✅ Track price changes
✅ Audit trail for POs
✅ User permissions for PO creation

---

## Future Enhancements

✅ Automated PO generation
✅ Vendor rating system
✅ Price negotiation tracking
✅ Contract management
✅ Bulk discount handling
✅ Seasonal pricing
✅ Supplier performance metrics
✅ Automated reorder suggestions

---

## Summary

This system enables:

✅ **Multiple Vendor Tracking** - Store prices from different vendors
✅ **Price Comparison** - Automatically compare and optimize
✅ **Smart Purchasing** - Choose best vendor combination
✅ **Cost Control** - Track and reduce procurement costs
✅ **Vendor Management** - Maintain vendor relationships
✅ **Order Tracking** - Monitor PO status
✅ **Double Entry Ready** - Integrates with accounting system

**Ready for implementation!** 🚀
