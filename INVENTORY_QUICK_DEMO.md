# Quick Demo - See Inventory in Action (5 Minutes)

## Start Here! 🚀

### 1. Start Application (30 seconds)
```bash
# Terminal 1
brew services start mongodb-community

# Terminal 2
pnpm dev:electron:watch
```

---

## 2. Add Sample Products (2 minutes)

### Click: Products Button (left sidebar)

**Add Product 1:**
```
Name: Coffee Beans
SKU: COFFEE-001
Price: 15.99
Stock: 5          ← Below reorder point!
Reorder Point: 20
Safety Stock: 10
Supplier: Coffee Inc
```
✅ **Result:** Low stock alert triggered

**Add Product 2:**
```
Name: Green Tea
SKU: TEA-001
Price: 12.50
Stock: 100
Reorder Point: 15
Safety Stock: 8
Supplier: Tea Estates
```
✅ **Result:** Healthy stock level

**Add Product 3:**
```
Name: Honey
SKU: HONEY-001
Price: 25.00
Stock: 0          ← Out of stock!
Reorder Point: 10
Safety Stock: 5
Supplier: Bee Farms
```
✅ **Result:** Out of stock alert

---

## 3. View Dashboard (1 minute)

### Click: Dashboard Button (top right)

**You'll see:**
- 🟡 **Health Score:** ~60% (Yellow - Warning)
- 💰 **Stock Value:** Total inventory value
- 📦 **Total Products:** 15 (3 new + 12 demo)
- 🔴 **Critical Alerts:** 2 (low stock + out of stock)

---

## 4. Explore Admin Features (1 minute)

### Click: Admin Button (top right)

**Try These:**

1. **Warehouses** → Add "Main Warehouse"
2. **Lot Numbers** → Add lot for Coffee (expires tomorrow)
3. **Stock Alerts** → See low stock alerts
4. **Expiry Notifications** → See expiring items
5. **Barcode Scanner** → Copy SKU to clipboard
6. **Advanced Reporting** → Generate Inventory Report

---

## What You'll See

### Products Modal
```
✅ Coffee Beans (COFFEE-001)
   Status: Active 🟢
   Stock: 5 (RED - below reorder point 20)
   Price: $15.99
   Supplier: Coffee Inc
   [Copy] [View] [Edit] [Delete]

✅ Green Tea (TEA-001)
   Status: Active 🟢
   Stock: 100 (GREEN - healthy)
   Price: $12.50
   Supplier: Tea Estates
   [Copy] [View] [Edit] [Delete]

✅ Honey (HONEY-001)
   Status: Active 🟢
   Stock: 0 (RED - out of stock!)
   Price: $25.00
   Supplier: Bee Farms
   [Copy] [View] [Edit] [Delete]
```

### Dashboard Widgets
```
┌─────────────────────────────────────┐
│ Health Score: 60% 🟡 (Warning)      │
│ Stock Value: $2,847.50              │
│ Total Products: 15                  │
│ Critical Alerts: 2                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Low Stock: 1                        │
│ Out of Stock: 1                     │
│ Expired: 0                          │
│ Expiring Soon: 0                    │
└─────────────────────────────────────┘
```

### Admin Panel
```
📦 Warehouses → Create warehouse
📋 Lot Numbers → Track batches & expiry
⚠️ Stock Alerts → See low stock warnings
📅 Expiry Notifications → Monitor expiry dates
📊 Analytics → View health metrics
🔍 Barcode Scanner → Scan products
📄 Advanced Reporting → Export reports
```

---

## Key Features in Action

### ✅ Stock Monitoring
- Coffee: 5 units (RED - alert!)
- Tea: 100 units (GREEN - healthy)
- Honey: 0 units (RED - reorder!)

### ✅ Alerts System
- 🟡 Low Stock Alert: Coffee (5 < 20)
- 🔴 Out of Stock Alert: Honey (0 units)

### ✅ Dashboard Updates
- Auto-refresh every 30 seconds
- Manual refresh button
- Real-time metrics

### ✅ Barcode Management
- Copy SKU to clipboard
- Quick product lookup
- Barcode statistics

### ✅ Reporting
- Generate inventory reports
- Export as JSON or CSV
- Date range filtering

---

## Try These Actions

### 1. Edit Product
- Click Edit on Coffee Beans
- Change stock to 25
- Click Update
- See dashboard update

### 2. Delete Product
- Click Delete on Honey
- Confirm deletion
- Product removed
- Dashboard updates

### 3. Copy Barcode
- Click Copy button on Tea
- SKU copied to clipboard
- See green checkmark

### 4. View Details
- Click View (barcode icon)
- See full product info
- All inventory fields shown

### 5. Generate Report
- Admin → Advanced Reporting
- Select Inventory Report
- Choose JSON format
- Click Generate
- See preview with all data

---

## Expected Results

### After Adding 3 Products:

| Metric | Value | Status |
|--------|-------|--------|
| Total Products | 15 | ✅ |
| Stock Value | ~$2,847 | ✅ |
| Health Score | ~60% | ⚠️ |
| Low Stock Alerts | 1 | ⚠️ |
| Out of Stock | 1 | 🔴 |
| Barcode Coverage | 15 | ✅ |

---

## Next Steps

1. ✅ Add more products with different stock levels
2. ✅ Create warehouses and assign products
3. ✅ Add lot numbers with expiry dates
4. ✅ Monitor alerts and notifications
5. ✅ Generate and export reports
6. ✅ Test barcode scanning

---

## Troubleshooting

**Products not showing?**
- Close and reopen Products Modal
- Check MongoDB is running

**Dashboard not updating?**
- Click Refresh button
- Wait 30 seconds for auto-refresh

**Alerts not appearing?**
- Verify stock is below reorder point
- Check Admin > Stock Alerts

---

## You're All Set! 🎉

Your inventory system is fully functional with:
- ✅ Real-time monitoring
- ✅ Alert system
- ✅ Barcode management
- ✅ Analytics dashboard
- ✅ Report generation
- ✅ Warehouse tracking
- ✅ Expiry monitoring

**Start adding inventory data and explore all features!**
