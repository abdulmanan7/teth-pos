import { RequestHandler } from "express";
import { Warehouse } from "../../db/models/Warehouse";

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

export const getAllWarehouses: RequestHandler = async (req, res) => {
  try {
    const warehouses = await withRetry(() =>
      Warehouse.find({ is_active: true }).sort({
        created_at: -1,
      })
    );
    res.json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    res.status(500).json({ error: "Failed to fetch warehouses" });
  }
};

export const getWarehouse: RequestHandler = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }
    res.json(warehouse);
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    res.status(500).json({ error: "Failed to fetch warehouse" });
  }
};

export const createWarehouse: RequestHandler = async (req, res) => {
  try {
    const { name, code, address, city, state, zip_code, phone, email } =
      req.body;

    if (!name || !code) {
      return res
        .status(400)
        .json({ error: "Name and code are required" });
    }

    const existingWarehouse = await Warehouse.findOne({ code });
    if (existingWarehouse) {
      return res.status(400).json({ error: "Warehouse code already exists" });
    }

    const warehouse = await Warehouse.create({
      name,
      code,
      address,
      city,
      state,
      zip_code,
      phone,
      email,
      is_active: true,
      created_by: "system",
    });

    res.status(201).json(warehouse);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    res.status(500).json({ error: "Failed to create warehouse" });
  }
};

export const updateWarehouse: RequestHandler = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    res.json(warehouse);
  } catch (error) {
    console.error("Error updating warehouse:", error);
    res.status(500).json({ error: "Failed to update warehouse" });
  }
};

export const deleteWarehouse: RequestHandler = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    res.json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    res.status(500).json({ error: "Failed to delete warehouse" });
  }
};
