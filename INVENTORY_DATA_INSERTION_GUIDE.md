# Inventory Data Insertion Guide - Complete Walkthrough

## Overview
This guide shows you how to insert inventory data and see it in action across all inventory features.

---

## Step 1: Start the Application

```bash
# Terminal 1: Start MongoDB
brew services start mongodb-community

# Terminal 2: Start the application with hot reload
pnpm dev:electron:watch
```

The app will start with auto-seeded demo data (12 products, 6 customers, 6 orders).

---

## Step 2: Access the Products Modal

1. **Open the POS application** (Electron window)
2. **Click "Products" button** in the left sidebar (blue button with package icon)
3. You'll see the **Products Modal** with all demo products

---

## Step 3: Add New Products with Inventory

### Method A: Using the UI (Recommended)

1. **Click "Add Product" button** (bottom right of Products Modal)
2. **Fill in the form:**

```
Basic Information:
- Product Name: Premium Coffee Beans
- SKU: COFFEE-001
- Price: 15.99
- Stock: 100
- Category: Beverages
- Description: High-quality arabica coffee beans

Inventory Settings:
- Reorder Point: 20
- Safety Stock: 10
- Lead Time (Days): 5
- Status: Active
- Supplier: Coffee Imports Inc
- Warehouse ID: WH-001
```

3. **Click "Add Product"**
4. **Product appears in the list immediately**

### Example Products to Add:

**Product 1: Premium Tea**
```
Name: Premium Green Tea
SKU: TEA-001
Price: 12.50
Stock: 80
Category: Beverages
Reorder Point: 15
Safety Stock: 8
Lead Time: 3
Supplier: Tea Estates Ltd
Warehouse: WH-001
```

**Product 2: Organic Honey**
```
Name: Organic Raw Honey
SKU: HONEY-001
Price: 25.00
Stock: 30
Category: Food
Reorder Point: 10
Safety Stock: 5
Lead Time: 7
Supplier: Bee Farms Co
Warehouse: WH-002
```

**Product 3: Chocolate Bars**
```
Name: Dark Chocolate 70%
SKU: CHOCO-001
Price: 8.99
Stock: 5
Category: Confectionery
Reorder Point: 20
Safety Stock: 10
Lead Time: 2
Supplier: Chocolate World
Warehouse: WH-001
```

---

## Step 4: View Products in Action

### In Products Modal:
- ✅ See all products with inventory info
- ✅ View status badges (Active/Inactive/Discontinued)
- ✅ See stock levels with color coding
- ✅ Compare stock vs reorder point
- ✅ View supplier information

### Actions Available:
1. **Copy SKU** - Click copy button, SKU copied to clipboard
2. **View Details** - Click barcode icon to see full product info
3. **Edit Product** - Click edit icon to modify
4. **Delete Product** - Click trash icon to remove

---

## Step 5: See Inventory in Dashboard Widgets

1. **Close Products Modal**
2. **Click "Dashboard" button** (top right, green button)
3. **View Real-time Inventory Status:**

### Dashboard Shows:
- **Health Score** - Overall inventory health (0-100%)
- **Stock Value** - Total value of all inventory
- **Total Products** - Number of products
- **Critical Alerts** - Out of stock + expired items
- **Low Stock Alerts** - Products below reorder point
- **Barcode Coverage** - Barcode statistics
- **Recent Activity** - Stock in/out transactions

### Color Coding:
- 🟢 Green: Healthy (80%+)
- 🟡 Yellow: Warning (60-80%)
- 🔴 Red: Critical (<60%)

---

## Step 6: Access Admin Panel Features

1. **Click "Admin" button** (top right)
2. **See Admin Overview** with all management sections

### Available Sections:

#### A. Warehouses Manager
1. Click "Warehouses" card
2. **Add Warehouse:**
   ```
   Name: Main Warehouse
   Location: Downtown
   Capacity: 1000
   ```
3. See warehouse utilization

#### B. Lot Numbers Manager
1. Click "Lot Numbers" card
2. **Add Lot:**
   ```
   Lot Number: LOT-2024-001
   Product: Premium Coffee Beans
   Quantity: 50
   Manufacture Date: 2024-01-01
   Expiry Date: 2025-01-01
   Warehouse: Main Warehouse
   ```
3. See expiry status (Active/Expiring Soon/Expired)

#### C. Reorder Rules Manager
1. Click "Reorder Rules" card
2. **Add Rule:**
   ```
   Product: Premium Coffee Beans
   Reorder Point: 20
   Safety Stock: 10
   Lead Time: 5 days
   ```
3. Triggers alerts when stock drops

#### D. Stock Alerts Manager
1. Click "Stock Alerts" card
2. **View alerts:**
   - Low stock alerts (yellow)
   - Out of stock alerts (red)
   - Acknowledge/resolve alerts

#### E. Expiry Notifications Manager
1. Click "Expiry Notifications" card
2. **View expiry status:**
   - Expired items (red)
   - Expiring soon (yellow)
   - Upcoming expiries (blue)

#### F. Analytics Dashboard
1. Click "Analytics" card
2. **View metrics:**
   - Overview tab: Health score, stock value
   - Categories tab: Distribution by category
   - Warehouses tab: Utilization rates
   - Performance tab: Top/bottom products

#### G. Barcode Scanner
1. Click "Barcode Scanner" card
2. **Scan Tab:**
   - Enter SKU or barcode
   - See instant product lookup
3. **Manage Tab:**
   - Create barcode mappings
   - Search existing barcodes
   - Copy barcodes
4. **Stats Tab:**
   - Total barcodes
   - By type breakdown

#### H. Advanced Reporting
1. Click "Advanced Reporting" card
2. **Generate Reports:**
   - Inventory Report (JSON/CSV)
   - Transaction Report
   - Expiry Report
   - Stock Alert Report
   - Warehouse Report
3. **Export Options:**
   - JSON: Preview in UI
   - CSV: Download file

#### I. Transaction History
1. Click "Transaction History" card
2. **View all transactions:**
   - Stock in/out
   - Adjustments
   - Transfers
   - Running balance

---

## Step 7: Test Stock Alerts

### Trigger Low Stock Alert:

1. **Go to Products Modal**
2. **Edit Product:** Chocolate Bars (currently 5 units)
3. **Change Stock to:** 3 (below reorder point of 20)
4. **Click "Update Product"**
5. **Go to Admin > Stock Alerts**
6. **See Low Stock Alert** for Chocolate Bars

### Alert Status:
- 🟡 Active (needs attention)
- 🔵 Acknowledged (noted)
- 🟢 Resolved (fixed)

---

## Step 8: Test Expiry Notifications

### Add Expiring Product:

1. **Go to Admin > Lot Numbers**
2. **Add Lot:**
   ```
   Product: Premium Tea
   Quantity: 40
   Expiry Date: Tomorrow's date
   ```
3. **See "Expiring Soon" status** (yellow)

### Expiry Status Types:
- 🔴 Expired (past expiry date)
- 🟡 Expiring Soon (within 7 days)
- 🔵 Upcoming (future expiry)

---

## Step 9: Generate Reports

### Inventory Report:

1. **Go to Admin > Advanced Reporting**
2. **Select "Inventory Report"**
3. **Set Date Range:** Last 30 days
4. **Choose Format:** JSON
5. **Click "Generate Report"**
6. **View Preview:**
   - Total products
   - Stock value
   - Transactions
   - Alerts

### Export as CSV:

1. **Change Format to:** CSV
2. **Click "Generate Report"**
3. **File downloads:** inventory-report.csv
4. **Open in Excel/Sheets**

---

## Step 10: Monitor Real-time Updates

### Dashboard Auto-Refresh:

1. **Open Dashboard**
2. **Make changes in Products Modal** (add/edit/delete)
3. **Dashboard updates automatically** every 30 seconds
4. **Or click "Refresh" button** for instant update

### Metrics Update:
- ✅ Total products count
- ✅ Stock value
- ✅ Health score
- ✅ Alert counts
- ✅ Barcode statistics

---

## Complete Workflow Example

### Scenario: Manage Coffee Inventory

**1. Add Product**
```
Products Modal → Add Product
Name: Premium Coffee
SKU: COFFEE-001
Stock: 100
Reorder Point: 20
```

**2. Create Warehouse**
```
Admin → Warehouses
Name: Main Storage
Location: Downtown
Capacity: 500
```

**3. Add Lot**
```
Admin → Lot Numbers
Product: Premium Coffee
Quantity: 100
Expiry: 2025-12-31
Warehouse: Main Storage
```

**4. Set Reorder Rule**
```
Admin → Reorder Rules
Product: Premium Coffee
Reorder Point: 20
Lead Time: 5 days
```

**5. Monitor Dashboard**
```
Dashboard
- See health score
- Track stock value
- View alerts
- Check barcode coverage
```

**6. Generate Report**
```
Admin → Advanced Reporting
- Inventory Report
- Export as CSV
- Share with team
```

---

## API Endpoints Used

### Products
- `GET /api/products` - Fetch all
- `POST /api/products` - Create
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Delete

### Inventory
- `GET /api/inventory/warehouses` - List warehouses
- `POST /api/inventory/warehouses` - Create warehouse
- `GET /api/inventory/lot-numbers` - List lots
- `POST /api/inventory/lot-numbers` - Create lot
- `GET /api/inventory/stock-alerts` - View alerts
- `GET /api/inventory/expiry-notifications` - View expiries
- `GET /api/inventory/analytics/overview` - Dashboard data
- `GET /api/inventory/barcodes` - Barcode list
- `POST /api/inventory/reports/*` - Generate reports

---

## Troubleshooting

### Products Not Appearing?
1. Check MongoDB is running: `brew services list`
2. Refresh Products Modal: Click "Close" then "Products" again
3. Check browser console for errors

### Dashboard Not Updating?
1. Click "Refresh" button manually
2. Wait 30 seconds for auto-refresh
3. Check if data exists in Products Modal

### Alerts Not Showing?
1. Verify stock is below reorder point
2. Check Admin > Stock Alerts section
3. Ensure product status is "Active"

### Barcodes Not Working?
1. Verify SKU is unique
2. Try copying SKU manually
3. Check barcode scanner in Admin panel

---

## Best Practices

✅ **Always set reorder points** - Triggers alerts automatically
✅ **Use warehouses** - Track inventory location
✅ **Monitor dashboard** - Check health score daily
✅ **Review alerts** - Acknowledge and resolve
✅ **Generate reports** - Weekly inventory review
✅ **Update expiry dates** - Prevent expired stock
✅ **Use barcodes** - Quick product lookup

---

## Next Steps

1. ✅ Insert sample inventory data
2. ✅ Explore all admin features
3. ✅ Test alert system
4. ✅ Generate reports
5. ✅ Monitor dashboard
6. ✅ Customize for your business

**Your inventory system is now ready to use!** 🚀
