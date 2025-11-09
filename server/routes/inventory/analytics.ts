import { RequestHandler } from "express";
import { InventoryMetrics } from "../../db/models/InventoryMetrics";
import { Product } from "../../db/models/Product";
import { Warehouse } from "../../db/models/Warehouse";
import { StockAlert } from "../../db/models/StockAlert";
import { ExpiryNotification } from "../../db/models/ExpiryNotification";

// Retry helper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}

// Calculate and store inventory metrics
export const calculateMetrics: RequestHandler = async (req, res) => {
  try {
    const products = await withRetry(async () =>
      (Product.find() as any).exec(),
    );

    const warehouses = await withRetry(async () =>
      (Warehouse.find() as any).exec(),
    );

    const lowStockAlerts = await withRetry(
      async () =>
        StockAlert.countDocuments({
          alert_type: "low_stock",
          status: "active",
        }) as any,
    );

    const outOfStockAlerts = await withRetry(
      async () =>
        StockAlert.countDocuments({
          alert_type: "out_of_stock",
          status: "active",
        }) as any,
    );

    const expiredNotifications = await withRetry(
      async () =>
        ExpiryNotification.countDocuments({
          notification_type: "expired",
          status: "active",
        }) as any,
    );

    const expiringNotifications = await withRetry(
      async () =>
        ExpiryNotification.countDocuments({
          notification_type: "expiring_soon",
          status: "active",
        }) as any,
    );

    // Calculate metrics
    let totalStockValue = 0;
    let totalUnits = 0;
    const categoryMap: Record<string, any> = {};
    const topProducts: any[] = [];

    for (const product of products) {
      const value = (product.price || 0) * (product.stock || 0);
      totalStockValue += value;
      totalUnits += product.stock || 0;
      topProducts.push({
        product_id: product._id,
        product_name: product.name,
        sku: product.sku,
        stock: product.stock || 0,
        value,
      });

      const category = product.category || "Uncategorized";
      if (!categoryMap[category]) {
        categoryMap[category] = { units: 0, value: 0 };
      }
      categoryMap[category].units += product.stock || 0;
      categoryMap[category].value += value;
    }

    // Sort top products by value
    topProducts.sort((a, b) => b.value - a.value);
    const topProductsList = topProducts.slice(0, 10);

    // Calculate warehouse distribution
    const warehouseDistribution = warehouses.map((warehouse: any) => ({
      warehouse_id: warehouse._id,
      warehouse_name: warehouse.name,
      units: warehouse.total_units || 0,
      value: warehouse.total_value || 0,
    }));

    // Calculate category distribution
    const categoryDistribution = Object.entries(categoryMap).map(
      ([category, data]: [string, any]) => ({
        category,
        units: data.units,
        value: data.value,
        percentage: totalUnits > 0 ? (data.units / totalUnits) * 100 : 0,
      }),
    );

    // Identify slow-moving products (high stock, low value)
    const slowMoving = topProducts
      .filter((p) => p.stock > 50 && p.value < 1000)
      .slice(0, 5);

    const metrics = new InventoryMetrics({
      date: new Date(),
      total_products: products.length,
      total_stock_value: totalStockValue,
      total_units_in_stock: totalUnits,
      low_stock_count: lowStockAlerts,
      out_of_stock_count: outOfStockAlerts,
      expired_count: expiredNotifications,
      expiring_soon_count: expiringNotifications,
      average_stock_level:
        products.length > 0 ? totalUnits / products.length : 0,
      stock_turnover_rate: 0,
      warehouse_distribution: warehouseDistribution,
      category_distribution: categoryDistribution,
      top_products: topProductsList,
      slow_moving_products: slowMoving,
    });

    await withRetry(() => metrics.save());
    res.json(metrics);
  } catch (error) {
    console.error("Error calculating metrics:", error);
    res.status(500).json({ error: "Failed to calculate metrics" });
  }
};

// Get latest metrics
export const getLatestMetrics: RequestHandler = async (req, res) => {
  try {
    const metrics = await withRetry(async () =>
      (InventoryMetrics.findOne() as any).sort({ date: -1 }).exec(),
    );

    if (!metrics) {
      return res.status(404).json({ error: "No metrics found" });
    }

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching latest metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};

// Get metrics for date range
export const getMetricsRange: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const metrics = await withRetry(async () =>
      (
        InventoryMetrics.find({
          date: { $gte: start, $lte: end },
        }) as any
      )
        .sort({ date: -1 })
        .exec(),
    );

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics range:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};

// Get current inventory overview
export const getInventoryOverview: RequestHandler = async (req, res) => {
  try {
    const products = await withRetry(async () =>
      (Product.find() as any).exec(),
    );

    const lowStockCount = await withRetry(
      async () =>
        StockAlert.countDocuments({
          alert_type: "low_stock",
          status: "active",
        }) as any,
    );

    const outOfStockCount = await withRetry(
      async () =>
        StockAlert.countDocuments({
          alert_type: "out_of_stock",
          status: "active",
        }) as any,
    );

    const expiredCount = await withRetry(
      async () =>
        ExpiryNotification.countDocuments({
          notification_type: "expired",
          status: "active",
        }) as any,
    );

    const expiringCount = await withRetry(
      async () =>
        ExpiryNotification.countDocuments({
          notification_type: "expiring_soon",
          status: "active",
        }) as any,
    );

    let totalValue = 0;
    let totalUnits = 0;

    for (const product of products) {
      totalValue += (product.price || 0) * (product.stock || 0);
      totalUnits += product.stock || 0;
    }

    res.json({
      total_products: products.length,
      total_stock_value: totalValue,
      total_units: totalUnits,
      average_value_per_product:
        products.length > 0 ? totalValue / products.length : 0,
      average_units_per_product:
        products.length > 0 ? totalUnits / products.length : 0,
      low_stock_alerts: lowStockCount,
      out_of_stock_alerts: outOfStockCount,
      expired_products: expiredCount,
      expiring_soon_products: expiringCount,
      health_score: calculateHealthScore(
        lowStockCount,
        outOfStockCount,
        expiredCount,
        expiringCount,
        products.length,
      ),
    });
  } catch (error) {
    console.error("Error fetching inventory overview:", error);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
};

// Get category analysis with percentage distribution
export const getCategoryAnalysis: RequestHandler = async (req, res) => {
  try {
    const products = await withRetry(async () =>
      (Product.find() as any).exec(),
    );

    const categoryMap: Record<string, any> = {};
    let totalUnits = 0;

    // First pass: calculate totals
    for (const product of products) {
      totalUnits += product.stock || 0;
    }

    // Second pass: build category data
    for (const product of products) {
      const category = product.category || "Uncategorized";
      if (!categoryMap[category]) {
        categoryMap[category] = {
          units: 0,
          value: 0,
        };
      }
      categoryMap[category].units += product.stock || 0;
      categoryMap[category].value +=
        (product.price || 0) * (product.stock || 0);
    }

    const analysis = Object.entries(categoryMap).map(
      ([category, data]: [string, any]) => ({
        category,
        units: data.units,
        value: data.value,
        percentage: totalUnits > 0 ? (data.units / totalUnits) * 100 : 0,
      }),
    );

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching category analysis:", error);
    res.status(500).json({ error: "Failed to fetch category analysis" });
  }
};

// Get warehouse analysis with capacity utilization
export const getWarehouseAnalysis: RequestHandler = async (req, res) => {
  try {
    const warehouses = await withRetry(async () =>
      (Warehouse.find() as any).exec(),
    );

    const products = await withRetry(async () =>
      (Product.find() as any).exec(),
    );

    let totalInventoryUnits = 0;

    // Calculate total inventory units
    for (const product of products) {
      totalInventoryUnits += product.stock || 0;
    }

    const analysis = warehouses.map((warehouse: any) => {
      // Filter products for this warehouse
      const warehouseProducts = products.filter(
        (p: any) => p.warehouse_id?.toString() === warehouse._id.toString(),
      );

      // Calculate warehouse totals
      const warehouseUnits = warehouseProducts.reduce(
        (sum, p: any) => sum + (p.stock || 0),
        0,
      );
      const warehouseValue = warehouseProducts.reduce(
        (sum, p: any) => sum + (p.price || 0) * (p.stock || 0),
        0,
      );

      // Calculate capacity utilization as percentage of total inventory
      const capacityUtilization =
        totalInventoryUnits > 0
          ? (warehouseUnits / totalInventoryUnits) * 100
          : 0;

      return {
        warehouse_id: warehouse._id,
        warehouse_name: warehouse.name,
        location: warehouse.location,
        total_units: warehouseUnits,
        total_value: warehouseValue,
        capacity_utilization: capacityUtilization,
      };
    });

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching warehouse analysis:", error);
    res.status(500).json({ error: "Failed to fetch warehouse analysis" });
  }
};

// Get product performance (top products by value and quantity)
export const getProductPerformance: RequestHandler = async (req, res) => {
  try {
    const products = await withRetry(async () =>
      (Product.find() as any).exec(),
    );

    const productList = products.map((p: any) => ({
      product_id: p._id,
      product_name: p.name,
      sku: p.sku,
      stock: p.stock || 0,
      price: p.price || 0,
      value: (p.price || 0) * (p.stock || 0),
    }));

    // Top products by value
    const topByValue = [...productList]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Top products by quantity
    const topByQuantity = [...productList]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10);

    res.json({
      top_by_value: topByValue,
      top_by_quantity: topByQuantity,
    });
  } catch (error) {
    console.error("Error fetching product performance:", error);
    res.status(500).json({ error: "Failed to fetch product performance" });
  }
};

// Helper function to calculate inventory health score
function calculateHealthScore(
  lowStock: number,
  outOfStock: number,
  expired: number,
  expiringSoon: number,
  totalProducts: number,
): number {
  if (totalProducts === 0) return 100;

  const alertsPercentage = ((lowStock + outOfStock) / totalProducts) * 100;
  const expiryPercentage = ((expired + expiringSoon) / totalProducts) * 100;

  let score = 100;
  score -= Math.min(alertsPercentage * 0.5, 30);
  score -= Math.min(expiryPercentage * 0.3, 20);

  return Math.max(0, Math.round(score));
}
