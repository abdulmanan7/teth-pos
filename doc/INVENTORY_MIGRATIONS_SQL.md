# Inventory Module - Database Migration SQL Commands

This document contains all SQL commands equivalent to the Laravel migrations for the Inventory module.

---

## Table of Contents
1. [Core Inventory Tables](#core-inventory-tables)
2. [Warehouse Management Tables](#warehouse-management-tables)
3. [Inventory Control Tables](#inventory-control-tables)
4. [Returns Management Tables](#returns-management-tables)
5. [Alterations & Updates](#alterations--updates)

---

## Core Inventory Tables

### 1. Lot Numbers Table
```sql
CREATE TABLE IF NOT EXISTS `lot_numbers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `lot_number` VARCHAR(191) NOT NULL,
    `product_id` INT NOT NULL,
    `quantity` INT DEFAULT 0,
    `manufacture_date` DATE NULL,
    `expiry_date` DATE NULL,
    `warehouse_id` INT NOT NULL,
    `status` ENUM('active', 'expired', 'quarantined') DEFAULT 'active',
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    INDEX `idx_warehouse_product` (`warehouse_id`, `product_id`),
    INDEX `idx_lot_number` (`lot_number`),
    INDEX `idx_expiry_date` (`expiry_date`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Serial Numbers Table
```sql
CREATE TABLE IF NOT EXISTS `serial_numbers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `serial_number` VARCHAR(191) NOT NULL UNIQUE,
    `product_id` INT NOT NULL,
    `lot_id` INT NULL,
    `warehouse_id` INT NOT NULL,
    `status` ENUM('available', 'sold', 'returned', 'defective') DEFAULT 'available',
    `assigned_to` VARCHAR(191) NULL,
    `assigned_date` DATE NULL,
    `purchase_date` DATE NULL,
    `sale_date` DATE NULL,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    INDEX `idx_serial_number` (`serial_number`),
    INDEX `idx_status` (`status`),
    INDEX `idx_lot_id` (`lot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Inventory Transactions Table
```sql
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `warehouse_id` INT NOT NULL,
    `lot_id` INT NULL,
    `serial_id` INT NULL,
    `transaction_type` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL,
    `unit_cost` DECIMAL(15, 2) DEFAULT 0.00,
    `reference_type` VARCHAR(100) NULL,
    `reference_id` INT NULL,
    `from_warehouse_id` INT NULL,
    `to_warehouse_id` INT NULL,
    `transaction_date` DATETIME NOT NULL,
    `description` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    INDEX `idx_transaction_date` (`transaction_date`),
    INDEX `idx_lot_id` (`lot_id`),
    INDEX `idx_serial_id` (`serial_id`),
    INDEX `idx_reference` (`reference_type`, `reference_id`),
    INDEX `idx_transaction_type` (`transaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. Inventory Valuations Table
```sql
CREATE TABLE IF NOT EXISTS `inventory_valuations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `warehouse_id` INT NULL,
    `valuation_method` ENUM('FIFO', 'LIFO', 'AVERAGE', 'MOVING_AVERAGE') NOT NULL,
    `unit_cost` DECIMAL(15, 2) DEFAULT 0.00,
    `total_quantity` INT DEFAULT 0,
    `total_value` DECIMAL(15, 2) DEFAULT 0.00,
    `calculation_date` DATE NOT NULL,
    `details` JSON NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    INDEX `idx_workspace_warehouse` (`workspace_id`, `warehouse_id`),
    INDEX `idx_calculation_date` (`calculation_date`),
    INDEX `idx_valuation_method` (`valuation_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Warehouse Management Tables

### 5. Warehouse Locations Table
```sql
CREATE TABLE IF NOT EXISTS `warehouse_locations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `warehouse_id` INT NOT NULL,
    `location_code` VARCHAR(50) NOT NULL,
    `zone` VARCHAR(20) NULL,
    `aisle` VARCHAR(20) NULL,
    `rack` VARCHAR(20) NULL,
    `shelf` VARCHAR(20) NULL,
    `bin` VARCHAR(20) NULL,
    `location_type` ENUM('receiving', 'storage', 'picking', 'shipping', 'quarantine') DEFAULT 'storage',
    `capacity` INT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_warehouse` (`workspace_id`, `warehouse_id`),
    INDEX `idx_location_type` (`location_type`),
    INDEX `idx_is_active` (`is_active`),
    UNIQUE KEY `unique_location_code` (`warehouse_id`, `location_code`, `workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. Product Locations Table
```sql
CREATE TABLE IF NOT EXISTS `product_locations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `warehouse_id` INT NOT NULL,
    `location_id` INT NOT NULL,
    `lot_id` INT NULL,
    `quantity` INT DEFAULT 0,
    `is_primary_location` TINYINT(1) DEFAULT 0,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    INDEX `idx_location_id` (`location_id`),
    INDEX `idx_lot_id` (`lot_id`),
    UNIQUE KEY `unique_product_location_lot` (`product_id`, `location_id`, `lot_id`, `workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Inventory Control Tables

### 7. Stock Adjustments Table
```sql
CREATE TABLE IF NOT EXISTS `stock_adjustments` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `adjustment_number` VARCHAR(50) NOT NULL UNIQUE,
    `warehouse_id` INT NOT NULL,
    `adjustment_date` DATE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft',
    `approved_by` INT NULL,
    `approved_date` DATETIME NULL,
    `total_adjustment_value` DECIMAL(15, 2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace` (`workspace_id`),
    INDEX `idx_adjustment_number` (`adjustment_number`),
    INDEX `idx_status` (`status`),
    INDEX `idx_adjustment_date` (`adjustment_date`),
    INDEX `idx_warehouse` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. Stock Adjustment Lines Table
```sql
CREATE TABLE IF NOT EXISTS `stock_adjustment_lines` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `adjustment_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `lot_id` INT NULL,
    `serial_id` INT NULL,
    `current_quantity` INT NOT NULL,
    `adjusted_quantity` INT NOT NULL,
    `difference` INT NOT NULL,
    `unit_cost` DECIMAL(15, 2) DEFAULT 0.00,
    `line_total` DECIMAL(15, 2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_adjustment_id` (`adjustment_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. Reorder Rules Table
```sql
CREATE TABLE IF NOT EXISTS `reorder_rules` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `warehouse_id` INT NULL,
    `minimum_quantity` INT DEFAULT 0,
    `reorder_point` INT NOT NULL,
    `reorder_quantity` INT NOT NULL,
    `safety_stock` INT DEFAULT 0,
    `lead_time_days` INT DEFAULT 0,
    `preferred_supplier_id` INT NULL,
    `auto_create_po` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `last_triggered_date` DATE NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace` (`workspace_id`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_product` (`product_id`),
    UNIQUE KEY `unique_product_warehouse` (`product_id`, `warehouse_id`, `workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. Stock Reservations Table
```sql
CREATE TABLE IF NOT EXISTS `stock_reservations` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reservation_number` VARCHAR(50) NOT NULL UNIQUE,
    `product_id` INT NOT NULL,
    `warehouse_id` INT NOT NULL,
    `lot_id` INT NULL,
    `serial_id` INT NULL,
    `quantity` INT NOT NULL,
    `reserved_for_type` VARCHAR(50) NOT NULL,
    `reserved_for_id` INT NOT NULL,
    `reserved_by` INT NOT NULL,
    `reserved_date` DATETIME NOT NULL,
    `reserved_at` DATETIME NULL,
    `expires_at` DATETIME NULL,
    `released_at` DATETIME NULL,
    `status` ENUM('active', 'fulfilled', 'expired', 'cancelled') DEFAULT 'active',
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    INDEX `idx_reserved_for` (`reserved_for_type`, `reserved_for_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11. Cycle Counts Table
```sql
CREATE TABLE IF NOT EXISTS `cycle_counts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `count_number` VARCHAR(50) NOT NULL UNIQUE,
    `warehouse_id` INT NOT NULL,
    `count_date` DATE NOT NULL,
    `count_type` ENUM('full', 'partial', 'abc_a', 'abc_b', 'abc_c') DEFAULT 'partial',
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    `assigned_to` INT NULL,
    `scheduled_date` DATE NULL,
    `completed_date` DATETIME NULL,
    `variance_count` INT DEFAULT 0,
    `variance_value` DECIMAL(15, 2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace` (`workspace_id`),
    INDEX `idx_count_number` (`count_number`),
    INDEX `idx_status` (`status`),
    INDEX `idx_count_date` (`count_date`),
    INDEX `idx_warehouse` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 12. Cycle Count Lines Table
```sql
CREATE TABLE IF NOT EXISTS `cycle_count_lines` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `cycle_count_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `lot_id` INT NULL,
    `expected_quantity` INT NOT NULL,
    `counted_quantity` INT NULL,
    `variance` INT DEFAULT 0,
    `unit_cost` DECIMAL(15, 2) DEFAULT 0.00,
    `variance_value` DECIMAL(15, 2) DEFAULT 0.00,
    `counted_by` INT NULL,
    `counted_at` DATETIME NULL,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_cycle_count_id` (`cycle_count_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_lot_id` (`lot_id`),
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 13. Product ABC Classifications Table
```sql
CREATE TABLE IF NOT EXISTS `product_abc_classifications` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT NOT NULL,
    `classification` ENUM('A', 'B', 'C') NOT NULL,
    `annual_value` DECIMAL(15, 2) DEFAULT 0.00,
    `annual_quantity` INT DEFAULT 0,
    `percentage_of_total` DECIMAL(5, 2) DEFAULT 0.00,
    `last_calculated` DATE NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_classification` (`classification`),
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`),
    UNIQUE KEY `unique_product_workspace` (`product_id`, `workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 14. Backorders Table
```sql
CREATE TABLE IF NOT EXISTS `backorders` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `backorder_number` VARCHAR(50) NOT NULL UNIQUE,
    `product_id` INT NOT NULL,
    `warehouse_id` INT NOT NULL,
    `customer_id` INT NOT NULL,
    `order_type` VARCHAR(50) NOT NULL,
    `order_id` INT NOT NULL,
    `ordered_quantity` INT NOT NULL,
    `fulfilled_quantity` INT DEFAULT 0,
    `remaining_quantity` INT NOT NULL,
    `order_date` DATE NOT NULL,
    `expected_date` DATE NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    `status` ENUM('pending', 'partially_fulfilled', 'fulfilled', 'cancelled') DEFAULT 'pending',
    `fulfilled_at` TIMESTAMP NULL,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace` (`workspace_id`),
    INDEX `idx_backorder_number` (`backorder_number`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_priority` (`priority`),
    INDEX `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Returns Management Tables

### 15. Sales Returns Table
```sql
CREATE TABLE IF NOT EXISTS `sales_returns` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_number` VARCHAR(50) NOT NULL UNIQUE,
    `invoice_id` INT NOT NULL,
    `customer_id` INT NOT NULL,
    `warehouse_id` INT NOT NULL,
    `return_date` DATE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    `refund_method` ENUM('cash', 'credit', 'exchange') NULL,
    `refund_amount` DECIMAL(15, 2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace` (`workspace_id`),
    INDEX `idx_return_number` (`return_number`),
    INDEX `idx_invoice_id` (`invoice_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 16. Sales Return Lines Table
```sql
CREATE TABLE IF NOT EXISTS `sales_return_lines` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `lot_id` INT NULL,
    `serial_id` INT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(15, 2) DEFAULT 0.00,
    `line_total` DECIMAL(15, 2) DEFAULT 0.00,
    `condition` VARCHAR(50) NULL,
    `disposition` ENUM('restock', 'repair', 'scrap') DEFAULT 'restock',
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_return_id` (`return_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 17. Purchase Returns Table
```sql
CREATE TABLE IF NOT EXISTS `purchase_returns` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_number` VARCHAR(50) NOT NULL UNIQUE,
    `purchase_id` INT NOT NULL,
    `vendor_id` INT NOT NULL,
    `warehouse_id` INT NOT NULL,
    `return_date` DATE NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    `credit_note_amount` DECIMAL(15, 2) DEFAULT 0.00,
    `notes` TEXT NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_workspace` (`workspace_id`),
    INDEX `idx_return_number` (`return_number`),
    INDEX `idx_purchase_id` (`purchase_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 18. Purchase Return Lines Table
```sql
CREATE TABLE IF NOT EXISTS `purchase_return_lines` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `return_id` INT NOT NULL,
    `product_id` INT NOT NULL,
    `lot_id` INT NULL,
    `serial_id` INT NULL,
    `quantity` INT NOT NULL,
    `unit_cost` DECIMAL(15, 2) DEFAULT 0.00,
    `line_total` DECIMAL(15, 2) DEFAULT 0.00,
    `reason` VARCHAR(191) NULL,
    `workspace_id` INT NULL,
    `created_by` INT DEFAULT 0,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `idx_return_id` (`return_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_workspace_product` (`workspace_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Alterations & Updates

### 19. Update Backorders Table
```sql
-- Rename quantity to ordered_quantity
ALTER TABLE `backorders` 
CHANGE COLUMN `quantity` `ordered_quantity` INT NOT NULL;

-- Add fulfilled_at timestamp
ALTER TABLE `backorders` 
ADD COLUMN `fulfilled_at` TIMESTAMP NULL AFTER `status`;

-- Update priority enum to include 'urgent'
ALTER TABLE `backorders` 
MODIFY COLUMN `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium';

-- Update status enum to use 'partially_fulfilled' instead of 'partial'
ALTER TABLE `backorders` 
MODIFY COLUMN `status` ENUM('pending', 'partially_fulfilled', 'fulfilled', 'cancelled') DEFAULT 'pending';

-- Update existing 'partial' status to 'partially_fulfilled'
UPDATE `backorders` 
SET `status` = 'partially_fulfilled' 
WHERE `status` = 'partial';
```

### 20. Change Inventory Transaction Type to String
```sql
-- Change transaction_type from enum to string to support various transaction types
-- Supports: stock_in, stock_out, sale_out, purchase_in, transfer_in, transfer_out,
-- adjustment_in, adjustment_out, return_in, return_out, and any future types
ALTER TABLE `inventory_transactions` 
MODIFY COLUMN `transaction_type` VARCHAR(50) NOT NULL;
```

---

## Migration Notes

### Execution Order
Execute the migrations in the following order to avoid foreign key issues:

1. **Core Tables** (1-4): Lot Numbers, Serial Numbers, Inventory Transactions, Inventory Valuations
2. **Warehouse Tables** (5-6): Warehouse Locations, Product Locations
3. **Control Tables** (7-14): Stock Adjustments, Reorder Rules, Reservations, Cycle Counts, ABC Classifications, Backorders
4. **Returns Tables** (15-18): Sales Returns, Purchase Returns and their line items
5. **Alterations** (19-20): All ALTER TABLE statements (only for backorders and transaction_type updates)

### Important Considerations

1. **Character Set**: All tables use `utf8mb4` character set with `utf8mb4_unicode_ci` collation
2. **Engine**: All tables use InnoDB storage engine for transaction support
3. **Indexes**: Performance indexes are created on frequently queried columns
4. **Workspace Isolation**: All tables include `workspace_id` for multi-tenancy support
5. **Audit Trail**: All tables include `created_by`, `created_at`, and `updated_at` fields

### Transaction Type Values
The `inventory_transactions.transaction_type` field supports:
- `stock_in` - General stock in
- `stock_out` - General stock out
- `sale_out` - Stock out from sale
- `purchase_in` - Stock in from purchase
- `transfer_in` - Stock in from transfer
- `transfer_out` - Stock out from transfer
- `adjustment_in` - Stock in from adjustment
- `adjustment_out` - Stock out from adjustment
- `return_in` - Stock in from return
- `return_out` - Stock out from return
- `receiving` - Barcode receiving
- `putaway` - Barcode putaway
- `picking` - Barcode picking
- `shipment` - Barcode shipment

### Enum Values Reference

**Lot Numbers Status**: `active`, `expired`, `quarantined`

**Serial Numbers Status**: `available`, `sold`, `returned`, `defective`

**Warehouse Location Type**: `receiving`, `storage`, `picking`, `shipping`, `quarantine`

**Stock Adjustment Status**: `draft`, `pending_approval`, `approved`, `rejected`

**Stock Reservation Status**: `active`, `fulfilled`, `expired`, `cancelled`

**Cycle Count Type**: `full`, `partial`, `abc_a`, `abc_b`, `abc_c`

**Cycle Count Status**: `scheduled`, `in_progress`, `completed`, `cancelled`

**ABC Classification**: `A`, `B`, `C`

**Backorder Priority**: `low`, `medium`, `high`, `urgent`

**Backorder Status**: `pending`, `partially_fulfilled`, `fulfilled`, `cancelled`

**Sales/Purchase Return Status**: `pending`, `approved`, `rejected`, `completed`

**Refund Method**: `cash`, `credit`, `exchange`

**Disposition**: `restock`, `repair`, `scrap`

**Valuation Method**: `FIFO`, `LIFO`, `AVERAGE`, `MOVING_AVERAGE`

---

## Testing Migrations

To verify all migrations are applied correctly:

```sql
-- Check if all tables exist
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN (
    'lot_numbers', 'serial_numbers', 'inventory_transactions', 'inventory_valuations',
    'stock_adjustments', 'stock_adjustment_lines', 'warehouse_locations', 'product_locations',
    'reorder_rules', 'stock_reservations', 'cycle_counts', 'cycle_count_lines',
    'product_abc_classifications', 'backorders', 'sales_returns', 'sales_return_lines',
    'purchase_returns', 'purchase_return_lines'
);

-- Verify column additions from alterations
SHOW COLUMNS FROM backorders LIKE 'ordered_quantity';
SHOW COLUMNS FROM backorders LIKE 'fulfilled_at';
DESCRIBE inventory_transactions;
```

---

## Rollback Commands

If you need to rollback migrations, execute these DROP statements in reverse order:

```sql
-- Drop all inventory module tables
DROP TABLE IF EXISTS `purchase_return_lines`;
DROP TABLE IF EXISTS `purchase_returns`;
DROP TABLE IF EXISTS `sales_return_lines`;
DROP TABLE IF EXISTS `sales_returns`;
DROP TABLE IF EXISTS `backorders`;
DROP TABLE IF EXISTS `product_abc_classifications`;
DROP TABLE IF EXISTS `cycle_count_lines`;
DROP TABLE IF EXISTS `cycle_counts`;
DROP TABLE IF EXISTS `stock_reservations`;
DROP TABLE IF EXISTS `reorder_rules`;
DROP TABLE IF EXISTS `product_locations`;
DROP TABLE IF EXISTS `warehouse_locations`;
DROP TABLE IF EXISTS `stock_adjustment_lines`;
DROP TABLE IF EXISTS `stock_adjustments`;
DROP TABLE IF EXISTS `inventory_valuations`;
DROP TABLE IF EXISTS `inventory_transactions`;
DROP TABLE IF EXISTS `serial_numbers`;
DROP TABLE IF EXISTS `lot_numbers`;
```

---

**Document Created**: October 13, 2025  
**Last Updated**: October 15, 2025  
**Module**: Inventory Management  
**Total Migrations**: 20  
**Total Tables**: 18  
**Total Alterations**: 2 (Backorders update & Transaction type change)

**Note**: Removed redundant ALTER statements (sections 19-22) as those columns are already defined in their respective CREATE TABLE statements.

