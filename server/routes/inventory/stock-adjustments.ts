import { RequestHandler } from "express";
import { StockAdjustment } from "../../db/models/StockAdjustment";
import { Product } from "../../db/models/Product";
import { InventoryTransaction } from "../../db/models/InventoryTransaction";
import { createStockAdjustmentAccountingEntries } from "../../utils/orderAccountingIntegration";

// Retry helper for database operations
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

// Generate unique adjustment number
const generateAdjustmentNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const count = await (StockAdjustment.countDocuments() as any);
  return `ADJ-${dateStr}-${String(count + 1).padStart(4, "0")}`;
};

// Get all stock adjustments
export const getAllAdjustments: RequestHandler = async (req, res) => {
  try {
    const adjustments = await withRetry(async () =>
      (StockAdjustment.find() as any).sort({ adjustment_date: -1 }).exec()
    );
    res.json(adjustments);
  } catch (error) {
    console.error("Error fetching adjustments:", error);
    res.status(500).json({ error: "Failed to fetch adjustments" });
  }
};

// Get adjustment by ID
export const getAdjustmentById: RequestHandler = async (req, res) => {
  try {
    const adjustment = await withRetry(async () =>
      (StockAdjustment.findById(req.params.id) as any).exec()
    );
    if (!adjustment) {
      return res.status(404).json({ error: "Adjustment not found" });
    }
    res.json(adjustment);
  } catch (error) {
    console.error("Error fetching adjustment:", error);
    res.status(500).json({ error: "Failed to fetch adjustment" });
  }
};

// Get adjustments by status
export const getAdjustmentsByStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["draft", "pending_approval", "approved", "rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const adjustments = await withRetry(async () =>
      (StockAdjustment.find({ status }) as any).sort({ adjustment_date: -1 }).exec()
    );
    res.json(adjustments);
  } catch (error) {
    console.error("Error fetching adjustments by status:", error);
    res.status(500).json({ error: "Failed to fetch adjustments" });
  }
};

// Get adjustments by warehouse
export const getAdjustmentsByWarehouse: RequestHandler = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const adjustments = await withRetry(async () =>
      (StockAdjustment.find({ warehouse_id: warehouseId }) as any)
        .sort({ adjustment_date: -1 })
        .exec()
    );
    res.json(adjustments);
  } catch (error) {
    console.error("Error fetching adjustments by warehouse:", error);
    res.status(500).json({ error: "Failed to fetch adjustments" });
  }
};

// Get pending approvals
export const getPendingApprovals: RequestHandler = async (req, res) => {
  try {
    const adjustments = await withRetry(async () =>
      (StockAdjustment.find({ status: "pending_approval" }) as any)
        .sort({ adjustment_date: 1 })
        .exec()
    );
    res.json(adjustments);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
};

// Create stock adjustment
export const createAdjustment: RequestHandler = async (req, res) => {
  try {
    const { warehouse_id, adjustment_date, reason, lines, notes, created_by } =
      req.body;

    if (!warehouse_id || !adjustment_date || !reason || !lines || lines.length === 0) {
      return res.status(400).json({
        error: "Warehouse, date, reason, and at least one line item are required",
      });
    }

    // Calculate total adjustment value
    const totalAdjustmentValue = lines.reduce(
      (sum: number, line: any) => sum + (line.line_total || 0),
      0
    );

    const adjustmentNumber = await generateAdjustmentNumber();

    const newAdjustment = new StockAdjustment({
      adjustment_number: adjustmentNumber,
      warehouse_id,
      adjustment_date: new Date(adjustment_date),
      reason,
      lines,
      status: "draft",
      total_adjustment_value: totalAdjustmentValue,
      notes,
      created_by,
    });

    const savedAdjustment = await withRetry(() => newAdjustment.save());
    res.status(201).json(savedAdjustment);
  } catch (error) {
    console.error("Error creating adjustment:", error);
    res.status(500).json({ error: "Failed to create adjustment" });
  }
};

// Update adjustment (only draft status)
export const updateAdjustment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if adjustment is in draft status
    const adjustment = await withRetry(async () =>
      (StockAdjustment.findById(id) as any).exec()
    );

    if (!adjustment) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    if (adjustment.status !== "draft") {
      return res
        .status(400)
        .json({ error: "Can only edit adjustments in draft status" });
    }

    // Recalculate total if lines changed
    if (updates.lines) {
      updates.total_adjustment_value = updates.lines.reduce(
        (sum: number, line: any) => sum + (line.line_total || 0),
        0
      );
    }

    const updatedAdjustment = await withRetry(async () =>
      (StockAdjustment.findByIdAndUpdate(id, updates, { new: true }) as any).exec()
    );

    res.json(updatedAdjustment);
  } catch (error) {
    console.error("Error updating adjustment:", error);
    res.status(500).json({ error: "Failed to update adjustment" });
  }
};

// Submit for approval
export const submitForApproval: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await withRetry(async () =>
      (StockAdjustment.findById(id) as any).exec()
    );

    if (!adjustment) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    if (adjustment.status !== "draft") {
      return res
        .status(400)
        .json({ error: "Only draft adjustments can be submitted for approval" });
    }

    adjustment.status = "pending_approval";
    const updatedAdjustment = await withRetry(() => adjustment.save());

    res.json(updatedAdjustment);
  } catch (error) {
    console.error("Error submitting for approval:", error);
    res.status(500).json({ error: "Failed to submit for approval" });
  }
};

// Approve adjustment (directly from draft, applies inventory changes)
export const approveAdjustment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;

    // Use provided approver or default to "system"
    const approver = approved_by || "system";

    const adjustment = await withRetry(async () =>
      (StockAdjustment.findById(id) as any).exec()
    );

    if (!adjustment) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    // Allow approval from draft or pending_approval status
    if (adjustment.status !== "draft" && adjustment.status !== "pending_approval") {
      return res
        .status(400)
        .json({ error: "Only draft or pending adjustments can be approved" });
    }

    // Track total adjustment value for accounting
    let totalIncreaseValue = 0;
    let totalDecreaseValue = 0;

    // Apply inventory changes for each line item
    for (const line of adjustment.lines) {
      const product = await withRetry(async () =>
        (Product.findById(line.product_id) as any).exec()
      );

      if (!product) {
        return res.status(404).json({ error: `Product ${line.product_id} not found` });
      }

      // Calculate the difference and update stock
      const difference = line.adjusted_quantity - line.current_quantity;
      product.stock = line.adjusted_quantity;

      await withRetry(() => product.save());

      // Calculate value for accounting (use unit_cost if provided, otherwise use product price)
      const unitCost = line.unit_cost || product.price || 0;
      const lineValue = Math.abs(difference) * unitCost;

      if (difference > 0) {
        totalIncreaseValue += lineValue;
      } else if (difference < 0) {
        totalDecreaseValue += lineValue;
      }

      // Create transaction record
      const transaction = new InventoryTransaction({
        product_id: line.product_id,
        warehouse_id: adjustment.warehouse_id,
        transaction_type: difference > 0 ? "adjustment_increase" : "adjustment_decrease",
        quantity: Math.abs(difference),
        reference_id: adjustment._id,
        reference_type: "stock_adjustment",
        description: `${adjustment.reason}: ${adjustment.notes || ""}`,
        created_by: approver,
        transaction_date: new Date(),
      });

      await withRetry(() => transaction.save());
    }

    // Create accounting entries for increases
    if (totalIncreaseValue > 0) {
      await createStockAdjustmentAccountingEntries(
        totalIncreaseValue,
        true,
        adjustment._id,
        adjustment.adjustment_number,
        adjustment.reason
      );
    }

    // Create accounting entries for decreases
    if (totalDecreaseValue > 0) {
      await createStockAdjustmentAccountingEntries(
        totalDecreaseValue,
        false,
        adjustment._id,
        adjustment.adjustment_number,
        adjustment.reason
      );
    }

    // Update adjustment status to approved
    adjustment.status = "approved";
    adjustment.approved_by = approver;
    adjustment.approved_date = new Date();

    const updatedAdjustment = await withRetry(() => adjustment.save());

    res.json(updatedAdjustment);
  } catch (error) {
    console.error("Error approving adjustment:", error);
    res.status(500).json({ error: "Failed to approve adjustment" });
  }
};

// Reject adjustment
export const rejectAdjustment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const adjustment = await withRetry(async () =>
      (StockAdjustment.findById(id) as any).exec()
    );

    if (!adjustment) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    if (adjustment.status !== "pending_approval") {
      return res
        .status(400)
        .json({ error: "Only pending adjustments can be rejected" });
    }

    adjustment.status = "rejected";
    if (rejection_reason) {
      adjustment.notes = `REJECTED: ${rejection_reason}`;
    }

    const updatedAdjustment = await withRetry(() => adjustment.save());

    res.json(updatedAdjustment);
  } catch (error) {
    console.error("Error rejecting adjustment:", error);
    res.status(500).json({ error: "Failed to reject adjustment" });
  }
};

// Delete adjustment (only draft status)
export const deleteAdjustment: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await withRetry(async () =>
      (StockAdjustment.findById(id) as any).exec()
    );

    if (!adjustment) {
      return res.status(404).json({ error: "Adjustment not found" });
    }

    if (adjustment.status !== "draft") {
      return res
        .status(400)
        .json({ error: "Can only delete adjustments in draft status" });
    }

    await withRetry(async () =>
      (StockAdjustment.findByIdAndDelete(id) as any).exec()
    );

    res.json({ message: "Adjustment deleted successfully" });
  } catch (error) {
    console.error("Error deleting adjustment:", error);
    res.status(500).json({ error: "Failed to delete adjustment" });
  }
};
