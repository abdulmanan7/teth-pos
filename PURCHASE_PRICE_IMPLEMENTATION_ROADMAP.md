# Purchase Price & Vendor System - Implementation Roadmap

## Quick Overview

Your system will track:
- **Multiple vendors** per product
- **Different prices** from each vendor
- **Availability** from each vendor
- **Lead times** for delivery
- **Purchase orders** combining vendors
- **Cost optimization** for bulk purchases

---

## Example Scenario

```
NEED: 100 Apples

VENDOR A:
- Price: $5 per apple
- Available: 10 apples
- Lead Time: 2 days
- Cost: 10 × $5 = $50

VENDOR B:
- Price: $10 per apple
- Available: 90 apples
- Lead Time: 5 days
- Cost: 90 × $10 = $900

TOTAL COST: $950 (from both vendors)
vs $1000 (if all from Vendor B)
SAVES: $50
```

---

## Phase 1: Database Models (Foundation)

### 1. Create Vendor Model
```
File: server/db/models/Vendor.ts

Fields:
- name (string)
- code (string, unique)
- email (string)
- phone (string)
- address (string)
- contact_person (string)
- payment_terms (string)
- is_active (boolean)
- rating (number 1-5)
- total_purchases (number)
- total_spent (number)
- notes (string)
```

### 2. Create PurchasePrice Model
```
File: server/db/models/PurchasePrice.ts

Fields:
- product_id (reference to Product)
- vendor_id (reference to Vendor)
- purchase_price (number)
- minimum_quantity (number)
- maximum_quantity (number)
- lead_time_days (number)
- currency (string)
- is_active (boolean)
- effective_from (date)
- effective_to (date, optional)
- notes (string)
```

### 3. Create PurchaseOrder Model
```
File: server/db/models/PurchaseOrder.ts

Fields:
- po_number (string, unique)
- vendor_id (reference to Vendor)
- items (array of PurchaseOrderItem)
- total_amount (number)
- status (draft/sent/confirmed/received/invoiced/paid)
- order_date (date)
- expected_delivery (date)
- actual_delivery (date)
- payment_status (pending/partial/paid)
- notes (string)
```

### 4. Update Product Model
```
Add to existing Product model:
- default_vendor_id (optional)
- default_purchase_price (number)
- last_purchase_price (number)
- last_purchase_date (date)
- average_purchase_price (number)
```

---

## Phase 2: API Routes (Backend)

### Vendor Routes
```
GET    /api/vendors                    - List all vendors
GET    /api/vendors/:id                - Get vendor details
POST   /api/vendors                    - Create vendor
PUT    /api/vendors/:id                - Update vendor
DELETE /api/vendors/:id                - Delete vendor
```

### Purchase Price Routes
```
GET    /api/purchase-prices            - List all prices
GET    /api/purchase-prices/product/:id - Get prices for product
POST   /api/purchase-prices            - Add purchase price
PUT    /api/purchase-prices/:id        - Update price
DELETE /api/purchase-prices/:id        - Delete price
GET    /api/purchase-prices/compare/:productId - Compare vendors
```

### Purchase Order Routes
```
GET    /api/purchase-orders            - List all POs
GET    /api/purchase-orders/:id        - Get PO details
POST   /api/purchase-orders            - Create PO
PUT    /api/purchase-orders/:id        - Update PO
PUT    /api/purchase-orders/:id/status - Update status
DELETE /api/purchase-orders/:id        - Delete PO
```

---

## Phase 3: Frontend Components

### 1. Vendor Management Modal
```
File: client/components/procurement/VendorManager.tsx

Features:
- List all vendors
- Add new vendor
- Edit vendor
- Delete vendor
- View vendor history
- Rating system
```

### 2. Purchase Price Manager
```
File: client/components/procurement/PurchasePriceManager.tsx

Features:
- Add prices for product
- Edit prices
- Delete prices
- View price history
- Compare vendors
```

### 3. Purchase Order Creator
```
File: client/components/procurement/PurchaseOrderCreator.tsx

Features:
- Create new PO
- Add items from prices
- Calculate totals
- Track status
- View PO history
```

### 4. Price Comparison Modal
```
File: client/components/procurement/PriceComparison.tsx

Features:
- Compare vendors for product
- Show availability
- Calculate costs
- Suggest best option
- Multi-vendor combinations
```

---

## Phase 4: Admin Panel Integration

### New Tab: "Procurement"

```
Procurement Dashboard:
├── Vendor Management
│   ├── List vendors
│   ├── Add vendor
│   ├── Edit vendor
│   └── View history
│
├── Purchase Prices
│   ├── Manage prices
│   ├── Compare vendors
│   ├── Price history
│   └── Bulk update
│
├── Purchase Orders
│   ├── Create PO
│   ├── Track orders
│   ├── Update status
│   └── View history
│
└── Analytics
    ├── Vendor performance
    ├── Price trends
    ├── Cost analysis
    └── Savings report
```

---

## Phase 5: Integration Points

### In Product Modal
```
Add Section: "Purchase Prices"

Show:
- All vendors for product
- Current prices
- Availability
- Lead times
- Last purchase price
- Average purchase price

Actions:
- Add vendor price
- Edit price
- Delete price
- Create PO
```

### In Dashboard
```
Add Widget: "Procurement Status"

Show:
- Pending POs
- Recent orders
- Vendor performance
- Cost trends
```

### In Inventory
```
When receiving stock:
- Link to PO
- Update purchase price
- Record cost
- Update average price
```

---

## Implementation Timeline

### Week 1: Database & API
- Create Vendor model
- Create PurchasePrice model
- Create PurchaseOrder model
- Build API routes
- Test endpoints

### Week 2: Basic UI
- Vendor management modal
- Purchase price manager
- Basic PO creation
- List views

### Week 3: Advanced Features
- Price comparison
- Multi-vendor orders
- Status tracking
- Order history

### Week 4: Integration & Polish
- Admin panel integration
- Product modal integration
- Dashboard widgets
- Analytics

---

## Key Features to Build

### 1. Vendor Management
```
✅ Add vendors with details
✅ Track vendor ratings
✅ Monitor total purchases
✅ Payment terms
✅ Contact information
✅ Vendor history
```

### 2. Purchase Price Tracking
```
✅ Multiple prices per product
✅ Minimum order quantities
✅ Maximum availability
✅ Lead time tracking
✅ Price effective dates
✅ Price history
```

### 3. Smart Purchasing
```
✅ Compare vendors
✅ Calculate total costs
✅ Multi-vendor optimization
✅ Suggest best options
✅ Cost savings tracking
```

### 4. Purchase Orders
```
✅ Create from prices
✅ Track status
✅ Monitor delivery
✅ Payment tracking
✅ Order history
```

### 5. Analytics
```
✅ Vendor performance
✅ Price trends
✅ Cost analysis
✅ Savings reports
✅ Vendor ratings
```

---

## Data Structure Example

### Vendor Document
```json
{
  "_id": "vendor-001",
  "name": "Fresh Farms Co",
  "code": "FF-001",
  "email": "sales@freshfarms.com",
  "phone": "+1-555-0123",
  "address": "123 Farm Road",
  "contact_person": "John Smith",
  "payment_terms": "Net 30",
  "is_active": true,
  "rating": 4.5,
  "total_purchases": 150,
  "total_spent": 5000,
  "createdAt": "2024-01-01"
}
```

### PurchasePrice Document
```json
{
  "_id": "price-001",
  "product_id": "apple-001",
  "vendor_id": "vendor-001",
  "purchase_price": 5,
  "minimum_quantity": 10,
  "maximum_quantity": 100,
  "lead_time_days": 2,
  "currency": "USD",
  "is_active": true,
  "effective_from": "2024-01-01",
  "createdAt": "2024-01-01"
}
```

### PurchaseOrder Document
```json
{
  "_id": "po-001",
  "po_number": "PO-2024-001",
  "vendor_id": "vendor-001",
  "items": [
    {
      "product_id": "apple-001",
      "quantity": 10,
      "purchase_price": 5,
      "line_total": 50
    }
  ],
  "total_amount": 50,
  "status": "confirmed",
  "order_date": "2024-01-15",
  "expected_delivery": "2024-01-17",
  "payment_status": "pending",
  "createdAt": "2024-01-15"
}
```

---

## Integration with Double Entry Accounting

### When PO is Created
```
Debit: Inventory (Product)
Credit: Accounts Payable (Vendor)
Amount: Total PO amount
```

### When PO is Received
```
Debit: Inventory (Product)
Credit: Accounts Payable (Vendor)
Amount: Actual received amount
```

### When Invoice is Received
```
Debit: Accounts Payable
Credit: Cash/Bank
Amount: Invoice amount
```

### When Payment is Made
```
Debit: Accounts Payable
Credit: Cash/Bank
Amount: Payment amount
```

---

## Benefits

✅ **Cost Optimization** - Find cheapest vendor combinations
✅ **Vendor Management** - Track all vendor relationships
✅ **Price History** - Monitor price trends
✅ **Bulk Discounts** - Leverage minimum quantities
✅ **Accounting Ready** - Integrates with double entry
✅ **Procurement Control** - Centralized purchasing
✅ **Performance Tracking** - Vendor ratings and metrics
✅ **Cost Analysis** - Detailed cost reports

---

## Next Steps

1. **Review Design** - Confirm structure meets needs
2. **Create Models** - Build database schemas
3. **Build API** - Create backend endpoints
4. **Build UI** - Create frontend components
5. **Test System** - Verify functionality
6. **Integrate** - Connect with existing system
7. **Deploy** - Go live

---

## Ready to Start?

This system is designed to:
- Track multiple vendors per product
- Compare prices automatically
- Optimize purchasing decisions
- Integrate with accounting
- Provide detailed analytics

**Let's build it!** 🚀
