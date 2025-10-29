import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export async function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database on server startup
  try {
    // Lazy load database modules to avoid mongoose import during build
    const { connectDB } = await import("./db/connection");
    await connectDB();
  } catch (error) {
    console.error("Database initialization error:", error);
    // Continue anyway to allow API to respond
  }

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Lazy load route handlers to avoid mongoose import during build
  // Specific routes first (category before :id)
  app.get("/api/products/category/:category", async (req, res, next) => {
    const { getProductsByCategory } = await import("./routes/products");
    return getProductsByCategory(req, res, next);
  });

  app.get("/api/products", async (req, res, next) => {
    const { getAllProducts } = await import("./routes/products");
    return getAllProducts(req, res, next);
  });

  app.get("/api/products/:id", async (req, res, next) => {
    const { getProduct } = await import("./routes/products");
    return getProduct(req, res, next);
  });

  app.post("/api/products", async (req, res, next) => {
    const { createProduct } = await import("./routes/products");
    return createProduct(req, res, next);
  });

  app.put("/api/products/:id", async (req, res, next) => {
    const { updateProduct } = await import("./routes/products");
    return updateProduct(req, res, next);
  });

  app.delete("/api/products/:id", async (req, res, next) => {
    const { deleteProduct } = await import("./routes/products");
    return deleteProduct(req, res, next);
  });

  // Customer routes
  app.get("/api/customers", async (req, res, next) => {
    const { getAllCustomers } = await import("./routes/customers");
    return getAllCustomers(req, res, next);
  });

  app.get("/api/customers/:id", async (req, res, next) => {
    const { getCustomer } = await import("./routes/customers");
    return getCustomer(req, res, next);
  });

  app.post("/api/customers", async (req, res, next) => {
    const { createCustomer } = await import("./routes/customers");
    return createCustomer(req, res, next);
  });

  app.put("/api/customers/:id", async (req, res, next) => {
    const { updateCustomer } = await import("./routes/customers");
    return updateCustomer(req, res, next);
  });

  app.delete("/api/customers/:id", async (req, res, next) => {
    const { deleteCustomer } = await import("./routes/customers");
    return deleteCustomer(req, res, next);
  });

  // Order routes - specific routes first
  app.get("/api/orders/status/:status", async (req, res, next) => {
    const { getOrdersByStatus } = await import("./routes/orders");
    return getOrdersByStatus(req, res, next);
  });

  app.get("/api/orders", async (req, res, next) => {
    const { getAllOrders } = await import("./routes/orders");
    return getAllOrders(req, res, next);
  });

  app.get("/api/orders/:id", async (req, res, next) => {
    const { getOrder } = await import("./routes/orders");
    return getOrder(req, res, next);
  });

  app.post("/api/orders", async (req, res, next) => {
    const { createOrder } = await import("./routes/orders");
    return createOrder(req, res, next);
  });

  app.put("/api/orders/:id/status", async (req, res, next) => {
    const { updateOrderStatus } = await import("./routes/orders");
    return updateOrderStatus(req, res, next);
  });

  app.delete("/api/orders/:id", async (req, res, next) => {
    const { deleteOrder } = await import("./routes/orders");
    return deleteOrder(req, res, next);
  });

  // Inventory routes - Warehouses
  app.get("/api/inventory/warehouses", async (req, res, next) => {
    const { getAllWarehouses } = await import("./routes/inventory/warehouses");
    return getAllWarehouses(req, res, next);
  });

  app.get("/api/inventory/warehouses/:id", async (req, res, next) => {
    const { getWarehouse } = await import("./routes/inventory/warehouses");
    return getWarehouse(req, res, next);
  });

  app.post("/api/inventory/warehouses", async (req, res, next) => {
    const { createWarehouse } = await import("./routes/inventory/warehouses");
    return createWarehouse(req, res, next);
  });

  app.put("/api/inventory/warehouses/:id", async (req, res, next) => {
    const { updateWarehouse } = await import("./routes/inventory/warehouses");
    return updateWarehouse(req, res, next);
  });

  app.delete("/api/inventory/warehouses/:id", async (req, res, next) => {
    const { deleteWarehouse } = await import("./routes/inventory/warehouses");
    return deleteWarehouse(req, res, next);
  });

  // Inventory routes - Lot Numbers
  app.get("/api/inventory/lot-numbers", async (req, res, next) => {
    const { getAllLotNumbers } = await import("./routes/inventory/lot-numbers");
    return getAllLotNumbers(req, res, next);
  });

  app.get("/api/inventory/lot-numbers/expiry/check", async (req, res, next) => {
    const { checkExpiryDates } = await import("./routes/inventory/lot-numbers");
    return checkExpiryDates(req, res, next);
  });

  app.get("/api/inventory/lot-numbers/product/:productId", async (req, res, next) => {
    const { getLotNumbersByProduct } = await import("./routes/inventory/lot-numbers");
    return getLotNumbersByProduct(req, res, next);
  });

  app.get("/api/inventory/lot-numbers/:id", async (req, res, next) => {
    const { getLotNumber } = await import("./routes/inventory/lot-numbers");
    return getLotNumber(req, res, next);
  });

  app.post("/api/inventory/lot-numbers", async (req, res, next) => {
    const { createLotNumber } = await import("./routes/inventory/lot-numbers");
    return createLotNumber(req, res, next);
  });

  app.put("/api/inventory/lot-numbers/:id", async (req, res, next) => {
    const { updateLotNumber } = await import("./routes/inventory/lot-numbers");
    return updateLotNumber(req, res, next);
  });

  app.delete("/api/inventory/lot-numbers/:id", async (req, res, next) => {
    const { deleteLotNumber } = await import("./routes/inventory/lot-numbers");
    return deleteLotNumber(req, res, next);
  });

  // Inventory routes - Reorder Rules
  app.get("/api/inventory/reorder-rules", async (req, res, next) => {
    const { getAllReorderRules } = await import("./routes/inventory/reorder-rules");
    return getAllReorderRules(req, res, next);
  });

  app.get("/api/inventory/reorder-rules/check/triggers", async (req, res, next) => {
    const { checkReorderTriggers } = await import("./routes/inventory/reorder-rules");
    return checkReorderTriggers(req, res, next);
  });

  app.get("/api/inventory/reorder-rules/:id", async (req, res, next) => {
    const { getReorderRule } = await import("./routes/inventory/reorder-rules");
    return getReorderRule(req, res, next);
  });

  app.post("/api/inventory/reorder-rules", async (req, res, next) => {
    const { createReorderRule } = await import("./routes/inventory/reorder-rules");
    return createReorderRule(req, res, next);
  });

  app.put("/api/inventory/reorder-rules/:id", async (req, res, next) => {
    const { updateReorderRule } = await import("./routes/inventory/reorder-rules");
    return updateReorderRule(req, res, next);
  });

  app.delete("/api/inventory/reorder-rules/:id", async (req, res, next) => {
    const { deleteReorderRule } = await import("./routes/inventory/reorder-rules");
    return deleteReorderRule(req, res, next);
  });

  // Inventory routes - Serial Numbers
  app.get("/api/inventory/serial-numbers", async (req, res, next) => {
    const { getAllSerialNumbers } = await import("./routes/inventory/serial-numbers");
    return getAllSerialNumbers(req, res, next);
  });

  app.get("/api/inventory/serial-numbers/status/:status", async (req, res, next) => {
    const { getSerialNumbersByStatus } = await import("./routes/inventory/serial-numbers");
    return getSerialNumbersByStatus(req, res, next);
  });

  app.get("/api/inventory/serial-numbers/product/:productId", async (req, res, next) => {
    const { getSerialNumbersByProduct } = await import("./routes/inventory/serial-numbers");
    return getSerialNumbersByProduct(req, res, next);
  });

  app.get("/api/inventory/serial-numbers/lot/:lotId", async (req, res, next) => {
    const { getSerialNumbersByLot } = await import("./routes/inventory/serial-numbers");
    return getSerialNumbersByLot(req, res, next);
  });

  app.get("/api/inventory/serial-numbers/:id", async (req, res, next) => {
    const { getSerialNumberById } = await import("./routes/inventory/serial-numbers");
    return getSerialNumberById(req, res, next);
  });

  app.post("/api/inventory/serial-numbers", async (req, res, next) => {
    const { createSerialNumber } = await import("./routes/inventory/serial-numbers");
    return createSerialNumber(req, res, next);
  });

  app.post("/api/inventory/serial-numbers/bulk", async (req, res, next) => {
    const { bulkCreateSerialNumbers } = await import("./routes/inventory/serial-numbers");
    return bulkCreateSerialNumbers(req, res, next);
  });

  app.put("/api/inventory/serial-numbers/:id", async (req, res, next) => {
    const { updateSerialNumber } = await import("./routes/inventory/serial-numbers");
    return updateSerialNumber(req, res, next);
  });

  app.delete("/api/inventory/serial-numbers/:id", async (req, res, next) => {
    const { deleteSerialNumber } = await import("./routes/inventory/serial-numbers");
    return deleteSerialNumber(req, res, next);
  });

  // Inventory routes - Stock Adjustments
  app.get("/api/inventory/stock-adjustments", async (req, res, next) => {
    const { getAllAdjustments } = await import("./routes/inventory/stock-adjustments");
    return getAllAdjustments(req, res, next);
  });

  app.get("/api/inventory/stock-adjustments/status/:status", async (req, res, next) => {
    const { getAdjustmentsByStatus } = await import("./routes/inventory/stock-adjustments");
    return getAdjustmentsByStatus(req, res, next);
  });

  app.get("/api/inventory/stock-adjustments/warehouse/:warehouseId", async (req, res, next) => {
    const { getAdjustmentsByWarehouse } = await import("./routes/inventory/stock-adjustments");
    return getAdjustmentsByWarehouse(req, res, next);
  });

  app.get("/api/inventory/stock-adjustments/pending/approvals", async (req, res, next) => {
    const { getPendingApprovals } = await import("./routes/inventory/stock-adjustments");
    return getPendingApprovals(req, res, next);
  });

  app.get("/api/inventory/stock-adjustments/:id", async (req, res, next) => {
    const { getAdjustmentById } = await import("./routes/inventory/stock-adjustments");
    return getAdjustmentById(req, res, next);
  });

  app.post("/api/inventory/stock-adjustments", async (req, res, next) => {
    const { createAdjustment } = await import("./routes/inventory/stock-adjustments");
    return createAdjustment(req, res, next);
  });

  app.put("/api/inventory/stock-adjustments/:id", async (req, res, next) => {
    const { updateAdjustment } = await import("./routes/inventory/stock-adjustments");
    return updateAdjustment(req, res, next);
  });

  app.put("/api/inventory/stock-adjustments/:id/submit", async (req, res, next) => {
    const { submitForApproval } = await import("./routes/inventory/stock-adjustments");
    return submitForApproval(req, res, next);
  });

  app.put("/api/inventory/stock-adjustments/:id/approve", async (req, res, next) => {
    const { approveAdjustment } = await import("./routes/inventory/stock-adjustments");
    return approveAdjustment(req, res, next);
  });

  app.put("/api/inventory/stock-adjustments/:id/reject", async (req, res, next) => {
    const { rejectAdjustment } = await import("./routes/inventory/stock-adjustments");
    return rejectAdjustment(req, res, next);
  });

  app.delete("/api/inventory/stock-adjustments/:id", async (req, res, next) => {
    const { deleteAdjustment } = await import("./routes/inventory/stock-adjustments");
    return deleteAdjustment(req, res, next);
  });

  // Inventory routes - Stock Alerts
  app.get("/api/inventory/stock-alerts", async (req, res, next) => {
    const { getAllAlerts } = await import("./routes/inventory/stock-alerts");
    return getAllAlerts(req, res, next);
  });

  app.get("/api/inventory/stock-alerts/active", async (req, res, next) => {
    const { getActiveAlerts } = await import("./routes/inventory/stock-alerts");
    return getActiveAlerts(req, res, next);
  });

  app.get("/api/inventory/stock-alerts/summary", async (req, res, next) => {
    const { getAlertSummary } = await import("./routes/inventory/stock-alerts");
    return getAlertSummary(req, res, next);
  });

  app.get("/api/inventory/stock-alerts/type/:type", async (req, res, next) => {
    const { getAlertsByType } = await import("./routes/inventory/stock-alerts");
    return getAlertsByType(req, res, next);
  });

  app.get("/api/inventory/stock-alerts/status/:status", async (req, res, next) => {
    const { getAlertsByStatus } = await import("./routes/inventory/stock-alerts");
    return getAlertsByStatus(req, res, next);
  });

  app.get("/api/inventory/stock-alerts/:id", async (req, res, next) => {
    const { getAlertById } = await import("./routes/inventory/stock-alerts");
    return getAlertById(req, res, next);
  });

  app.post("/api/inventory/stock-alerts/check", async (req, res, next) => {
    const { checkAndCreateAlerts } = await import("./routes/inventory/stock-alerts");
    return checkAndCreateAlerts(req, res, next);
  });

  app.put("/api/inventory/stock-alerts/:id/acknowledge", async (req, res, next) => {
    const { acknowledgeAlert } = await import("./routes/inventory/stock-alerts");
    return acknowledgeAlert(req, res, next);
  });

  app.put("/api/inventory/stock-alerts/:id/resolve", async (req, res, next) => {
    const { resolveAlert } = await import("./routes/inventory/stock-alerts");
    return resolveAlert(req, res, next);
  });

  app.delete("/api/inventory/stock-alerts/:id", async (req, res, next) => {
    const { deleteAlert } = await import("./routes/inventory/stock-alerts");
    return deleteAlert(req, res, next);
  });

  // Inventory routes - Expiry Notifications
  app.get("/api/inventory/expiry-notifications", async (req, res, next) => {
    const { getAllNotifications } = await import("./routes/inventory/expiry-notifications");
    return getAllNotifications(req, res, next);
  });

  app.get("/api/inventory/expiry-notifications/active", async (req, res, next) => {
    const { getActiveNotifications } = await import("./routes/inventory/expiry-notifications");
    return getActiveNotifications(req, res, next);
  });

  app.get("/api/inventory/expiry-notifications/summary", async (req, res, next) => {
    const { getExpirySummary } = await import("./routes/inventory/expiry-notifications");
    return getExpirySummary(req, res, next);
  });

  app.get("/api/inventory/expiry-notifications/critical", async (req, res, next) => {
    const { getCriticalExpiries } = await import("./routes/inventory/expiry-notifications");
    return getCriticalExpiries(req, res, next);
  });

  app.get("/api/inventory/expiry-notifications/type/:type", async (req, res, next) => {
    const { getNotificationsByType } = await import("./routes/inventory/expiry-notifications");
    return getNotificationsByType(req, res, next);
  });

  app.get("/api/inventory/expiry-notifications/status/:status", async (req, res, next) => {
    const { getNotificationsByStatus } = await import("./routes/inventory/expiry-notifications");
    return getNotificationsByStatus(req, res, next);
  });

  app.get("/api/inventory/expiry-notifications/:id", async (req, res, next) => {
    const { getNotificationById } = await import("./routes/inventory/expiry-notifications");
    return getNotificationById(req, res, next);
  });

  app.post("/api/inventory/expiry-notifications/check", async (req, res, next) => {
    const { checkAndCreateNotifications } = await import("./routes/inventory/expiry-notifications");
    return checkAndCreateNotifications(req, res, next);
  });

  app.put("/api/inventory/expiry-notifications/:id/acknowledge", async (req, res, next) => {
    const { acknowledgeNotification } = await import("./routes/inventory/expiry-notifications");
    return acknowledgeNotification(req, res, next);
  });

  app.put("/api/inventory/expiry-notifications/:id/resolve", async (req, res, next) => {
    const { resolveNotification } = await import("./routes/inventory/expiry-notifications");
    return resolveNotification(req, res, next);
  });

  app.delete("/api/inventory/expiry-notifications/:id", async (req, res, next) => {
    const { deleteNotification } = await import("./routes/inventory/expiry-notifications");
    return deleteNotification(req, res, next);
  });

  // Inventory routes - Analytics
  app.post("/api/inventory/analytics/calculate", async (req, res, next) => {
    const { calculateMetrics } = await import("./routes/inventory/analytics");
    return calculateMetrics(req, res, next);
  });

  app.get("/api/inventory/analytics/latest", async (req, res, next) => {
    const { getLatestMetrics } = await import("./routes/inventory/analytics");
    return getLatestMetrics(req, res, next);
  });

  app.get("/api/inventory/analytics/range", async (req, res, next) => {
    const { getMetricsRange } = await import("./routes/inventory/analytics");
    return getMetricsRange(req, res, next);
  });

  app.get("/api/inventory/analytics/overview", async (req, res, next) => {
    const { getInventoryOverview } = await import("./routes/inventory/analytics");
    return getInventoryOverview(req, res, next);
  });

  app.get("/api/inventory/analytics/categories", async (req, res, next) => {
    const { getCategoryAnalysis } = await import("./routes/inventory/analytics");
    return getCategoryAnalysis(req, res, next);
  });

  app.get("/api/inventory/analytics/warehouses", async (req, res, next) => {
    const { getWarehouseAnalysis } = await import("./routes/inventory/analytics");
    return getWarehouseAnalysis(req, res, next);
  });

  app.get("/api/inventory/analytics/performance", async (req, res, next) => {
    const { getProductPerformance } = await import("./routes/inventory/analytics");
    return getProductPerformance(req, res, next);
  });

  // Inventory routes - Transaction History
  app.post("/api/inventory/transactions", async (req, res, next) => {
    const { createTransaction } = await import("./routes/inventory/transaction-history");
    return createTransaction(req, res, next);
  });

  app.get("/api/inventory/transactions", async (req, res, next) => {
    const { getAllTransactions } = await import("./routes/inventory/transaction-history");
    return getAllTransactions(req, res, next);
  });

  app.get("/api/inventory/transactions/recent", async (req, res, next) => {
    const { getRecentTransactions } = await import("./routes/inventory/transaction-history");
    return getRecentTransactions(req, res, next);
  });

  app.get("/api/inventory/transactions/summary", async (req, res, next) => {
    const { getTransactionSummary } = await import("./routes/inventory/transaction-history");
    return getTransactionSummary(req, res, next);
  });

  app.get("/api/inventory/transactions/product/:productId", async (req, res, next) => {
    const { getTransactionsByProduct } = await import("./routes/inventory/transaction-history");
    return getTransactionsByProduct(req, res, next);
  });

  app.get("/api/inventory/transactions/product/:productId/movement", async (req, res, next) => {
    const { getProductMovementHistory } = await import("./routes/inventory/transaction-history");
    return getProductMovementHistory(req, res, next);
  });

  app.get("/api/inventory/transactions/warehouse/:warehouseId", async (req, res, next) => {
    const { getTransactionsByWarehouse } = await import("./routes/inventory/transaction-history");
    return getTransactionsByWarehouse(req, res, next);
  });

  app.get("/api/inventory/transactions/type/:type", async (req, res, next) => {
    const { getTransactionsByType } = await import("./routes/inventory/transaction-history");
    return getTransactionsByType(req, res, next);
  });

  app.get("/api/inventory/transactions/user/:userId", async (req, res, next) => {
    const { getTransactionsByUser } = await import("./routes/inventory/transaction-history");
    return getTransactionsByUser(req, res, next);
  });

  app.get("/api/inventory/transactions/date-range", async (req, res, next) => {
    const { getTransactionsByDateRange } = await import("./routes/inventory/transaction-history");
    return getTransactionsByDateRange(req, res, next);
  });

  app.get("/api/inventory/transactions/:id", async (req, res, next) => {
    const { getTransactionById } = await import("./routes/inventory/transaction-history");
    return getTransactionById(req, res, next);
  });

  app.get("/api/inventory/transactions/txn/:transactionId", async (req, res, next) => {
    const { getTransactionByTransactionId } = await import("./routes/inventory/transaction-history");
    return getTransactionByTransactionId(req, res, next);
  });

  app.put("/api/inventory/transactions/:id/cancel", async (req, res, next) => {
    const { cancelTransaction } = await import("./routes/inventory/transaction-history");
    return cancelTransaction(req, res, next);
  });

  // Inventory routes - Barcode Scanning
  app.post("/api/inventory/barcodes/scan", async (req, res, next) => {
    const { scanBarcode } = await import("./routes/inventory/barcode-scanning");
    return scanBarcode(req, res, next);
  });

  app.post("/api/inventory/barcodes", async (req, res, next) => {
    const { createBarcodeMapping } = await import("./routes/inventory/barcode-scanning");
    return createBarcodeMapping(req, res, next);
  });

  app.post("/api/inventory/barcodes/bulk", async (req, res, next) => {
    const { bulkCreateBarcodes } = await import("./routes/inventory/barcode-scanning");
    return bulkCreateBarcodes(req, res, next);
  });

  app.get("/api/inventory/barcodes", async (req, res, next) => {
    const { getAllBarcodeMappings } = await import("./routes/inventory/barcode-scanning");
    return getAllBarcodeMappings(req, res, next);
  });

  app.get("/api/inventory/barcodes/stats", async (req, res, next) => {
    const { getBarcodeStats } = await import("./routes/inventory/barcode-scanning");
    return getBarcodeStats(req, res, next);
  });

  app.get("/api/inventory/barcodes/search", async (req, res, next) => {
    const { searchBarcodes } = await import("./routes/inventory/barcode-scanning");
    return searchBarcodes(req, res, next);
  });

  app.get("/api/inventory/barcodes/product/:productId", async (req, res, next) => {
    const { getBarcodesByProduct } = await import("./routes/inventory/barcode-scanning");
    return getBarcodesByProduct(req, res, next);
  });

  app.post("/api/inventory/barcodes/product/:productId/generate", async (req, res, next) => {
    const { generateProductBarcode } = await import("./routes/inventory/barcode-scanning");
    return generateProductBarcode(req, res, next);
  });

  app.get("/api/inventory/barcodes/:barcode", async (req, res, next) => {
    const { getBarcodeMapping } = await import("./routes/inventory/barcode-scanning");
    return getBarcodeMapping(req, res, next);
  });

  app.put("/api/inventory/barcodes/:id", async (req, res, next) => {
    const { updateBarcodeMapping } = await import("./routes/inventory/barcode-scanning");
    return updateBarcodeMapping(req, res, next);
  });

  app.delete("/api/inventory/barcodes/:id", async (req, res, next) => {
    const { deleteBarcodeMapping } = await import("./routes/inventory/barcode-scanning");
    return deleteBarcodeMapping(req, res, next);
  });

  // Inventory routes - Reporting
  app.post("/api/inventory/reports/inventory", async (req, res, next) => {
    const { generateInventoryReport } = await import("./routes/inventory/reporting");
    return generateInventoryReport(req, res, next);
  });

  app.post("/api/inventory/reports/transactions", async (req, res, next) => {
    const { generateTransactionReport } = await import("./routes/inventory/reporting");
    return generateTransactionReport(req, res, next);
  });

  app.post("/api/inventory/reports/expiry", async (req, res, next) => {
    const { generateExpiryReport } = await import("./routes/inventory/reporting");
    return generateExpiryReport(req, res, next);
  });

  app.post("/api/inventory/reports/stock-alerts", async (req, res, next) => {
    const { generateStockAlertReport } = await import("./routes/inventory/reporting");
    return generateStockAlertReport(req, res, next);
  });

  app.post("/api/inventory/reports/warehouses", async (req, res, next) => {
    const { generateWarehouseReport } = await import("./routes/inventory/reporting");
    return generateWarehouseReport(req, res, next);
  });

  // Procurement routes - Load synchronously
  const { default: vendorRouter } = await import("./routes/procurement/vendors");
  const { default: priceRouter } = await import("./routes/procurement/purchase-prices");
  const { default: poRouter } = await import("./routes/procurement/purchase-orders");
  const { default: grRouter } = await import("./routes/procurement/goods-receipts");

  app.use("/api/vendors", vendorRouter);
  app.use("/api/purchase-prices", priceRouter);
  app.use("/api/purchase-orders", poRouter);
  app.use("/api/goods-receipts", grRouter);

  // Staff routes
  app.get("/api/staff", async (req, res, next) => {
    const { getAllStaff } = await import("./routes/staff");
    return getAllStaff(req, res, next);
  });

  app.get("/api/staff/:id", async (req, res, next) => {
    const { getStaffById } = await import("./routes/staff");
    return getStaffById(req, res, next);
  });

  app.post("/api/staff", async (req, res, next) => {
    const { createStaff } = await import("./routes/staff");
    return createStaff(req, res, next);
  });

  app.put("/api/staff/:id", async (req, res, next) => {
    const { updateStaff } = await import("./routes/staff");
    return updateStaff(req, res, next);
  });

  app.delete("/api/staff/:id", async (req, res, next) => {
    const { deleteStaff } = await import("./routes/staff");
    return deleteStaff(req, res, next);
  });

  // Staff authentication routes
  app.post("/api/staff/login", async (req, res, next) => {
    const { loginStaff } = await import("./routes/staff");
    return loginStaff(req, res, next);
  });

  app.post("/api/staff/logout", async (req, res, next) => {
    const { logoutStaff } = await import("./routes/staff");
    return logoutStaff(req, res, next);
  });

  app.get("/api/staff/session/current", async (req, res, next) => {
    const { getLoggedInStaff } = await import("./routes/staff");
    return getLoggedInStaff(req, res, next);
  });

  app.post("/api/staff/change-pin", async (req, res, next) => {
    const { changePin } = await import("./routes/staff");
    return changePin(req, res, next);
  });

  // Returns routes
  app.get("/api/returns", async (req, res, next) => {
    const { getReturns } = await import("./routes/returns");
    return getReturns(req, res, next);
  });

  app.get("/api/returns/stats", async (req, res, next) => {
    const { getReturnStats } = await import("./routes/returns");
    return getReturnStats(req, res, next);
  });

  app.get("/api/returns/:id", async (req, res, next) => {
    const { getReturnById } = await import("./routes/returns");
    return getReturnById(req, res, next);
  });

  app.get("/api/returns/order/:orderId", async (req, res, next) => {
    const { getReturnsByOrderId } = await import("./routes/returns");
    return getReturnsByOrderId(req, res, next);
  });

  app.get("/api/returns/customer/:customer", async (req, res, next) => {
    const { getReturnsByCustomer } = await import("./routes/returns");
    return getReturnsByCustomer(req, res, next);
  });

  app.get("/api/returns/status/:status", async (req, res, next) => {
    const { getReturnsByStatus } = await import("./routes/returns");
    return getReturnsByStatus(req, res, next);
  });

  app.post("/api/returns", async (req, res, next) => {
    const { createReturn } = await import("./routes/returns");
    return createReturn(req, res, next);
  });

  app.put("/api/returns/:id", async (req, res, next) => {
    const { updateReturn } = await import("./routes/returns");
    return updateReturn(req, res, next);
  });

  app.post("/api/returns/:id/approve", async (req, res, next) => {
    const { approveReturn } = await import("./routes/returns");
    return approveReturn(req, res, next);
  });

  app.post("/api/returns/:id/reject", async (req, res, next) => {
    const { rejectReturn } = await import("./routes/returns");
    return rejectReturn(req, res, next);
  });

  app.post("/api/returns/:id/complete", async (req, res, next) => {
    const { completeReturn } = await import("./routes/returns");
    return completeReturn(req, res, next);
  });

  app.delete("/api/returns/:id", async (req, res, next) => {
    const { deleteReturn } = await import("./routes/returns");
    return deleteReturn(req, res, next);
  });

  return app;
}
