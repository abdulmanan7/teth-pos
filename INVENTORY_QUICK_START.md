# Inventory System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Start the Application
```bash
pnpm dev:electron:watch
```

### Step 2: Access Admin Panel
1. Look for **"Admin"** button in top-right corner (below time/date)
2. Click to open Admin Panel
3. You'll see 4 management sections

## 📦 Managing Warehouses

### Create a Warehouse
1. Click **"Warehouses"** card
2. Click **"Add Warehouse"** button
3. Fill in details:
   - **Name**: e.g., "Main Warehouse"
   - **Code**: e.g., "WH-001" (must be unique)
   - **Address**: Street address
   - **City**: City name
   - **State**: State/Province
   - **ZIP Code**: Postal code
   - **Phone**: Contact number
   - **Email**: Contact email
4. Click **"Create Warehouse"**

### Edit a Warehouse
1. Find warehouse in list
2. Click **Edit** (pencil icon)
3. Modify fields
4. Click **"Update Warehouse"**

### Delete a Warehouse
1. Find warehouse in list
2. Click **Delete** (trash icon)
3. Confirm deletion

## 📋 Managing Lot Numbers

### Create a Lot Number
1. Click **"Lot Numbers"** card
2. Click **"Add Lot"** button
3. Fill in details:
   - **Lot Number**: e.g., "LOT-2024-001" (unique)
   - **Product ID**: Link to product
   - **Quantity**: Stock amount
   - **Warehouse ID**: Where it's stored
   - **Manufacture Date**: Optional
   - **Expiry Date**: Important!
   - **Notes**: Optional details
4. Click **"Create Lot"**

### Status Indicators
- 🔴 **EXPIRED** - Red badge, lot is past expiry
- 🟡 **EXPIRING SOON** - Yellow badge, expires within 30 days
- 🟢 **ACTIVE** - Normal display, lot is good

### Edit a Lot
1. Find lot in list
2. Click **Edit** (pencil icon)
3. Update information
4. Click **"Update Lot"**

### Delete a Lot
1. Find lot in list
2. Click **Delete** (trash icon)
3. Confirm deletion

## 🔄 Managing Reorder Rules

### Create a Reorder Rule
1. Click **"Reorder Rules"** card
2. Click **"Add Rule"** button
3. Fill in parameters:
   - **Product ID**: Which product (required)
   - **Warehouse ID**: Optional, for specific warehouse
   - **Minimum Quantity**: Lowest acceptable stock
   - **Reorder Point**: When to trigger reorder (required)
   - **Reorder Quantity**: How much to order (required)
   - **Safety Stock**: Buffer stock (optional)
   - **Lead Time Days**: Supplier lead time (optional)
4. Click **"Create Rule"**

### Example Reorder Rule
```
Product: PROD-123
Warehouse: WH-001
Minimum Quantity: 10
Reorder Point: 50
Reorder Quantity: 200
Safety Stock: 20
Lead Time: 7 days
```
This means: When stock drops to 50 units, order 200 more units.

### Edit a Rule
1. Find rule in list
2. Click **Edit** (pencil icon)
3. Modify parameters
4. Click **"Update Rule"**

### Delete a Rule
1. Find rule in list
2. Click **Delete** (trash icon)
3. Confirm deletion

## 💡 Tips & Best Practices

### Warehouse Management
- Use consistent naming convention (e.g., "Main Warehouse", "Branch 1")
- Use unique codes (e.g., WH-001, WH-002)
- Keep contact information updated
- One warehouse per location

### Lot Number Tracking
- Always set expiry dates for perishable items
- Use clear lot number format (e.g., LOT-YYYY-MM-###)
- Add notes for special handling requirements
- Monitor expiring lots regularly

### Reorder Rules
- Set reorder point above minimum quantity
- Consider lead time when setting reorder point
- Use safety stock for critical items
- Review rules quarterly

## ⚠️ Important Notes

- **Unique Values**: Warehouse codes and lot numbers must be unique
- **Required Fields**: Some fields are mandatory (marked with *)
- **Confirmation**: Deletions require confirmation
- **Validation**: Forms check for required fields before saving
- **Real-time Updates**: Lists update immediately after changes

## 🔍 Troubleshooting

### "Warehouse code already exists"
- Use a different code
- Check existing warehouses first

### "Lot number already exists"
- Use a different lot number
- Check existing lots first

### Form won't submit
- Check all required fields are filled
- Look for red error messages
- Verify data format (numbers vs text)

### Changes not showing
- Wait for list to refresh
- Try clicking "Add" button again
- Check browser console for errors

## 📊 What's Coming Soon

- ✨ Serial number management
- ✨ Stock adjustment workflow
- ✨ Inventory analytics dashboard
- ✨ Transaction history
- ✨ Low stock alerts
- ✨ Expiry date notifications
- ✨ Barcode scanning
- ✨ Inventory reports

## 🆘 Need Help?

Refer to:
- `INVENTORY_SYSTEM.md` - Complete system documentation
- `FRONTEND_INVENTORY_IMPLEMENTATION.md` - Frontend details
- API endpoints in `server/index.ts`

---

**Version**: 1.0  
**Last Updated**: October 26, 2025  
**Status**: Production Ready
