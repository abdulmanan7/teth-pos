/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Product Types
export interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number; // Quantity per unit (e.g., 1L milk, 0.5kg butter)
  stock: number;
  category: string;
  description?: string;
  // Unit of Measurement
  unit?: 'piece' | 'kg' | 'liter' | 'meter' | 'box' | 'pack' | 'dozen' | 'gram' | 'ml' | 'cm' | 'custom';
  unit_custom?: string; // For custom units like "bottle", "jar", etc.
  // Inventory system fields
  warehouse_id?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  hasSerialNumbers?: boolean; // Flag to indicate product has serial numbers
  createdAt: string;
  updatedAt: string;
}

// Vendor Types
export interface Vendor {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_person?: string;
  payment_terms?: string;
  is_active: boolean;
  rating: number;
  total_purchases: number;
  total_spent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchase Price Types
export interface PurchasePrice {
  _id: string;
  product_id: string;
  vendor_id: string;
  purchase_price: number;
  minimum_quantity: number;
  maximum_quantity: number;
  lead_time_days: number;
  currency: string;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  notes?: string;
  last_purchased?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchase Order Types
export interface PurchaseOrderItem {
  product_id: string;
  quantity: number;
  purchase_price: number;
  line_total: number;
}

export interface PaymentRecord {
  _id?: string;
  amount: number;
  payment_date: string;
  payment_method?: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  reference?: string;
  notes?: string;
}

export interface PurchaseOrder {
  _id: string;
  po_number: string;
  vendor_id: string;
  items: PurchaseOrderItem[];
  total_amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'invoiced' | 'paid';
  payment_status: 'pending' | 'partial' | 'paid';
  amount_paid: number;
  payment_history: PaymentRecord[];
  order_date: string;
  expected_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface DiscountConfig {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: DiscountConfig;
  discountAmount?: number;
  subtotal?: number;
  totalAfterDiscount?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  subtotal?: number;
  itemDiscountTotal?: number;
  checkoutDiscount?: DiscountConfig;
  checkoutDiscountAmount?: number;
  subtotalAfterDiscount?: number;
  totalBeforeTax?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  staffId?: string;
  staffName?: string;
  paymentMethod?: 'cash' | 'card' | 'check' | 'transfer' | 'other';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory Types
export interface LotNumber {
  _id: string;
  lot_number: string;
  title?: string;
  product_id: string;
  quantity: number;
  manufacture_date?: string;
  expiry_date?: string;
  warehouse_id: string;
  status: 'active' | 'expired' | 'quarantined';
  notes?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerialNumber {
  _id: string;
  serial_number: string;
  product_id: string;
  lot_id?: string;
  warehouse_id: string;
  status: 'available' | 'sold' | 'returned' | 'defective';
  assigned_to?: string;
  assigned_date?: string;
  purchase_date?: string;
  sale_date?: string;
  notes?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  _id: string;
  product_id: string;
  warehouse_id: string;
  lot_id?: string;
  serial_id?: string;
  transaction_type: string;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  transaction_date: string;
  description?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderRule {
  _id: string;
  product_id: string;
  warehouse_id?: string;
  minimum_quantity: number;
  reorder_point: number;
  reorder_quantity: number;
  safety_stock?: number;
  lead_time_days?: number;
  preferred_supplier_id?: string;
  auto_create_po?: boolean;
  is_active: boolean;
  last_triggered_date?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentLine {
  product_id: string;
  lot_id?: string;
  serial_id?: string;
  current_quantity: number;
  adjusted_quantity: number;
  difference: number;
  unit_cost?: number;
  line_total?: number;
  notes?: string;
}

export interface StockAdjustment {
  _id: string;
  adjustment_number: string;
  warehouse_id: string;
  adjustment_date: string;
  reason: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approved_by?: string;
  approved_date?: string;
  total_adjustment_value?: number;
  lines: StockAdjustmentLine[];
  notes?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAlert {
  _id: string;
  product_id: string;
  warehouse_id?: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  current_stock: number;
  threshold: number;
  reorder_point?: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_date?: string;
  resolved_date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpiryNotification {
  _id: string;
  lot_id: string;
  product_id: string;
  warehouse_id?: string;
  notification_type: 'expired' | 'expiring_soon' | 'upcoming';
  expiry_date: string;
  days_until_expiry: number;
  quantity: number;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_date?: string;
  resolved_date?: string;
  resolution_type?: 'used' | 'disposed' | 'transferred' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMetrics {
  _id: string;
  date: string;
  total_products: number;
  total_stock_value: number;
  total_units_in_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expired_count: number;
  expiring_soon_count: number;
  average_stock_level: number;
  stock_turnover_rate: number;
  warehouse_distribution: Array<{
    warehouse_id: string;
    warehouse_name: string;
    units: number;
    value: number;
  }>;
  category_distribution: Array<{
    category: string;
    units: number;
    value: number;
    percentage: number;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    stock: number;
    value: number;
  }>;
  slow_moving_products: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    stock: number;
    days_in_stock: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryOverview {
  total_products: number;
  total_stock_value: number;
  total_units: number;
  average_value_per_product: number;
  average_units_per_product: number;
  low_stock_alerts: number;
  out_of_stock_alerts: number;
  expired_products: number;
  expiring_soon_products: number;
  health_score: number;
}

export interface TransactionHistory {
  _id: string;
  transaction_id: string;
  transaction_type: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expiry_disposal';
  product_id: string;
  warehouse_id?: string;
  from_warehouse?: string;
  to_warehouse?: string;
  quantity: number;
  unit_price?: number;
  total_value?: number;
  reference_type?: 'purchase_order' | 'sales_order' | 'adjustment' | 'transfer' | 'return' | 'other';
  reference_id?: string;
  lot_id?: string;
  serial_numbers?: string[];
  user_id?: string;
  user_name?: string;
  reason?: string;
  notes?: string;
  status: 'completed' | 'pending' | 'cancelled';
  approval_required: boolean;
  approved_by?: string;
  approved_date?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BarcodeMapping {
  _id: string;
  barcode: string;
  barcode_type: 'sku' | 'lot' | 'serial' | 'custom';
  product_id: string;
  lot_id?: string;
  serial_number?: string;
  warehouse_id?: string;
  is_active: boolean;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BarcodeResult {
  barcode: string;
  product?: Product;
  lot?: LotNumber;
  serial?: string;
  warehouse?: string;
  barcode_type: string;
  found: boolean;
}

// Staff Types
export interface Staff {
  _id: string;
  name: string;
  role: 'Cashier' | 'Manager' | 'Supervisor' | 'Admin';
  pin: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  is_logged_in: boolean;
  last_login?: string;
  last_logout?: string;
  login_session_id?: string;
  total_sales: number;
  total_transactions: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffLoginResponse {
  _id: string;
  name: string;
  role: string;
  sessionId: string;
  loginTime: string;
}
