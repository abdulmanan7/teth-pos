import { RequestHandler } from "express";
import { ReorderRule } from "../../db/models/ReorderRule";

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

export const getAllReorderRules: RequestHandler = async (req, res) => {
  try {
    const rules = await withRetry(() =>
      ReorderRule.find({ is_active: true }).sort({
        created_at: -1,
      })
    );
    res.json(rules);
  } catch (error) {
    console.error("Error fetching reorder rules:", error);
    res.status(500).json({ error: "Failed to fetch reorder rules" });
  }
};

export const getReorderRule: RequestHandler = async (req, res) => {
  try {
    const rule = await ReorderRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: "Reorder rule not found" });
    }
    res.json(rule);
  } catch (error) {
    console.error("Error fetching reorder rule:", error);
    res.status(500).json({ error: "Failed to fetch reorder rule" });
  }
};

export const checkReorderTriggers: RequestHandler = async (req, res) => {
  try {
    const rules = await ReorderRule.find({ is_active: true });
    const triggeredRules = [];

    for (const rule of rules) {
      // In a real implementation, you would check current stock levels
      // For now, we'll just return rules that need attention
      triggeredRules.push({
        ...rule.toObject(),
        needs_reorder: true,
      });
    }

    res.json(triggeredRules);
  } catch (error) {
    console.error("Error checking reorder triggers:", error);
    res.status(500).json({ error: "Failed to check reorder triggers" });
  }
};

export const createReorderRule: RequestHandler = async (req, res) => {
  try {
    const {
      product_id,
      warehouse_id,
      minimum_quantity,
      reorder_point,
      reorder_quantity,
    } = req.body;

    if (!product_id || !reorder_point || !reorder_quantity) {
      return res.status(400).json({
        error:
          "product_id, reorder_point, and reorder_quantity are required",
      });
    }

    const rule = await ReorderRule.create({
      product_id,
      warehouse_id,
      minimum_quantity: minimum_quantity || 0,
      reorder_point,
      reorder_quantity,
      is_active: true,
      created_by: "system",
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error("Error creating reorder rule:", error);
    res.status(500).json({ error: "Failed to create reorder rule" });
  }
};

export const updateReorderRule: RequestHandler = async (req, res) => {
  try {
    const rule = await ReorderRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!rule) {
      return res.status(404).json({ error: "Reorder rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("Error updating reorder rule:", error);
    res.status(500).json({ error: "Failed to update reorder rule" });
  }
};

export const deleteReorderRule: RequestHandler = async (req, res) => {
  try {
    const rule = await ReorderRule.findByIdAndDelete(req.params.id);

    if (!rule) {
      return res.status(404).json({ error: "Reorder rule not found" });
    }

    res.json({ message: "Reorder rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting reorder rule:", error);
    res.status(500).json({ error: "Failed to delete reorder rule" });
  }
};
