# Unit of Measurement Guide - Handle Different Product Types

## Overview
Your inventory system now supports multiple units of measurement for different product types:
- **Countable items** (pieces, boxes, dozens)
- **Liquids** (liters, milliliters)
- **Weight** (kilograms, grams)
- **Length** (meters, centimeters)
- **Custom units** (bottles, jars, rolls, etc.)

---

## Available Units

### 1. **Countable Items**
```
piece    → Individual items (default)
box      → Boxed quantities
pack     → Packed quantities
dozen    → 12 units
```

**Use Cases:**
- Retail products
- Electronics
- Clothing
- Books
- Toys

**Example:**
```
Product: T-Shirt
Unit: piece
Stock: 50 pieces
```

### 2. **Liquids**
```
liter    → 1000 milliliters
ml       → Milliliters (1/1000 liter)
```

**Use Cases:**
- Beverages
- Oils
- Sauces
- Perfumes
- Cleaning products

**Example:**
```
Product: Olive Oil
Unit: liter
Stock: 25 liters
```

### 3. **Weight**
```
kg       → Kilogram (1000 grams)
gram     → Gram (1/1000 kilogram)
```

**Use Cases:**
- Food items
- Spices
- Coffee beans
- Sugar
- Flour

**Example:**
```
Product: Coffee Beans
Unit: kg
Stock: 100 kg
```

### 4. **Length**
```
meter    → 1 meter
cm       → Centimeter (1/100 meter)
```

**Use Cases:**
- Fabrics
- Rope
- Cables
- Pipes
- Tubing

**Example:**
```
Product: Cotton Fabric
Unit: meter
Stock: 500 meters
```

### 5. **Custom Units**
```
custom   → Define your own unit
```

**Use Cases:**
- Bottles
- Jars
- Rolls
- Bundles
- Cartons
- Crates
- Pallets

**Example:**
```
Product: Wine
Unit: custom
Custom Unit: bottle
Stock: 240 bottles
```

---

## How to Add Products with Units

### Step 1: Open Products Modal
1. Click **"Products"** button (left sidebar)
2. Click **"Add Product"** button

### Step 2: Fill Basic Information
```
Product Name: Premium Coffee Beans
SKU: COFFEE-001
Price: 15.99
Stock: 100
Category: Beverages
```

### Step 3: Select Unit of Measurement

**For Countable Items:**
- Unit: **piece** (default)
- Stock: 50 pieces

**For Liquids:**
- Unit: **liter**
- Stock: 25 liters

**For Weight:**
- Unit: **kg**
- Stock: 100 kg

**For Length:**
- Unit: **meter**
- Stock: 500 meters

**For Custom Units:**
- Unit: **custom**
- Custom Unit Name: **bottle**
- Stock: 240 bottles

### Step 4: Add Inventory Settings
```
Reorder Point: 20
Safety Stock: 10
Lead Time: 5 days
Supplier: Coffee Imports Inc
Warehouse: WH-001
```

### Step 5: Save Product
Click **"Add Product"** button

---

## Example Products

### Example 1: Liquid Product
```
Name: Olive Oil
SKU: OIL-001
Price: 12.50
Stock: 50
Unit: liter
Category: Cooking
Reorder Point: 10
Safety Stock: 5
Supplier: Italian Imports
```

**Display:**
```
Olive Oil (OIL-001)
Status: Active
Unit: liter
Stock: 50 liters
Category: Cooking
Price: $12.50
```

### Example 2: Weight Product
```
Name: Ground Coffee
SKU: COFFEE-GROUND-001
Price: 8.99
Stock: 500
Unit: gram
Category: Beverages
Reorder Point: 100
Safety Stock: 50
Supplier: Coffee Roasters
```

**Display:**
```
Ground Coffee (COFFEE-GROUND-001)
Status: Active
Unit: gram
Stock: 500 grams
Category: Beverages
Price: $8.99
```

### Example 3: Custom Unit Product
```
Name: Wine Bottle
SKU: WINE-RED-001
Price: 25.00
Stock: 120
Unit: custom
Custom Unit: bottle
Category: Beverages
Reorder Point: 24
Safety Stock: 12
Supplier: Vineyard Co
```

**Display:**
```
Wine Bottle (WINE-RED-001)
Status: Active
Unit: bottle
Stock: 120 bottles
Category: Beverages
Price: $25.00
```

### Example 4: Fabric Product
```
Name: Cotton Fabric
SKU: FABRIC-COTTON-001
Price: 5.50
Stock: 1000
Unit: meter
Category: Textiles
Reorder Point: 200
Safety Stock: 100
Supplier: Textile Mills
```

**Display:**
```
Cotton Fabric (FABRIC-COTTON-001)
Status: Active
Unit: meter
Stock: 1000 meters
Category: Textiles
Price: $5.50
```

---

## Product Display with Units

### In Products List
```
✅ Premium Coffee Beans (COFFEE-001)
   Status: Active 🟢
   Unit: kg
   Stock: 100 kg (GREEN - healthy)
   Price: $15.99
   Supplier: Coffee Inc
   [Copy] [View] [Edit] [Delete]

✅ Olive Oil (OIL-001)
   Status: Active 🟢
   Unit: liter
   Stock: 50 liters (GREEN - healthy)
   Price: $12.50
   Supplier: Oil Imports
   [Copy] [View] [Edit] [Delete]

✅ Wine Bottle (WINE-RED-001)
   Status: Active 🟢
   Unit: bottle
   Stock: 120 bottles (GREEN - healthy)
   Price: $25.00
   Supplier: Vineyard Co
   [Copy] [View] [Edit] [Delete]
```

### In Product Details Modal
```
Name: Premium Coffee Beans
SKU: COFFEE-001
Price: $15.99
Unit: kg
Stock: 100 kg
Category: Beverages
Reorder Point: 20 kg
Safety Stock: 10 kg
Supplier: Coffee Inc
Lead Time: 5 days
Status: Active
```

---

## Stock Management with Units

### Monitoring Stock Levels
```
Product: Coffee Beans
Unit: kg
Stock: 100 kg
Reorder Point: 20 kg
Status: ✅ Healthy (100 > 20)

Product: Olive Oil
Unit: liter
Stock: 5 liters
Reorder Point: 10 liters
Status: ⚠️ Low Stock (5 < 10)

Product: Wine
Unit: bottle
Stock: 0 bottles
Reorder Point: 24 bottles
Status: 🔴 Out of Stock (0 < 24)
```

### Stock Alerts
```
Low Stock Alert:
- Olive Oil: 5 liters (below 10 liters reorder point)
- Action: Reorder 50 liters

Out of Stock Alert:
- Wine: 0 bottles (below 24 bottles reorder point)
- Action: Urgent reorder 100 bottles
```

---

## Editing Products with Units

### To Change Unit:
1. Click **Edit** on product
2. Change **Unit of Measurement** dropdown
3. Update **Stock** value if needed
4. Click **Update Product**

### Example: Convert Grams to Kilograms
```
Before:
Unit: gram
Stock: 5000 grams

After:
Unit: kg
Stock: 5 kg
(Same amount, different unit)
```

---

## Dashboard Display

### Health Score Calculation
```
Considers:
- Stock levels (in units)
- Reorder points (in units)
- Safety stock (in units)
- Product status
- Alert counts

Example:
Coffee (100 kg vs 20 kg reorder) = Healthy
Olive Oil (5 liters vs 10 liters reorder) = Warning
Wine (0 bottles vs 24 bottles reorder) = Critical
```

### Stock Value Calculation
```
Stock Value = Stock Quantity × Price

Example:
Coffee: 100 kg × $15.99 = $1,599.00
Olive Oil: 5 liters × $12.50 = $62.50
Wine: 0 bottles × $25.00 = $0.00
```

---

## Reporting with Units

### Inventory Report
```
Product: Coffee Beans
SKU: COFFEE-001
Unit: kg
Stock: 100 kg
Price: $15.99/kg
Total Value: $1,599.00
Reorder Point: 20 kg
Status: Active
```

### Stock Alert Report
```
Alert: Low Stock
Product: Olive Oil
Current: 5 liters
Threshold: 10 liters
Unit: liter
Action: Reorder
```

---

## Best Practices

✅ **Choose Appropriate Units**
- Use smallest practical unit for precision
- Use larger units for bulk items
- Use custom units for unique products

✅ **Consistent Units**
- Keep same unit for same product type
- Don't mix units for same product
- Update all related fields when changing units

✅ **Reorder Points**
- Set reorder points in same unit
- Consider lead time when setting points
- Account for safety stock

✅ **Stock Tracking**
- Monitor stock in correct units
- Alert when below reorder point
- Track usage patterns

✅ **Reporting**
- Export reports with units
- Include unit in all reports
- Track historical data with units

---

## Common Scenarios

### Scenario 1: Beverage Shop
```
Coffee (kg) - 100 kg in stock
Milk (liter) - 50 liters in stock
Wine (bottle) - 120 bottles in stock
Juice (ml) - 500 ml in stock
```

### Scenario 2: Fabric Store
```
Cotton (meter) - 500 meters in stock
Silk (meter) - 200 meters in stock
Lace (cm) - 10000 cm in stock
Thread (piece) - 1000 pieces in stock
```

### Scenario 3: Grocery Store
```
Rice (kg) - 200 kg in stock
Flour (gram) - 50000 grams in stock
Oil (liter) - 100 liters in stock
Eggs (dozen) - 50 dozens in stock
```

### Scenario 4: Pharmacy
```
Tablets (piece) - 5000 pieces in stock
Syrup (ml) - 500 ml in stock
Powder (gram) - 1000 grams in stock
Cream (custom: tube) - 200 tubes in stock
```

---

## Troubleshooting

### Unit Not Showing?
1. Refresh Products Modal
2. Check product was saved with unit
3. Verify unit field in database

### Custom Unit Not Appearing?
1. Select "custom" from dropdown
2. Enter custom unit name
3. Save product
4. Refresh to see custom unit

### Stock Calculations Wrong?
1. Verify unit is correct
2. Check reorder point unit matches
3. Ensure stock value is in correct unit

---

## Summary

Your inventory system now supports:

✅ **10 Standard Units** (piece, kg, gram, liter, ml, meter, cm, box, pack, dozen)
✅ **Custom Units** (bottle, jar, roll, bundle, carton, crate, pallet, etc.)
✅ **Unit Display** (shown in products list and details)
✅ **Stock Tracking** (with correct units)
✅ **Alerts** (based on unit quantities)
✅ **Reporting** (includes units in exports)
✅ **Dashboard** (calculates metrics with units)

**Your shop can now handle any product type!** 🎉
