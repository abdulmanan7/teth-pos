import { RequestHandler } from "express";
import { Product } from "../../db/models/Product";
import { TransactionHistory } from "../../db/models/TransactionHistory";
import { StockAlert } from "../../db/models/StockAlert";
import { ExpiryNotification } from "../../db/models/ExpiryNotification";
import { Warehouse } from "../../db/models/Warehouse";
import { LotNumber } from "../../db/models/LotNumber";

// Retry helper
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Max retries exceeded");
}

// Generate inventory report
export const generateInventoryReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.body;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const products = await withRetry(async () =>
      (Product.find() as any).exec()
    );

    const transactions = await withRetry(async () =>
      (TransactionHistory.find({
        created_at: { $gte: start, $lte: end },
      }) as any)
        .sort({ created_at: -1 })
        .exec()
    );

    const alerts = await withRetry(async () =>
      (StockAlert.find({
        created_at: { $gte: start, $lte: end },
      }) as any).exec()
    );

    const report = {
      title: "Inventory Report",
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      generated_at: new Date().toISOString(),
      summary: {
        total_products: products.length,
        total_stock_value: products.reduce(
          (sum: number, p: any) => sum + (p.price || 0) * (p.stock || 0),
          0
        ),
        total_units: products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0),
        transactions_count: transactions.length,
        alerts_count: alerts.length,
      },
      products: products.map((p: any) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        stock: p.stock,
        value: (p.price || 0) * (p.stock || 0),
      })),
      transactions: transactions.slice(0, 100).map((t: any) => ({
        id: t._id,
        transaction_id: t.transaction_id,
        type: t.transaction_type,
        product_id: t.product_id,
        quantity: t.quantity,
        value: t.total_value,
        date: t.created_at,
      })),
      alerts: alerts.map((a: any) => ({
        id: a._id,
        type: a.alert_type,
        product_id: a.product_id,
        status: a.status,
        created_at: a.created_at,
      })),
    };

    if (format === "json") {
      res.json(report);
    } else if (format === "csv") {
      const csv = generateCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=inventory-report.csv");
      res.send(csv);
    }
  } catch (error) {
    console.error("Error generating inventory report:", error);
    res.status(500).json({ error: "Failed to generate inventory report" });
  }
};

// Generate transaction report
export const generateTransactionReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, type, format = "json" } = req.body;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const query: any = {
      created_at: { $gte: start, $lte: end },
    };

    if (type) {
      query.transaction_type = type;
    }

    const transactions = await withRetry(async () =>
      (TransactionHistory.find(query) as any)
        .sort({ created_at: -1 })
        .exec()
    );

    const summary = {
      total_transactions: transactions.length,
      total_value: transactions.reduce((sum: number, t: any) => sum + (t.total_value || 0), 0),
      by_type: {} as Record<string, any>,
    };

    transactions.forEach((t: any) => {
      if (!summary.by_type[t.transaction_type]) {
        summary.by_type[t.transaction_type] = {
          count: 0,
          value: 0,
        };
      }
      summary.by_type[t.transaction_type].count += 1;
      summary.by_type[t.transaction_type].value += t.total_value || 0;
    });

    const report = {
      title: "Transaction Report",
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      generated_at: new Date().toISOString(),
      summary,
      transactions: transactions.map((t: any) => ({
        id: t._id,
        transaction_id: t.transaction_id,
        type: t.transaction_type,
        product_id: t.product_id,
        quantity: t.quantity,
        value: t.total_value,
        user: t.user_name,
        date: t.created_at,
      })),
    };

    if (format === "json") {
      res.json(report);
    } else if (format === "csv") {
      const csv = generateTransactionCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=transaction-report.csv");
      res.send(csv);
    }
  } catch (error) {
    console.error("Error generating transaction report:", error);
    res.status(500).json({ error: "Failed to generate transaction report" });
  }
};

// Generate expiry report
export const generateExpiryReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const expiryNotifications = await withRetry(async () =>
      (ExpiryNotification.find({
        expiry_date: { $gte: start, $lte: end },
      }) as any)
        .sort({ expiry_date: 1 })
        .exec()
    );

    const summary = {
      total_items: expiryNotifications.length,
      expired: expiryNotifications.filter((n: any) => n.notification_type === "expired").length,
      expiring_soon: expiryNotifications.filter((n: any) => n.notification_type === "expiring_soon").length,
      upcoming: expiryNotifications.filter((n: any) => n.notification_type === "upcoming").length,
      total_quantity: expiryNotifications.reduce((sum: number, n: any) => sum + (n.quantity || 0), 0),
    };

    const report = {
      title: "Expiry Report",
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      generated_at: new Date().toISOString(),
      summary,
      items: expiryNotifications.map((n: any) => ({
        id: n._id,
        product_id: n.product_id,
        lot_id: n.lot_id,
        type: n.notification_type,
        quantity: n.quantity,
        expiry_date: n.expiry_date,
        days_until_expiry: n.days_until_expiry,
        status: n.status,
      })),
    };

    if (format === "json") {
      res.json(report);
    } else if (format === "csv") {
      const csv = generateExpiryCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=expiry-report.csv");
      res.send(csv);
    }
  } catch (error) {
    console.error("Error generating expiry report:", error);
    res.status(500).json({ error: "Failed to generate expiry report" });
  }
};

// Generate stock alert report
export const generateStockAlertReport: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate, alertType, format = "json" } = req.body;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const query: any = {
      created_at: { $gte: start, $lte: end },
    };

    if (alertType) {
      query.alert_type = alertType;
    }

    const alerts = await withRetry(async () =>
      (StockAlert.find(query) as any)
        .sort({ created_at: -1 })
        .exec()
    );

    const summary = {
      total_alerts: alerts.length,
      active: alerts.filter((a: any) => a.status === "active").length,
      acknowledged: alerts.filter((a: any) => a.status === "acknowledged").length,
      resolved: alerts.filter((a: any) => a.status === "resolved").length,
      by_type: {} as Record<string, number>,
    };

    alerts.forEach((a: any) => {
      summary.by_type[a.alert_type] = (summary.by_type[a.alert_type] || 0) + 1;
    });

    const report = {
      title: "Stock Alert Report",
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      generated_at: new Date().toISOString(),
      summary,
      alerts: alerts.map((a: any) => ({
        id: a._id,
        product_id: a.product_id,
        type: a.alert_type,
        current_stock: a.current_stock,
        threshold: a.threshold,
        status: a.status,
        created_at: a.created_at,
      })),
    };

    if (format === "json") {
      res.json(report);
    } else if (format === "csv") {
      const csv = generateStockAlertCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=stock-alert-report.csv");
      res.send(csv);
    }
  } catch (error) {
    console.error("Error generating stock alert report:", error);
    res.status(500).json({ error: "Failed to generate stock alert report" });
  }
};

// Generate warehouse report
export const generateWarehouseReport: RequestHandler = async (req, res) => {
  try {
    const { format = "json" } = req.body;

    const warehouses = await withRetry(async () =>
      (Warehouse.find() as any).exec()
    );

    const report = {
      title: "Warehouse Report",
      generated_at: new Date().toISOString(),
      summary: {
        total_warehouses: warehouses.length,
        total_capacity: warehouses.reduce((sum: number, w: any) => sum + (w.capacity || 0), 0),
        total_units: warehouses.reduce((sum: number, w: any) => sum + (w.total_units || 0), 0),
        total_value: warehouses.reduce((sum: number, w: any) => sum + (w.total_value || 0), 0),
      },
      warehouses: warehouses.map((w: any) => ({
        id: w._id,
        name: w.name,
        location: w.location,
        capacity: w.capacity,
        total_units: w.total_units,
        total_value: w.total_value,
        utilization: w.capacity ? ((w.total_units || 0) / w.capacity) * 100 : 0,
      })),
    };

    if (format === "json") {
      res.json(report);
    } else if (format === "csv") {
      const csv = generateWarehouseCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=warehouse-report.csv");
      res.send(csv);
    }
  } catch (error) {
    console.error("Error generating warehouse report:", error);
    res.status(500).json({ error: "Failed to generate warehouse report" });
  }
};

// CSV generation helpers
function generateCSV(report: any): string {
  let csv = `${report.title}\n`;
  csv += `Generated: ${report.generated_at}\n`;
  csv += `Period: ${report.period.start} to ${report.period.end}\n\n`;

  csv += "SUMMARY\n";
  csv += `Total Products,${report.summary.total_products}\n`;
  csv += `Total Stock Value,${report.summary.total_stock_value}\n`;
  csv += `Total Units,${report.summary.total_units}\n`;
  csv += `Transactions,${report.summary.transactions_count}\n`;
  csv += `Alerts,${report.summary.alerts_count}\n\n`;

  csv += "PRODUCTS\n";
  csv += "ID,Name,SKU,Category,Price,Stock,Value\n";
  report.products.forEach((p: any) => {
    csv += `${p.id},"${p.name}",${p.sku},"${p.category}",${p.price},${p.stock},${p.value}\n`;
  });

  return csv;
}

function generateTransactionCSV(report: any): string {
  let csv = `${report.title}\n`;
  csv += `Generated: ${report.generated_at}\n`;
  csv += `Period: ${report.period.start} to ${report.period.end}\n\n`;

  csv += "SUMMARY\n";
  csv += `Total Transactions,${report.summary.total_transactions}\n`;
  csv += `Total Value,${report.summary.total_value}\n\n`;

  csv += "BY TYPE\n";
  Object.entries(report.summary.by_type).forEach(([type, data]: [string, any]) => {
    csv += `${type},${data.count},${data.value}\n`;
  });

  csv += "\nTRANSACTIONS\n";
  csv += "ID,Transaction ID,Type,Product ID,Quantity,Value,User,Date\n";
  report.transactions.forEach((t: any) => {
    csv += `${t.id},${t.transaction_id},${t.type},${t.product_id},${t.quantity},${t.value},"${t.user}",${t.date}\n`;
  });

  return csv;
}

function generateExpiryCSV(report: any): string {
  let csv = `${report.title}\n`;
  csv += `Generated: ${report.generated_at}\n`;
  csv += `Period: ${report.period.start} to ${report.period.end}\n\n`;

  csv += "SUMMARY\n";
  csv += `Total Items,${report.summary.total_items}\n`;
  csv += `Expired,${report.summary.expired}\n`;
  csv += `Expiring Soon,${report.summary.expiring_soon}\n`;
  csv += `Upcoming,${report.summary.upcoming}\n`;
  csv += `Total Quantity,${report.summary.total_quantity}\n\n`;

  csv += "ITEMS\n";
  csv += "ID,Product ID,Lot ID,Type,Quantity,Expiry Date,Days Until Expiry,Status\n";
  report.items.forEach((i: any) => {
    csv += `${i.id},${i.product_id},${i.lot_id},${i.type},${i.quantity},${i.expiry_date},${i.days_until_expiry},${i.status}\n`;
  });

  return csv;
}

function generateStockAlertCSV(report: any): string {
  let csv = `${report.title}\n`;
  csv += `Generated: ${report.generated_at}\n`;
  csv += `Period: ${report.period.start} to ${report.period.end}\n\n`;

  csv += "SUMMARY\n";
  csv += `Total Alerts,${report.summary.total_alerts}\n`;
  csv += `Active,${report.summary.active}\n`;
  csv += `Acknowledged,${report.summary.acknowledged}\n`;
  csv += `Resolved,${report.summary.resolved}\n\n`;

  csv += "BY TYPE\n";
  Object.entries(report.summary.by_type).forEach(([type, count]: [string, any]) => {
    csv += `${type},${count}\n`;
  });

  csv += "\nALERTS\n";
  csv += "ID,Product ID,Type,Current Stock,Threshold,Status,Created At\n";
  report.alerts.forEach((a: any) => {
    csv += `${a.id},${a.product_id},${a.type},${a.current_stock},${a.threshold},${a.status},${a.created_at}\n`;
  });

  return csv;
}

function generateWarehouseCSV(report: any): string {
  let csv = `${report.title}\n`;
  csv += `Generated: ${report.generated_at}\n\n`;

  csv += "SUMMARY\n";
  csv += `Total Warehouses,${report.summary.total_warehouses}\n`;
  csv += `Total Capacity,${report.summary.total_capacity}\n`;
  csv += `Total Units,${report.summary.total_units}\n`;
  csv += `Total Value,${report.summary.total_value}\n\n`;

  csv += "WAREHOUSES\n";
  csv += "ID,Name,Location,Capacity,Total Units,Total Value,Utilization %\n";
  report.warehouses.forEach((w: any) => {
    csv += `${w.id},"${w.name}","${w.location}",${w.capacity},${w.total_units},${w.total_value},${w.utilization.toFixed(2)}\n`;
  });

  return csv;
}
