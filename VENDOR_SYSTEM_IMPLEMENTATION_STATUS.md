# Vendor & Purchase Order System - Implementation Status

## ✅ PHASE 1 COMPLETE - Database Models & Types

### Models Created

#### 1. **Vendor Model** ✅
File: `server/db/models/Vendor.ts`
- name, code, email, phone
- address, city, state, zip_code
- contact_person, payment_terms
- is_active, rating (1-5)
- total_purchases, total_spent
- notes, timestamps
- Indexes: name+is_active, code, email

#### 2. **PurchasePrice Model** ✅
File: `server/db/models/PurchasePrice.ts`
- product_id, vendor_id
- purchase_price (cost per unit)
- minimum_quantity, maximum_quantity
- lead_time_days, currency
- is_active, effective_from, effective_to
- notes, last_purchased, timestamps
- Indexes: product+vendor, product+is_active, vendor+is_active

#### 3. **PurchaseOrder Model** ✅
File: `server/db/models/PurchaseOrder.ts`
- po_number (unique)
- vendor_id
- items (array of PurchaseOrderItem)
- total_amount
- status (draft/sent/confirmed/received/invoiced/paid)
- payment_status (pending/partial/paid)
- order_date, expected_delivery, actual_delivery
- notes, timestamps
- Indexes: vendor+status, po_number, status, order_date

#### 4. **Product Model Updated** ✅
File: `server/db/models/Product.ts`
- Replaced: `supplier` (text) → `vendor_id` (reference)
- Added: default_purchase_price
- Added: last_purchase_price
- Added: last_purchase_date
- Added: average_purchase_price

### Types Updated ✅

File: `shared/api.ts`
- Updated Product interface with vendor_id and purchase price fields
- Added Vendor interface
- Added PurchasePrice interface
- Added PurchaseOrder interface
- Added PurchaseOrderItem interface

---

## 🔄 PHASE 2 - API Routes (Next Steps)

### Vendor Routes to Create
```
GET    /api/vendors                    - List all vendors
GET    /api/vendors/:id                - Get vendor details
POST   /api/vendors                    - Create vendor
PUT    /api/vendors/:id                - Update vendor
DELETE /api/vendors/:id                - Delete vendor
```

### Purchase Price Routes to Create
```
GET    /api/purchase-prices            - List all prices
GET    /api/purchase-prices/product/:id - Get prices for product
GET    /api/purchase-prices/vendor/:id  - Get prices from vendor
POST   /api/purchase-prices            - Add purchase price
PUT    /api/purchase-prices/:id        - Update price
DELETE /api/purchase-prices/:id        - Delete price
GET    /api/purchase-prices/compare/:productId - Compare vendors
```

### Purchase Order Routes to Create
```
GET    /api/purchase-orders            - List all POs
GET    /api/purchase-orders/:id        - Get PO details
POST   /api/purchase-orders            - Create PO
PUT    /api/purchase-orders/:id        - Update PO
DELETE /api/purchase-orders/:id        - Delete PO
PUT    /api/purchase-orders/:id/status - Update status
GET    /api/purchase-orders/vendor/:id - Vendor's POs
```

---

## 🎨 PHASE 3 - Frontend Components (Next Steps)

### Components to Create

#### 1. **VendorManager.tsx**
Location: `client/components/procurement/VendorManager.tsx`
- List all vendors
- Add new vendor form
- Edit vendor form
- Delete vendor with confirmation
- View vendor history
- Rating system

#### 2. **PurchasePriceManager.tsx**
Location: `client/components/procurement/PurchasePriceManager.tsx`
- Add prices for products
- Edit prices
- Delete prices
- View price history
- Compare vendors for product

#### 3. **PurchaseOrderCreator.tsx**
Location: `client/components/procurement/PurchaseOrderCreator.tsx`
- Create new PO
- Add items from prices
- Calculate totals
- Track PO status
- View PO history

### ProductsModal Updates

Replace supplier field with vendor dropdown:
```
Current: Supplier: [Text Input]
New: Vendor: [Dropdown] [Settings Button]
```

The dropdown will:
- Show all vendors
- Allow selection
- Link to vendor_id in product

---

## 📋 PHASE 4 - Admin Panel Integration (Next Steps)

### New Tab: "Procurement"

```
AdminModal.tsx - Add new tab:
├── Vendor Management
│   ├── List vendors
│   ├── Add vendor
│   ├── Edit vendor
│   └── Delete vendor
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

## 📝 Implementation Checklist

### Phase 1: Database ✅
- [x] Create Vendor model
- [x] Create PurchasePrice model
- [x] Create PurchaseOrder model
- [x] Update Product model
- [x] Update shared types

### Phase 2: API Routes 🔄
- [ ] Create vendor routes (5 endpoints)
- [ ] Create purchase price routes (7 endpoints)
- [ ] Create purchase order routes (7 endpoints)
- [ ] Add routes to server/index.ts
- [ ] Test all endpoints

### Phase 3: Frontend Components
- [ ] Create VendorManager component
- [ ] Create PurchasePriceManager component
- [ ] Create PurchaseOrderCreator component
- [ ] Update ProductsModal with vendor dropdown
- [ ] Add vendor selection logic

### Phase 4: Admin Panel
- [ ] Add Procurement tab to AdminModal
- [ ] Integrate VendorManager
- [ ] Integrate PurchasePriceManager
- [ ] Integrate PurchaseOrderCreator
- [ ] Add analytics section

---

## 🚀 How to Continue

### Step 1: Create Vendor Routes
```typescript
// server/routes/procurement/vendors.ts
import { Router } from 'express';
import { Vendor } from '../db/models/Vendor';

const router = Router();

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create vendor
router.post('/', async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... other routes
export default router;
```

### Step 2: Add Routes to server/index.ts
```typescript
import vendorRoutes from './routes/procurement/vendors';
import purchasePriceRoutes from './routes/procurement/purchase-prices';
import purchaseOrderRoutes from './routes/procurement/purchase-orders';

app.use('/api/vendors', vendorRoutes);
app.use('/api/purchase-prices', purchasePriceRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
```

### Step 3: Update ProductsModal
```typescript
// In ProductsModal.tsx
// Replace supplier field with vendor dropdown

const [vendors, setVendors] = useState<Vendor[]>([]);

useEffect(() => {
  fetchVendors();
}, []);

const fetchVendors = async () => {
  try {
    const data = await get('/api/vendors');
    setVendors(data);
  } catch (error) {
    console.error('Error fetching vendors:', error);
  }
};

// In form:
<select
  value={formData.vendor_id}
  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
>
  <option value="">Select vendor</option>
  {vendors.map((vendor) => (
    <option key={vendor._id} value={vendor._id}>
      {vendor.name}
    </option>
  ))}
</select>
```

---

## 📊 Database Relationships

```
Vendor (1) ──→ (Many) PurchasePrice
Vendor (1) ──→ (Many) PurchaseOrder
Product (1) ──→ (Many) PurchasePrice
Product (1) ──→ (Many) PurchaseOrderItem
PurchaseOrder (1) ──→ (Many) PurchaseOrderItem
```

---

## 💾 Data Examples

### Vendor Document
```json
{
  "_id": "vendor-001",
  "name": "Fresh Farms Co",
  "code": "FF-001",
  "email": "sales@freshfarms.com",
  "phone": "+1-555-0123",
  "contact_person": "John Smith",
  "payment_terms": "Net 30",
  "is_active": true,
  "rating": 4.5,
  "total_purchases": 150,
  "total_spent": 5000
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
  "is_active": true
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
  "payment_status": "pending"
}
```

---

## ✨ Summary

**Completed:**
✅ Database models created
✅ Types defined
✅ Product model updated
✅ Ready for API routes

**Next:**
🔄 Create API routes
🔄 Build frontend components
🔄 Integrate with admin panel
🔄 Add vendor dropdown to products

**Status:** Ready for Phase 2 implementation!
