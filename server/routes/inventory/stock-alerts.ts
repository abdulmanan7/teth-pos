import { RequestHandler } from "express";
import { StockAlert } from "../../db/models/StockAlert";
import { Product } from "../../db/models/Product";
import { ReorderRule } from "../../db/models/ReorderRule";

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

// Get all alerts
export const getAllAlerts: RequestHandler = async (req, res) => {
  try {
    const alerts = await withRetry(async () =>
      (StockAlert.find() as any).sort({ created_at: -1 }).exec()
    );
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// Get active alerts
export const getActiveAlerts: RequestHandler = async (req, res) => {
  try {
    const alerts = await withRetry(async () =>
      (StockAlert.find({ status: "active" }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// Get alerts by type
export const getAlertsByType: RequestHandler = async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ["low_stock", "out_of_stock", "overstock"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid alert type" });
    }

    const alerts = await withRetry(async () =>
      (StockAlert.find({ alert_type: type }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts by type:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// Get alerts by status
export const getAlertsByStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["active", "acknowledged", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const alerts = await withRetry(async () =>
      (StockAlert.find({ status }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts by status:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

// Get alert by ID
export const getAlertById: RequestHandler = async (req, res) => {
  try {
    const alert = await withRetry(async () =>
      (StockAlert.findById(req.params.id) as any).exec()
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(alert);
  } catch (error) {
    console.error("Error fetching alert:", error);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
};

// Check and create alerts based on reorder rules
export const checkAndCreateAlerts: RequestHandler = async (req, res) => {
  try {
    const alerts: any[] = [];

    // Get all products
    const products = await withRetry(async () =>
      (Product.find() as any).exec()
    );

    // Get all reorder rules
    const reorderRules = await withRetry(async () =>
      (ReorderRule.find({ is_active: true }) as any).exec()
    );

    for (const product of products) {
      for (const rule of reorderRules) {
        // Convert ObjectId to string for comparison
        if (rule.product_id === product._id.toString()) {
          const stock = product.stock || 0;

          // Check for out of stock
          if (stock === 0) {
            const existingAlert = await withRetry(async () =>
              (StockAlert.findOne({
                product_id: product._id.toString(),
                alert_type: "out_of_stock",
                status: "active",
              }) as any).exec()
            );

            if (!existingAlert) {
              const newAlert = new StockAlert({
                product_id: product._id.toString(),
                alert_type: "out_of_stock",
                current_stock: stock,
                threshold: 0,
                reorder_point: rule.reorder_point,
                status: "active",
              });
              await withRetry(() => newAlert.save());
              alerts.push(newAlert);
            }
          }
          // Check for low stock
          else if (stock <= rule.reorder_point) {
            const existingAlert = await withRetry(async () =>
              (StockAlert.findOne({
                product_id: product._id.toString(),
                alert_type: "low_stock",
                status: "active",
              }) as any).exec()
            );

            if (!existingAlert) {
              const newAlert = new StockAlert({
                product_id: product._id.toString(),
                alert_type: "low_stock",
                current_stock: stock,
                threshold: rule.reorder_point,
                reorder_point: rule.reorder_point,
                status: "active",
              });
              await withRetry(() => newAlert.save());
              alerts.push(newAlert);
            }
          }
          // Check for overstock
          else if (rule.safety_stock && stock > rule.safety_stock * 2) {
            const existingAlert = await withRetry(async () =>
              (StockAlert.findOne({
                product_id: product._id.toString(),
                alert_type: "overstock",
                status: "active",
              }) as any).exec()
            );

            if (!existingAlert) {
              const newAlert = new StockAlert({
                product_id: product._id.toString(),
                alert_type: "overstock",
                current_stock: stock,
                threshold: rule.safety_stock * 2,
                reorder_point: rule.reorder_point,
                status: "active",
              });
              await withRetry(() => newAlert.save());
              alerts.push(newAlert);
            }
          }
        }
      }
    }

    res.json({
      message: "Alert check completed",
      alerts_created: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Error checking alerts:", error);
    res.status(500).json({ error: "Failed to check alerts" });
  }
};

// Acknowledge alert
export const acknowledgeAlert: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledged_by, notes } = req.body;

    const alert = await withRetry(async () =>
      (StockAlert.findById(id) as any).exec()
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    alert.status = "acknowledged";
    alert.acknowledged_by = acknowledged_by || "system";
    alert.acknowledged_date = new Date();
    if (notes) alert.notes = notes;

    const updatedAlert = await withRetry(() => alert.save());
    res.json(updatedAlert);
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
};

// Resolve alert
export const resolveAlert: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const alert = await withRetry(async () =>
      (StockAlert.findById(id) as any).exec()
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    alert.status = "resolved";
    alert.resolved_date = new Date();
    if (notes) alert.notes = notes;

    const updatedAlert = await withRetry(() => alert.save());
    res.json(updatedAlert);
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
};

// Delete alert
export const deleteAlert: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAlert = await withRetry(async () =>
      (StockAlert.findByIdAndDelete(id) as any).exec()
    );

    if (!deletedAlert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ message: "Alert deleted successfully" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ error: "Failed to delete alert" });
  }
};

// Get alert summary
export const getAlertSummary: RequestHandler = async (req, res) => {
  try {
    const activeCount = await withRetry(async () =>
      (StockAlert.countDocuments({ status: "active" }) as any)
    );

    const lowStockCount = await withRetry(async () =>
      (StockAlert.countDocuments({
        alert_type: "low_stock",
        status: "active",
      }) as any)
    );

    const outOfStockCount = await withRetry(async () =>
      (StockAlert.countDocuments({
        alert_type: "out_of_stock",
        status: "active",
      }) as any)
    );

    const overstockCount = await withRetry(async () =>
      (StockAlert.countDocuments({
        alert_type: "overstock",
        status: "active",
      }) as any)
    );

    res.json({
      total_active: activeCount,
      low_stock: lowStockCount,
      out_of_stock: outOfStockCount,
      overstock: overstockCount,
    });
  } catch (error) {
    console.error("Error getting alert summary:", error);
    res.status(500).json({ error: "Failed to get alert summary" });
  }
};
