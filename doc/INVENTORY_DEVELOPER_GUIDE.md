# Inventory Module - Developer Quick Reference

## 📚 Service Classes Usage

### 1. Stock Movement Service
```php
use Workdo\Inventory\Services\StockMovementService;

$service = new StockMovementService();

// Record stock in
$service->recordStockIn([
    'product_id' => 1,
    'warehouse_id' => 1,
    'quantity' => 100,
    'unit_cost' => 50.00,
    'lot_number_id' => 5, // optional
    'serial_number_id' => 10, // optional
    'transaction_type' => 'purchase_in',
    'description' => 'Purchase order #PO-123',
    'source_type' => 'App\Models\Purchase',
    'source_id' => 123
]);

// Record stock out
$service->recordStockOut([
    'product_id' => 1,
    'warehouse_id' => 1,
    'quantity' => 50,
    'unit_price' => 75.00,
    'transaction_type' => 'sale_out',
    'description' => 'Sales order #SO-456',
    'source_type' => 'App\Models\SalesOrder',
    'source_id' => 456
]);

// Check availability
$available = $service->checkAvailability($productId, $warehouseId, $quantity);

// Get stock ledger
$ledger = $service->getStockLedger($productId, $warehouseId, $startDate, $endDate);
```

### 2. Inventory Valuation Service
```php
use Workdo\Inventory\Services\InventoryValuationService;

$service = new InventoryValuationService();

// Calculate FIFO valuation
$valuation = $service->calculateFIFOValuation($productId, $warehouseId);

// Calculate LIFO valuation
$valuation = $service->calculateLIFOValuation($productId, $warehouseId);

// Calculate Weighted Average
$valuation = $service->calculateWeightedAverageValuation($productId, $warehouseId);

// Calculate Moving Average
$valuation = $service->calculateMovingAverageValuation($productId, $warehouseId);

// Get valuation for all products
$allValuations = $service->calculateAllProductsValuation($warehouseId, 'fifo');
```

### 3. Reorder Service
```php
use Workdo\Inventory\Services\ReorderService;

$service = new ReorderService();

// Check all reorder points
$productsToReorder = $service->checkAllReorderPoints($workspaceId);

// Get reorder recommendations with analytics
$recommendations = $service->getReorderRecommendations($workspaceId);

// Calculate EOQ
$eoq = $service->calculateEOQ($annualDemand, $orderCost, $holdingCostPerUnit);

// Calculate safety stock
$safetyStock = $service->calculateSafetyStock($avgDailyDemand, $maxLeadTimeDays, $avgLeadTimeDays);

// Send reorder alert
$service->sendReorderAlert($reorderItem);

// Auto-create purchase order
$po = $service->autoCreatePurchaseOrder($reorderItem);
```

### 4. Inventory Analytics Service
```php
use Workdo\Inventory\Services\InventoryAnalyticsService;

$service = new InventoryAnalyticsService();

// Get dashboard KPIs
$kpis = $service->getDashboardKPIs();

// Calculate turnover ratio
$turnover = $service->calculateTurnoverRatio($productId, $warehouseId, $periodDays);

// Calculate days on hand
$doh = $service->calculateDaysOnHand($productId, $warehouseId, $periodDays);

// Identify dead stock
$deadStock = $service->identifyDeadStock($daysThreshold);

// Identify slow-moving items
$slowMoving = $service->identifySlowMovingItems($periodDays, $movementThreshold);

// Identify fast-moving items
$fastMoving = $service->identifyFastMovingItems($periodDays, $limit);

// Calculate ABC classification
$abcClassification = $service->calculateABCClassification($periodDays);

// Get stock aging report
$agingReport = $service->getStockAgingReport($warehouseId);

// Calculate fill rate
$fillRate = $service->calculateFillRate($periodDays);

// Calculate inventory accuracy
$accuracy = $service->calculateInventoryAccuracy();
```

### 5. Import/Export Service
```php
use Workdo\Inventory\Services\InventoryImportExportService;

$service = new InventoryImportExportService();

// Export inventory
$result = $service->exportInventory($warehouseId, 'xlsx'); // or 'csv'
// Returns: ['success' => true, 'filename' => '...', 'filepath' => '...']

// Export lot numbers
$result = $service->exportLotNumbers($warehouseId, 'xlsx');

// Export serial numbers
$result = $service->exportSerialNumbers($warehouseId, 'xlsx');

// Import inventory
$result = $service->importInventory($filePath, $updateExisting = true);
// Returns: ['success' => true, 'imported' => 10, 'updated' => 5, 'errors' => [...]]

// Get import template
$result = $service->getImportTemplate('inventory'); // or 'lot_numbers'
```

### 6. Expiry Alert Service
```php
use Workdo\Inventory\Services\ExpiryAlertService;

$service = new ExpiryAlertService();

// Get expiring products
$expiring = $service->getExpiringProducts($daysThreshold);

// Get expired products
$expired = $service->getExpiredProducts();

// Send expiry notifications
$service->sendExpiryNotifications($expiringProducts, $alertType);

// Get FEFO picking suggestions
$pickingList = $service->getFEFOPickingSuggestions($productId, $warehouseId, $quantity);
```

---

## 🎯 Model Relationships

### LotNumber Model
```php
// Get product
$lot->product; // belongsTo ProductService

// Get warehouse
$lot->warehouse; // belongsTo Warehouse

// Get serial numbers
$lot->serials; // hasMany SerialNumber

// Get transactions
$lot->transactions; // hasMany InventoryTransaction
```

### SerialNumber Model
```php
// Get product
$serial->product; // belongsTo ProductService

// Get lot
$serial->lot; // belongsTo LotNumber

// Get warehouse
$serial->warehouse; // belongsTo Warehouse

// Get transactions
$serial->transactions; // hasMany InventoryTransaction
```

### StockAdjustment Model
```php
// Get adjustment lines
$adjustment->lines; // hasMany StockAdjustmentLine

// Get warehouse
$adjustment->warehouse; // belongsTo Warehouse

// Get creator
$adjustment->creator; // belongsTo User

// Get approver
$adjustment->approver; // belongsTo User
```

### CycleCount Model
```php
// Get count lines
$count->lines; // hasMany CycleCountLine

// Get warehouse
$count->warehouse; // belongsTo Warehouse

// Get creator
$count->creator; // belongsTo User
```

### Backorder Model
```php
// Get product
$backorder->product; // belongsTo ProductService

// Get customer
$backorder->customer; // belongsTo Customer

// Get sales invoice
$backorder->invoice; // belongsTo Invoice

// Get warehouse
$backorder->warehouse; // belongsTo Warehouse
```

### SalesReturn Model
```php
// Get return lines
$return->lines; // hasMany SalesReturnLine

// Get invoice
$return->invoice; // belongsTo Invoice

// Get customer
$return->customer; // belongsTo Customer

// Get warehouse
$return->warehouse; // belongsTo Warehouse
```

### PurchaseReturn Model
```php
// Get return lines
$return->lines; // hasMany PurchaseReturnLine

// Get purchase
$return->purchase; // belongsTo Purchase

// Get vendor
$return->vendor; // belongsTo Vendor

// Get warehouse
$return->warehouse; // belongsTo Warehouse
```

---

## 🔄 Common Workflows

### Workflow 1: Receiving Stock with Lot Number
```php
use Workdo\Inventory\Entities\LotNumber;
use Workdo\Inventory\Services\StockMovementService;

// 1. Create lot number
$lot = LotNumber::create([
    'product_id' => $productId,
    'lot_number' => 'LOT-' . date('Ymd') . '-001',
    'manufacture_date' => now(),
    'expiry_date' => now()->addYear(),
    'initial_quantity' => 100,
    'current_quantity' => 100,
    'status' => 'active',
    'warehouse_id' => $warehouseId,
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 2. Record stock in
$service = new StockMovementService();
$service->recordStockIn([
    'product_id' => $productId,
    'warehouse_id' => $warehouseId,
    'lot_number_id' => $lot->id,
    'quantity' => 100,
    'unit_cost' => 50.00,
    'transaction_type' => 'purchase_in',
    'source_type' => 'App\Models\Purchase',
    'source_id' => $purchaseId,
]);
```

### Workflow 2: Selling Stock with Serial Numbers
```php
use Workdo\Inventory\Entities\SerialNumber;
use Workdo\Inventory\Services\StockMovementService;

// 1. Find available serial
$serial = SerialNumber::where('product_id', $productId)
    ->where('warehouse_id', $warehouseId)
    ->where('status', 'available')
    ->first();

// 2. Record stock out
$service = new StockMovementService();
$service->recordStockOut([
    'product_id' => $productId,
    'warehouse_id' => $warehouseId,
    'serial_number_id' => $serial->id,
    'quantity' => 1,
    'unit_price' => 75.00,
    'transaction_type' => 'sale_out',
    'source_type' => 'App\Models\Invoice',
    'source_id' => $invoiceId,
]);

// Serial status automatically updated to 'sold'
```

### Workflow 3: Stock Adjustment
```php
use Workdo\Inventory\Entities\StockAdjustment;
use Workdo\Inventory\Entities\StockAdjustmentLine;

// 1. Create adjustment
$adjustment = StockAdjustment::create([
    'adjustment_number' => StockAdjustment::generateAdjustmentNumber(),
    'warehouse_id' => $warehouseId,
    'adjustment_date' => now(),
    'reason' => 'Physical count correction',
    'status' => 'pending',
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 2. Add adjustment lines
StockAdjustmentLine::create([
    'adjustment_id' => $adjustment->id,
    'product_id' => $productId,
    'system_quantity' => 100,
    'actual_quantity' => 95,
    'variance' => -5,
    'unit_cost' => 50.00,
    'reason' => 'Damaged items',
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 3. Approve and apply
$adjustment->status = 'approved';
$adjustment->approved_by = auth()->id();
$adjustment->approved_at = now();
$adjustment->save();

// Stock movement service will handle the actual adjustment
```

### Workflow 4: Cycle Count
```php
use Workdo\Inventory\Entities\CycleCount;
use Workdo\Inventory\Entities\CycleCountLine;

// 1. Create cycle count
$count = CycleCount::create([
    'count_number' => CycleCount::generateCountNumber(),
    'warehouse_id' => $warehouseId,
    'count_date' => now(),
    'status' => 'in_progress',
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 2. Add count lines (products to count)
CycleCountLine::create([
    'cycle_count_id' => $count->id,
    'product_id' => $productId,
    'location_id' => $locationId,
    'system_quantity' => 100,
    'counted_quantity' => 98,
    'variance' => -2,
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 3. Complete count
$count->status = 'completed';
$count->completed_at = now();

// Calculate accuracy
$totalItems = $count->lines->count();
$accurateItems = $count->lines->where('variance', 0)->count();
$count->accuracy_percentage = ($accurateItems / $totalItems) * 100;
$count->save();
```

### Workflow 5: Processing Sales Return
```php
use Workdo\Inventory\Entities\SalesReturn;
use Workdo\Inventory\Entities\SalesReturnLine;
use Workdo\Inventory\Services\StockMovementService;

// 1. Create return
$return = SalesReturn::create([
    'return_number' => SalesReturn::generateReturnNumber(),
    'invoice_id' => $invoiceId,
    'customer_id' => $customerId,
    'warehouse_id' => $warehouseId,
    'return_date' => now(),
    'reason' => 'Defective product',
    'status' => 'pending',
    'refund_method' => 'credit',
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 2. Add return lines
SalesReturnLine::create([
    'return_id' => $return->id,
    'product_id' => $productId,
    'quantity' => 2,
    'unit_price' => 75.00,
    'line_total' => 150.00,
    'condition' => 'defective',
    'disposition' => 'repair', // or 'restock', 'scrap'
    'workspace_id' => getActiveWorkSpace(),
    'created_by' => creatorId(),
]);

// 3. Calculate refund
$return->refund_amount = $return->calculateRefundAmount();
$return->save();

// 4. Approve return
$return->status = 'approved';
$return->save();

// 5. If disposition is 'restock', add back to inventory
if ($line->disposition === 'restock') {
    $service = new StockMovementService();
    $service->recordStockIn([
        'product_id' => $line->product_id,
        'warehouse_id' => $return->warehouse_id,
        'quantity' => $line->quantity,
        'transaction_type' => 'return_in',
        'source_type' => 'Workdo\Inventory\Entities\SalesReturn',
        'source_id' => $return->id,
    ]);
}
```

---

## 🛠️ Helper Functions

### Generate Unique Numbers
```php
// Lot number
$lotNumber = 'LOT-' . date('Ymd') . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);

// Serial number
$serialNumber = 'SN-' . date('Ymd') . '-' . str_pad($sequence, 6, '0', STR_PAD_LEFT);

// Adjustment number
$adjustmentNumber = StockAdjustment::generateAdjustmentNumber();

// Return number
$returnNumber = SalesReturn::generateReturnNumber(); // SR-YYYYMMDD-####
$returnNumber = PurchaseReturn::generateReturnNumber(); // PR-YYYYMMDD-####

// Count number
$countNumber = CycleCount::generateCountNumber();
```

### Workspace-aware Queries
```php
// Always include workspace filter
$items = Model::where('workspace_id', getActiveWorkSpace())
    ->where('created_by', creatorId())
    ->get();

// For warehouse products (uses 'workspace' not 'workspace_id')
$warehouseProducts = WarehouseProduct::where('workspace', getActiveWorkSpace())
    ->get();
```

### Permission Checks
```php
// Check permission
if (auth()->user()->isAbleTo('lot manage')) {
    // User has permission
}

// In controller
if (!\Auth::user()->isAbleTo('inventory valuation calculate')) {
    return redirect()->back()->with('error', __('Permission denied'));
}
```

---

## 📧 Sending Notifications

### Expiry Alert
```php
use Workdo\Inventory\Mail\ExpiryAlertMail;

$users = User::where('workspace_id', getActiveWorkSpace())
    ->whereHas('roles', function($q) {
        $q->where('name', 'admin')->orWhere('name', 'inventory_manager');
    })
    ->get();

foreach ($users as $user) {
    Mail::to($user->email)->send(new ExpiryAlertMail($expiringProducts, 'urgent'));
}
```

### Low Stock Alert
```php
use Workdo\Inventory\Mail\LowStockAlertMail;

Mail::to($managerEmail)->send(new LowStockAlertMail(
    $product,
    $warehouse,
    $currentStock,
    $reorderLevel
));
```

### Reorder Alert
```php
use Workdo\Inventory\Mail\ReorderAlertMail;

Mail::to($purchasingEmail)->send(new ReorderAlertMail($reorderItem));
```

---

## 🎨 Blade View Examples

### Display Lot Information
```blade
@if($product->lots->count() > 0)
    <h4>Available Lots</h4>
    <table class="table">
        <thead>
            <tr>
                <th>Lot Number</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($product->lots as $lot)
            <tr class="{{ $lot->status === 'expired' ? 'table-danger' : '' }}">
                <td>{{ $lot->lot_number }}</td>
                <td>{{ $lot->expiry_date ? $lot->expiry_date->format('Y-m-d') : 'N/A' }}</td>
                <td>{{ $lot->current_quantity }}</td>
                <td>
                    <span class="badge badge-{{ $lot->status === 'active' ? 'success' : 'danger' }}">
                        {{ ucfirst($lot->status) }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
@endif
```

### Display Serial Numbers
```blade
<select name="serial_number_id" class="form-control">
    <option value="">Select Serial Number</option>
    @foreach($availableSerials as $serial)
        <option value="{{ $serial->id }}">
            {{ $serial->serial_number }} 
            @if($serial->lot)
                (Lot: {{ $serial->lot->lot_number }})
            @endif
        </option>
    @endforeach
</select>
```

### Display Analytics Dashboard
```blade
<div class="row">
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>Total Inventory Value</h5>
                <h2>${{ number_format($kpis['total_inventory_value'], 2) }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>Low Stock Items</h5>
                <h2>{{ $kpis['low_stock_items'] }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>Inventory Turnover</h5>
                <h2>{{ $kpis['inventory_turnover'] }}</h2>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                <h5>Fill Rate</h5>
                <h2>{{ $kpis['fill_rate'] }}%</h2>
            </div>
        </div>
    </div>
</div>
```

---

## 🐛 Debugging Tips

### Check Stock Movement History
```php
use Workdo\Inventory\Entities\InventoryTransaction;

$history = InventoryTransaction::where('product_id', $productId)
    ->where('warehouse_id', $warehouseId)
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($history as $transaction) {
    logger()->info('Transaction: ' . $transaction->transaction_type . 
                   ' Qty: ' . $transaction->quantity . 
                   ' Date: ' . $transaction->created_at);
}
```

### Verify Workspace Isolation
```php
// Ensure queries are workspace-aware
$count = Model::where('workspace_id', getActiveWorkSpace())->count();
logger()->info("Records in current workspace: {$count}");

// Check for cross-workspace data leakage
$allWorkspaces = Model::distinct('workspace_id')->pluck('workspace_id');
logger()->info("Data exists in workspaces: " . $allWorkspaces->implode(', '));
```

### Test Console Commands
```bash
# Run with verbose output
php artisan inventory:check-expiring -v

# Test specific workspace
php artisan inventory:check-reorder --workspace=1

# Dry run (no emails sent)
php artisan inventory:daily-report --email=test@example.com
```

---

## 🚀 Performance Optimization

### Eager Loading
```php
// Bad - N+1 queries
$lots = LotNumber::all();
foreach ($lots as $lot) {
    echo $lot->product->name; // Each iteration hits DB
}

// Good - Eager loading
$lots = LotNumber::with('product', 'warehouse')->get();
foreach ($lots as $lot) {
    echo $lot->product->name; // No additional queries
}
```

### Caching Analytics
```php
use Illuminate\Support\Facades\Cache;

// Cache expensive analytics for 1 hour
$kpis = Cache::remember('inventory_kpis_' . getActiveWorkSpace(), 3600, function () {
    $service = new InventoryAnalyticsService();
    return $service->getDashboardKPIs();
});
```

### Batch Operations
```php
// Bulk insert serial numbers
$serials = [];
for ($i = 1; $i <= 1000; $i++) {
    $serials[] = [
        'product_id' => $productId,
        'serial_number' => 'SN-' . str_pad($i, 6, '0', STR_PAD_LEFT),
        'status' => 'available',
        'warehouse_id' => $warehouseId,
        'workspace_id' => getActiveWorkSpace(),
        'created_by' => creatorId(),
        'created_at' => now(),
        'updated_at' => now(),
    ];
}
SerialNumber::insert($serials);
```

---

## 📖 References

- **Models Location:** `packages/workdo/Inventory/src/Entities/`
- **Services Location:** `packages/workdo/Inventory/src/Services/`
- **Controllers Location:** `packages/workdo/Inventory/src/Http/Controllers/`
- **Migrations Location:** `packages/workdo/Inventory/src/Database/Migrations/`
- **Commands Location:** `packages/workdo/Inventory/src/Console/Commands/`
- **Mail Templates:** `packages/workdo/Inventory/src/Mail/`

---

**Version:** 1.0  
**Last Updated:** October 10, 2025  
**For Questions:** Contact development team


