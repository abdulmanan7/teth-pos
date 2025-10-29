# Inventory Dashboard - Main Dashboard Menu Integration

## Overview
This document describes how the Inventory Dashboard has been integrated into the main Dashboard menu with conditional visibility based on module assignment.

## Change Summary
The Inventory Dashboard has been added to the main Dashboard menu and will only be visible when the Inventory module is assigned to the user's plan.

## Implementation Details

### Location
**File:** `packages/workdo/Inventory/src/Listeners/CompanyMenuListener.php`

### Menu Configuration
Added the following menu entry at the beginning of the `handle()` method (lines 17-30):

```php
// Add Inventory Dashboard to main Dashboard menu
$menu->add([
    'category' => 'General',
    'title' => __('Inventory Dashboard'),
    'icon' => '',
    'name' => 'inventory-analytics-dashboard',
    'parent' => 'dashboard',
    'order' => 50,
    'ignore_if' => [],
    'depend_on' => [],
    'route' => 'inventory.analytics.dashboard',
    'module' => $module,
    'permission' => 'inventory analytics view'
]);
```

## How It Works

### Menu System Architecture
The menu system uses the `App\Classes\Menu` class which automatically handles module checking:

```php
public function add(array $array): void {
    if(in_array($array['module'],$this->modules) && 
       ((empty($array['permission'])) || $this->user->isAbleTo($array['permission']))){
        $this->menu[] = $array;
    }
}
```

### Visibility Conditions
The Inventory Dashboard will only appear in the main Dashboard menu when **ALL** of the following conditions are met:

1. **Module Assignment**: The `Inventory` module is assigned to the user's active plan
2. **Permission Check**: The user has the `inventory analytics view` permission
3. **Module Activation**: The Inventory module is activated in the system

If any of these conditions are not met, the menu item will not be displayed.

## Menu Structure

### Before Change
```
Dashboard (main menu - no children)
└── (empty)

Inventory
├── Inventory Overview
├── Lot Numbers
├── Serial Numbers
├── ...
└── Analytics & Reports
    ├── Dashboard  <-- Was here
    ├── ABC Classification
    ├── Stock Aging
    └── ...
```

### After Change
```
Dashboard (main menu)
└── Inventory Dashboard  <-- NEW! (only visible with Inventory module)

Inventory
├── Inventory Overview
├── Lot Numbers
├── Serial Numbers
├── ...
└── Analytics & Reports
    ├── ABC Classification  <-- Dashboard removed from here
    ├── Stock Aging
    ├── Inventory Valuation
    └── ...
```

## Menu Properties Explained

| Property | Value | Description |
|----------|-------|-------------|
| `category` | `'General'` | Groups the menu item in the General category |
| `title` | `'Inventory Dashboard'` | Display name in the menu |
| `icon` | `''` | No icon (child menu items don't usually have icons) |
| `name` | `'inventory-analytics-dashboard'` | Unique identifier for this menu item |
| `parent` | `'dashboard'` | Makes it a child of the main Dashboard menu |
| `order` | `50` | Determines position within Dashboard submenu |
| `route` | `'inventory.analytics.dashboard'` | Laravel route name to navigate to |
| `module` | `'Inventory'` | Module that must be assigned |
| `permission` | `'inventory analytics view'` | Required permission |

## Related Routes

The dashboard is accessible via:
- **Route Name**: `inventory.analytics.dashboard`
- **URL**: `/inventory/analytics/dashboard` (typical)
- **Controller**: `Workdo\Inventory\Http\Controllers\InventoryAnalyticsController`

## Testing

### Test Case 1: With Inventory Module
1. Log in as a company user
2. Ensure Inventory module is assigned to the plan
3. Ensure user has `inventory analytics view` permission
4. Navigate to main dashboard
5. **Expected Result**: "Inventory Dashboard" appears under Dashboard menu
6. Click on it
7. **Expected Result**: Navigates to Inventory Analytics Dashboard

### Test Case 2: Without Inventory Module
1. Log in as a company user  
2. Ensure Inventory module is NOT assigned to the plan
3. Navigate to main dashboard
4. **Expected Result**: "Inventory Dashboard" does NOT appear under Dashboard menu

### Test Case 3: Without Permission
1. Log in as a company user
2. Ensure Inventory module is assigned
3. Remove `inventory analytics view` permission from user's role
4. Navigate to main dashboard
5. **Expected Result**: "Inventory Dashboard" does NOT appear under Dashboard menu

## Module Assignment Check

The module assignment is determined by:

1. **User's Active Plan**: `$user->active_plan`
2. **Plan's Modules**: `$plan->modules` (comma-separated list)
3. **Helper Function**: `ActivatedModule($user_id)` returns array of assigned modules

Example:
```php
// In Menu class constructor
$this->modules = ActivatedModule();
$this->modules[] = 'Base'; // Base is always included

// Returns something like:
['Base', 'Account', 'Hrm', 'Inventory', 'Sales']
```

## Permission Structure

The permission `inventory analytics view` should exist in:
- `packages/workdo/Inventory/src/Database/Seeders/PermissionTableSeeder.php`

Sample permission definition:
```php
[
    'module' => 'Inventory',
    'name' => 'inventory analytics view',
    'guard' => 'web'
]
```

## Advantages of This Approach

1. **Automatic Module Checking**: No custom code needed - the Menu class handles it
2. **Permission-Based**: Respects role-based access control
3. **Non-Breaking**: Original dashboard location still exists for direct access
4. **Consistent**: Follows the same pattern as SalesAgent Dashboard
5. **Maintainable**: All menu configurations are in one place (CompanyMenuListener)

## Cache Clearing

After making menu changes, clear these caches:
```bash
php artisan cache:clear
php artisan view:clear
php artisan config:clear
```

## Additional Notes

- The original "Dashboard" entry has been **removed** from "Analytics & Reports" section
- Dashboard now appears **only** under the main Dashboard menu
- ABC Classification is now the first item in Analytics & Reports (order: 10)
- All subsequent report orders have been adjusted accordingly
- The order value (50) places it after other dashboard items (if any)
- Empty icon string means it inherits default styling for submenu items

## Related Files

- Menu System: `app/Classes/Menu.php`
- Main Dashboard Menu: `app/Listeners/CompanyMenuListener.php` (line 16-28)
- Inventory Menu: `packages/workdo/Inventory/src/Listeners/CompanyMenuListener.php`
- Module Helper: `app/Helper/helper.php` (`ActivatedModule()` function)

## Date Implemented
October 18, 2025

