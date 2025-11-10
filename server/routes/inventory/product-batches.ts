import { RequestHandler } from "express";
import { ProductBatch } from "../../db/models/ProductBatch";
import { Product } from "../../db/models/Product";

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

/**
 * Generate unique batch number
 */
function generateBatchNumber(productId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BATCH-${productId.substring(0, 4)}-${timestamp}-${random}`;
}

/**
 * Create a new product batch
 * Used when receiving stock from supplier or open market
 */
export const createProductBatch: RequestHandler = async (req, res) => {
  try {
    const {
      product_id,
      warehouse_id,
      quantity,
      expiry_date,
      manufacture_date,
      lot_id,
      cost_per_unit,
      supplier_id,
      notes,
      created_by,
    } = req.body;

    if (!product_id || !warehouse_id || !quantity) {
      return res.status(400).json({
        error: "product_id, warehouse_id, and quantity are required",
      });
    }

    // Verify product exists
    const product = await withRetry(async () =>
      (Product.findById(product_id) as any).exec()
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const batchNumber = generateBatchNumber(product_id);

    const batch = await withRetry(async () =>
      ProductBatch.create({
        product_id,
        warehouse_id,
        batch_number: batchNumber,
        quantity,
        original_quantity: quantity,
        expiry_date: expiry_date ? new Date(expiry_date) : undefined,
        manufacture_date: manufacture_date ? new Date(manufacture_date) : undefined,
        lot_id,
        purchase_date: new Date(),
        cost_per_unit,
        supplier_id,
        status: "active",
        notes,
        created_by: created_by || "system",
      })
    );

    res.status(201).json({
      success: true,
      batch,
      message: `Batch created: ${batchNumber}`,
    });
  } catch (error: any) {
    console.error("Error creating product batch:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all batches for a product
 * Shows all different expiry dates and quantities
 */
export const getBatchesByProduct: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const { warehouseId, status } = req.query;

    const filter: any = { product_id: productId };
    if (warehouseId) filter.warehouse_id = warehouseId;
    if (status) filter.status = status;

    const batches = await withRetry(async () =>
      (ProductBatch.find(filter)
        .sort({ expiry_date: 1, purchase_date: -1 }) as any).exec()
    );

    res.json(batches);
  } catch (error: any) {
    console.error("Error fetching product batches:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get batch by ID
 */
export const getBatchById: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await withRetry(async () =>
      (ProductBatch.findById(batchId) as any).exec()
    );

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    res.json(batch);
  } catch (error: any) {
    console.error("Error fetching batch:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update batch (reduce quantity when items sold)
 */
export const updateBatchQuantity: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { quantity_sold, reason } = req.body;

    if (quantity_sold === undefined || quantity_sold < 0) {
      return res.status(400).json({ error: "Valid quantity_sold is required" });
    }

    const batch = await withRetry(async () =>
      (ProductBatch.findById(batchId) as any).exec()
    );

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.quantity < quantity_sold) {
      return res.status(400).json({
        error: `Insufficient quantity. Available: ${batch.quantity}, Requested: ${quantity_sold}`,
      });
    }

    batch.quantity -= quantity_sold;

    // Mark as sold_out if no quantity left
    if (batch.quantity === 0) {
      batch.status = "sold_out";
    }

    await withRetry(() => batch.save());

    res.json({
      success: true,
      batch,
      message: `Batch quantity updated. Remaining: ${batch.quantity}`,
    });
  } catch (error: any) {
    console.error("Error updating batch quantity:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all active batches for a product (FIFO order)
 * Returns batches sorted by expiry date (earliest first)
 */
export const getActiveBatchesFIFO: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const { warehouseId } = req.query;

    const filter: any = {
      product_id: productId,
      status: "active",
      quantity: { $gt: 0 },
    };

    if (warehouseId) filter.warehouse_id = warehouseId;

    const batches = await withRetry(async () =>
      (ProductBatch.find(filter)
        .sort({ expiry_date: 1, purchase_date: 1 }) as any).exec()
    );

    res.json(batches);
  } catch (error: any) {
    console.error("Error fetching FIFO batches:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get expired batches
 */
export const getExpiredBatches: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredBatches = await withRetry(async () =>
      (ProductBatch.find({
        expiry_date: { $lt: today },
        status: { $ne: "sold_out" },
      })
        .sort({ expiry_date: 1 }) as any).exec()
    );

    res.json(expiredBatches);
  } catch (error: any) {
    console.error("Error fetching expired batches:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get batches expiring soon (within 30 days)
 */
export const getExpiringBatches: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringBatches = await withRetry(async () =>
      (ProductBatch.find({
        expiry_date: {
          $gte: today,
          $lte: thirtyDaysFromNow,
        },
        status: "active",
        quantity: { $gt: 0 },
      })
        .sort({ expiry_date: 1 }) as any).exec()
    );

    res.json(expiringBatches);
  } catch (error: any) {
    console.error("Error fetching expiring batches:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get batch inventory summary for a product
 * Shows total stock, batches, expiry status
 */
export const getProductBatchSummary: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await withRetry(async () =>
      (Product.findById(productId) as any).exec()
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const batches = await withRetry(async () =>
      (ProductBatch.find({ product_id: productId }) as any).exec()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    let totalQuantity = 0;
    let expiredQuantity = 0;
    let expiringQuantity = 0;
    let healthyQuantity = 0;

    for (const batch of batches) {
      if (batch.status === "active" && batch.quantity > 0) {
        totalQuantity += batch.quantity;

        if (batch.expiry_date) {
          const expiryDate = new Date(batch.expiry_date);
          expiryDate.setHours(0, 0, 0, 0);

          if (expiryDate < today) {
            expiredQuantity += batch.quantity;
          } else if (expiryDate <= thirtyDaysFromNow) {
            expiringQuantity += batch.quantity;
          } else {
            healthyQuantity += batch.quantity;
          }
        } else {
          healthyQuantity += batch.quantity;
        }
      }
    }

    res.json({
      product: {
        id: product._id,
        name: product.name,
        total_stock: product.stock,
      },
      batches: {
        total_batches: batches.length,
        active_batches: batches.filter((b) => b.status === "active").length,
      },
      inventory: {
        total_quantity: totalQuantity,
        expired_quantity: expiredQuantity,
        expiring_soon_quantity: expiringQuantity,
        healthy_quantity: healthyQuantity,
      },
      batches_list: batches.sort((a, b) => {
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }),
    });
  } catch (error: any) {
    console.error("Error getting batch summary:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark batch as expired or quarantined
 */
export const updateBatchStatus: RequestHandler = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ["active", "expired", "quarantined", "sold_out"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const batch = await withRetry(async () =>
      (ProductBatch.findById(batchId) as any).exec()
    );

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    batch.status = status;
    if (reason) batch.notes = `${batch.notes || ""}\nStatus changed: ${reason}`;

    await withRetry(() => batch.save());

    res.json({
      success: true,
      batch,
      message: `Batch status updated to: ${status}`,
    });
  } catch (error: any) {
    console.error("Error updating batch status:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all warehouse inventory with batch details
 */
export const getWarehouseInventoryWithBatches: RequestHandler = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const batches = await withRetry(async () =>
      (ProductBatch.find({ warehouse_id: warehouseId, status: "active" })
        .sort({ product_id: 1, expiry_date: 1 }) as any).exec()
    );

    // Group by product
    const grouped: any = {};
    for (const batch of batches) {
      if (!grouped[batch.product_id]) {
        grouped[batch.product_id] = [];
      }
      grouped[batch.product_id].push(batch);
    }

    res.json({
      warehouse_id: warehouseId,
      total_batches: batches.length,
      products: grouped,
    });
  } catch (error: any) {
    console.error("Error fetching warehouse inventory:", error);
    res.status(500).json({ error: error.message });
  }
};
