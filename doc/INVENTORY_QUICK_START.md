# Inventory Enhancement - Quick Start Guide

**Version**: 1.0  
**Date**: October 10, 2025

## Getting Started

This guide helps you quickly deploy and start using the new inventory enhancement features.

## Prerequisites

- Laravel 8.x or higher
- PHP 8.0 or higher
- MySQL 5.7 or higher
- TradooERP base system installed
- Inventory module activated

## Installation Steps

### Step 1: Run Migrations

```bash
# Navigate to project root
cd /Users/macbookpro/Sites/tradooerp

# Run migrations
php artisan migrate

# Expected output:
# - Migration: 2025_10_10_100001_create_lot_numbers_table
# - Migration: 2025_10_10_100002_create_serial_numbers_table
# - Migration: 2025_10_10_100003_create_inventory_transactions_table
# - Migration: 2025_10_10_100004_create_inventory_valuations_table
```

### Step 2: Seed Permissions

```bash
# Seed inventory permissions
php artisan db:seed --class=Workdo\\Inventory\\Database\\Seeders\\PermissionTableSeeder

# This will add:
# - lot manage, lot create, lot edit, lot delete, lot show
# - serial manage, serial create, serial edit, serial delete, serial show
```

### Step 3: Clear Caches

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize
php artisan optimize
```

### Step 4: Verify Installation

```bash
# Check if tables exist
php artisan tinker
>>> Schema::hasTable('lot_numbers')
=> true
>>> Schema::hasTable('serial_numbers')
=> true
>>> Schema::hasTable('inventory_transactions')
=> true
>>> Schema::hasTable('inventory_valuations')
=> true
```

## Quick Usage Examples

### Example 1: Create a Lot Number

```php
use Workdo\Inventory\Entities\LotNumber;

// Create a lot manually
$lot = new LotNumber();
$lot->lot_number = LotNumber::generateLotNumber(); // Auto-generates LOT20251010XXXX
$lot->product_id = 1; // Your product ID
$lot->warehouse_id = 1; // Your warehouse ID
$lot->quantity = 100;
$lot->manufacture_date = '2025-10-01';
$lot->expiry_date = '2026-10-01'; // Optional
$lot->status = 'active';
$lot->workspace_id = getActiveWorkSpace();
$lot->created_by = creatorId();
$lot->save();
```

### Example 2: Create Serial Numbers

```php
use Workdo\Inventory\Entities\SerialNumber;

// Create a serial number
$serial = new SerialNumber();
$serial->serial_number = SerialNumber::generateSerialNumber(); // Auto-generates SN20251010XXXXXX
$serial->product_id = 1;
$serial->lot_id = $lot->id; // Link to lot (optional)
$serial->warehouse_id = 1;
$serial->status = 'available';
$serial->workspace_id = getActiveWorkSpace();
$serial->created_by = creatorId();
$serial->save();

// Bulk generate 100 serial numbers
for ($i = 0; $i < 100; $i++) {
    $serial = new SerialNumber();
    $serial->serial_number = SerialNumber::generateSerialNumber();
    $serial->product_id = 1;
    $serial->lot_id = $lot->id;
    $serial->warehouse_id = 1;
    $serial->status = 'available';
    $serial->workspace_id = getActiveWorkSpace();
    $serial->created_by = creatorId();
    $serial->save();
}
```

### Example 3: Create Inventory Transaction

```php
use Workdo\Inventory\Entities\InventoryTransaction;

// Record a stock-in transaction
InventoryTransaction::createTransaction([
    'product_id' => 1,
    'warehouse_id' => 1,
    'lot_id' => $lot->id,
    'transaction_type' => 'in',
    'quantity' => 100,
    'unit_cost' => 50.00,
    'reference_type' => 'purchase',
    'reference_id' => 123, // Purchase ID
    'description' => 'Received 100 units from supplier',
]);

// Record a stock-out transaction
InventoryTransaction::createTransaction([
    'product_id' => 1,
    'warehouse_id' => 1,
    'lot_id' => $lot->id,
    'serial_id' => $serial->id,
    'transaction_type' => 'out',
    'quantity' => 1,
    'reference_type' => 'invoice',
    'reference_id' => 456, // Invoice ID
    'description' => 'Sold 1 unit to customer',
]);
```

### Example 4: Calculate Inventory Valuation

```php
use Workdo\Inventory\Services\InventoryValuationService;

$service = new InventoryValuationService();

// Calculate FIFO valuation
$fifoResult = $service->calculateFIFO(
    $productId = 1,
    $warehouseId = 1,
    $asOfDate = now()
);

echo "FIFO Valuation:\n";
echo "Unit Cost: " . $fifoResult['unit_cost'] . "\n";
echo "Total Quantity: " . $fifoResult['total_quantity'] . "\n";
echo "Total Value: " . $fifoResult['total_value'] . "\n";

// Calculate all methods at once
$comparison = $service->compareValuationMethods(1, 1);

echo "\nValuation Comparison:\n";
foreach ($comparison as $method => $result) {
    echo "$method: Unit Cost = {$result['unit_cost']}, Total Value = {$result['total_value']}\n";
}

// Save valuation to database
$valuation = $service->saveValuation(
    $productId = 1,
    $warehouseId = 1,
    $method = 'FIFO',
    $calculationDate = now()
);
```

### Example 5: Get COGS for a Sale

```php
use Workdo\Inventory\Services\InventoryValuationService;

$service = new InventoryValuationService();

// Calculate COGS for selling 10 units
$cogs = $service->getCOGS(
    $productId = 1,
    $warehouseId = 1,
    $quantity = 10,
    $method = 'FIFO'
);

echo "COGS for 10 units: $" . $cogs;
```

### Example 6: Check Expiring Lots

```php
use Workdo\Inventory\Entities\LotNumber;

// Get lots expiring in next 30 days
$expiringLots = LotNumber::where('workspace_id', getActiveWorkSpace())
    ->where('status', 'active')
    ->whereDate('expiry_date', '>=', now())
    ->whereDate('expiry_date', '<=', now()->addDays(30))
    ->get();

foreach ($expiringLots as $lot) {
    $daysUntilExpiry = $lot->daysUntilExpiry();
    echo "Lot: {$lot->lot_number} expires in {$daysUntilExpiry} days\n";
}
```

### Example 7: Track Serial Number History

```php
use Workdo\Inventory\Entities\SerialNumber;

// Lookup a serial number
$serial = SerialNumber::where('serial_number', 'SN20251010000001')
    ->where('workspace_id', getActiveWorkSpace())
    ->first();

if ($serial) {
    echo "Serial: {$serial->serial_number}\n";
    echo "Status: {$serial->status}\n";
    echo "Product: {$serial->product->name}\n";
    
    // Get history
    $history = $serial->getHistory();
    echo "\nTransaction History:\n";
    foreach ($history as $transaction) {
        echo "{$transaction->transaction_date}: {$transaction->transaction_type} - {$transaction->quantity} units\n";
    }
}
```

### Example 8: Update Serial Status

```php
use Workdo\Inventory\Entities\SerialNumber;

$serial = SerialNumber::find(1);

// Mark as sold
$serial->markAsSold($assignedTo = 'Customer Name');

// Mark as returned
$serial->markAsReturned();

// Mark as defective
$serial->markAsDefective($notes = 'Screen cracked during shipment');

// Mark as available again
$serial->markAsAvailable();
```

## API Endpoints

### Lot Numbers

```bash
# List all lots
GET /inventory/lot-numbers

# Create new lot
POST /inventory/lot-numbers
{
    "product_id": 1,
    "warehouse_id": 1,
    "quantity": 100,
    "manufacture_date": "2025-10-01",
    "expiry_date": "2026-10-01"
}

# Get lot details
GET /inventory/lot-numbers/1

# Update lot
PUT /inventory/lot-numbers/1

# Delete lot
DELETE /inventory/lot-numbers/1

# Adjust lot quantity
POST /inventory/lot-numbers/1/adjust-quantity
{
    "quantity": 95,
    "reason": "Physical count adjustment"
}
```

### Serial Numbers

```bash
# List all serial numbers
GET /inventory/serial-numbers

# Create new serial
POST /inventory/serial-numbers
{
    "product_id": 1,
    "warehouse_id": 1,
    "lot_id": 1,
    "quantity": 10  # For bulk generation
}

# Lookup serial number
POST /inventory/serial-numbers/lookup
{
    "serial_number": "SN20251010000001"
}

# Update serial status
POST /inventory/serial-numbers/1/update-status
{
    "status": "sold",
    "assigned_to": "Customer Name"
}

# Bulk generate
POST /inventory/serial-numbers/bulk-generate
{
    "product_id": 1,
    "warehouse_id": 1,
    "lot_id": 1,
    "quantity": 100
}
```

## Troubleshooting

### Migration Issues

**Problem**: Migration fails with "Table already exists"
```bash
# Solution: Check if table exists
php artisan tinker
>>> Schema::hasTable('lot_numbers')

# If true, skip that migration or drop and recreate
```

**Problem**: Permission seeder fails
```bash
# Solution: Clear cache and try again
php artisan cache:clear
php artisan db:seed --class=Workdo\\Inventory\\Database\\Seeders\\PermissionTableSeeder
```

### Permission Issues

**Problem**: User can't access lot/serial pages
```bash
# Solution: Assign permissions to role
php artisan tinker
>>> $role = App\Models\Role::where('name', 'company')->first();
>>> $permission = App\Models\Permission::where('name', 'lot manage')->first();
>>> $role->givePermission($permission);
```

### Workspace Isolation Issues

**Problem**: Can't see lots/serials from other users
```
# This is expected behavior for workspace isolation
# Each user only sees data from their workspace
# Check: getActiveWorkSpace() returns correct workspace ID
```

## Configuration

### Set Default Valuation Method

```php
// In config or database settings
Setting::set('default_valuation_method', 'FIFO');
// Options: FIFO, LIFO, AVERAGE, MOVING_AVERAGE
```

### Enable/Disable Lot Tracking

```php
// Per product setting
$product->has_lot_tracking = true;
$product->save();
```

### Enable/Disable Serial Tracking

```php
// Per product setting
$product->has_serial_tracking = true;
$product->save();
```

## Best Practices

### 1. Always Use Transactions
```php
DB::beginTransaction();
try {
    // Create lot
    // Create transaction
    // Update stock
    DB::commit();
} catch (\Exception $e) {
    DB::rollback();
    throw $e;
}
```

### 2. Check Workspace Context
```php
// Always verify workspace
if (getActiveWorkSpace() != $expectedWorkspace) {
    abort(403, 'Workspace mismatch');
}
```

### 3. Validate Quantities
```php
// Before creating transactions
if ($quantity <= 0) {
    throw new \Exception('Quantity must be positive');
}

// Check available stock
$availableQty = $lot->quantity;
if ($requestedQty > $availableQty) {
    throw new \Exception('Insufficient stock');
}
```

### 4. Handle Expiry Dates
```php
// Check expiry before selling
if ($lot->isExpired()) {
    throw new \Exception('Cannot sell expired lot');
}

if ($lot->isExpiringSoon(7)) {
    // Send alert
    Log::warning("Lot {$lot->lot_number} expires in 7 days");
}
```

### 5. Use FEFO for Perishables
```php
// Get lot with earliest expiry
$lot = LotNumber::where('product_id', $productId)
    ->where('workspace_id', getActiveWorkSpace())
    ->where('status', 'active')
    ->where('quantity', '>', 0)
    ->orderBy('expiry_date', 'asc')
    ->first();
```

## Performance Tips

### 1. Use Eager Loading
```php
// Instead of N+1 queries
$lots = LotNumber::with(['product', 'warehouse', 'transactions'])->get();
```

### 2. Index Your Queries
```php
// Queries using indexed columns are faster
LotNumber::where('workspace_id', $id)  // Indexed
    ->where('product_id', $id)          // Indexed
    ->where('lot_number', $number)      // Indexed
    ->get();
```

### 3. Batch Operations
```php
// Use bulk inserts for large datasets
SerialNumber::insert($arrayOfSerials);
```

### 4. Cache Valuations
```php
// Cache expensive calculations
$valuation = Cache::remember("valuation_{$productId}_{$warehouseId}", 3600, function() {
    return $service->calculateFIFO($productId, $warehouseId);
});
```

## Next Steps

1. **Test the migrations** on staging environment
2. **Seed test data** to verify functionality
3. **Create views** for user interface
4. **Add DataTables** for listing pages
5. **Implement expiry alerts** (Phase 1.2)
6. **Create valuation reports** (Phase 1.3)
7. **Build stock adjustment module** (Phase 2.1)

## Support

For issues or questions:
- Check `/documentation/INVENTORY_ENHANCEMENT_PLAN.md`
- Check `/documentation/INVENTORY_IMPLEMENTATION_PROGRESS.md`
- Review code comments in model files
- Contact development team

---

**Quick Start Guide Version**: 1.0  
**Last Updated**: October 10, 2025  
**Status**: Ready for Testing


