import { RequestHandler } from "express";
import { LotNumber } from "../../db/models/LotNumber";

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

export const getAllLotNumbers: RequestHandler = async (req, res) => {
  try {
    const lotNumbers = await withRetry(() =>
      LotNumber.find().sort({ created_at: -1 })
    );
    res.json(lotNumbers);
  } catch (error) {
    console.error("Error fetching lot numbers:", error);
    res.status(500).json({ error: "Failed to fetch lot numbers" });
  }
};

export const getLotNumber: RequestHandler = async (req, res) => {
  try {
    const lotNumber = await LotNumber.findById(req.params.id);
    if (!lotNumber) {
      return res.status(404).json({ error: "Lot number not found" });
    }
    res.json(lotNumber);
  } catch (error) {
    console.error("Error fetching lot number:", error);
    res.status(500).json({ error: "Failed to fetch lot number" });
  }
};

export const getLotNumbersByProduct: RequestHandler = async (req, res) => {
  try {
    const lotNumbers = await LotNumber.find({
      product_id: req.params.productId,
    }).sort({ created_at: -1 });
    res.json(lotNumbers);
  } catch (error) {
    console.error("Error fetching lot numbers:", error);
    res.status(500).json({ error: "Failed to fetch lot numbers" });
  }
};

export const checkExpiryDates: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    const expiredLots = await LotNumber.find({
      expiry_date: { $lt: today },
      status: "active",
    });

    const expiringLots = await LotNumber.find({
      expiry_date: {
        $gte: today,
        $lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      status: "active",
    });

    res.json({
      expired: expiredLots,
      expiring_soon: expiringLots,
    });
  } catch (error) {
    console.error("Error checking expiry dates:", error);
    res.status(500).json({ error: "Failed to check expiry dates" });
  }
};

export const createLotNumber: RequestHandler = async (req, res) => {
  try {
    const { lot_number, product_id, quantity, warehouse_id } = req.body;

    if (!lot_number || !product_id || !warehouse_id) {
      return res.status(400).json({
        error: "lot_number, product_id, and warehouse_id are required",
      });
    }

    const existingLot = await LotNumber.findOne({ lot_number });
    if (existingLot) {
      return res.status(400).json({ error: "Lot number already exists" });
    }

    const lotNumber = await LotNumber.create({
      lot_number,
      product_id,
      quantity: quantity || 0,
      warehouse_id,
      status: "active",
      created_by: "system",
    });

    res.status(201).json(lotNumber);
  } catch (error) {
    console.error("Error creating lot number:", error);
    res.status(500).json({ error: "Failed to create lot number" });
  }
};

export const updateLotNumber: RequestHandler = async (req, res) => {
  try {
    const lotNumber = await LotNumber.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!lotNumber) {
      return res.status(404).json({ error: "Lot number not found" });
    }

    res.json(lotNumber);
  } catch (error) {
    console.error("Error updating lot number:", error);
    res.status(500).json({ error: "Failed to update lot number" });
  }
};

export const deleteLotNumber: RequestHandler = async (req, res) => {
  try {
    const lotNumber = await LotNumber.findByIdAndDelete(req.params.id);

    if (!lotNumber) {
      return res.status(404).json({ error: "Lot number not found" });
    }

    res.json({ message: "Lot number deleted successfully" });
  } catch (error) {
    console.error("Error deleting lot number:", error);
    res.status(500).json({ error: "Failed to delete lot number" });
  }
};
