import { RequestHandler } from "express";
import { SerialNumber } from "../../db/models/SerialNumber";

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

// Get all serial numbers
export const getAllSerialNumbers: RequestHandler = async (req, res) => {
  try {
    const serialNumbers = await withRetry(async () =>
      (SerialNumber.find() as any).sort({ created_at: -1 }).exec()
    );
    res.json(serialNumbers);
  } catch (error) {
    console.error("Error fetching serial numbers:", error);
    res.status(500).json({ error: "Failed to fetch serial numbers" });
  }
};

// Get serial number by ID
export const getSerialNumberById: RequestHandler = async (req, res) => {
  try {
    const serialNumber = await withRetry(async () =>
      (SerialNumber.findById(req.params.id) as any).exec()
    );
    if (!serialNumber) {
      return res.status(404).json({ error: "Serial number not found" });
    }
    res.json(serialNumber);
  } catch (error) {
    console.error("Error fetching serial number:", error);
    res.status(500).json({ error: "Failed to fetch serial number" });
  }
};

// Get serial numbers by product ID
export const getSerialNumbersByProduct: RequestHandler = async (req, res) => {
  try {
    const serialNumbers = await withRetry(async () =>
      (SerialNumber.find({ product_id: req.params.productId }) as any).sort({
        created_at: -1,
      }).exec()
    );
    res.json(serialNumbers);
  } catch (error) {
    console.error("Error fetching serial numbers by product:", error);
    res.status(500).json({ error: "Failed to fetch serial numbers" });
  }
};

// Get serial numbers by lot ID
export const getSerialNumbersByLot: RequestHandler = async (req, res) => {
  try {
    const serialNumbers = await withRetry(async () =>
      (SerialNumber.find({ lot_id: req.params.lotId }) as any).sort({
        created_at: -1,
      }).exec()
    );
    res.json(serialNumbers);
  } catch (error) {
    console.error("Error fetching serial numbers by lot:", error);
    res.status(500).json({ error: "Failed to fetch serial numbers" });
  }
};

// Get serial numbers by status
export const getSerialNumbersByStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["available", "sold", "returned", "defective"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const serialNumbers = await withRetry(async () =>
      (SerialNumber.find({ status }) as any).sort({ created_at: -1 }).exec()
    );
    res.json(serialNumbers);
  } catch (error) {
    console.error("Error fetching serial numbers by status:", error);
    res.status(500).json({ error: "Failed to fetch serial numbers" });
  }
};

// Create serial number
export const createSerialNumber: RequestHandler = async (req, res) => {
  try {
    const { serial_number, product_id, warehouse_id, lot_id, status, notes } =
      req.body;

    if (!serial_number || !product_id || !warehouse_id) {
      return res.status(400).json({
        error: "Serial number, product ID, and warehouse ID are required",
      });
    }

    const newSerialNumber = new SerialNumber({
      serial_number,
      product_id,
      warehouse_id,
      lot_id,
      status: status || "available",
      notes,
      created_by: req.body.created_by,
    });

    const savedSerialNumber = await withRetry(() => newSerialNumber.save());
    res.status(201).json(savedSerialNumber);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Serial number already exists" });
    }
    console.error("Error creating serial number:", error);
    res.status(500).json({ error: "Failed to create serial number" });
  }
};

// Update serial number
export const updateSerialNumber: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedSerialNumber = await withRetry(async () =>
      (SerialNumber.findByIdAndUpdate(id, updates, { new: true }) as any).exec()
    );

    if (!updatedSerialNumber) {
      return res.status(404).json({ error: "Serial number not found" });
    }

    res.json(updatedSerialNumber);
  } catch (error) {
    console.error("Error updating serial number:", error);
    res.status(500).json({ error: "Failed to update serial number" });
  }
};

// Delete serial number
export const deleteSerialNumber: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSerialNumber = await withRetry(async () =>
      (SerialNumber.findByIdAndDelete(id) as any).exec()
    );

    if (!deletedSerialNumber) {
      return res.status(404).json({ error: "Serial number not found" });
    }

    res.json({ message: "Serial number deleted successfully" });
  } catch (error) {
    console.error("Error deleting serial number:", error);
    res.status(500).json({ error: "Failed to delete serial number" });
  }
};

// Bulk create serial numbers
export const bulkCreateSerialNumbers: RequestHandler = async (req, res) => {
  try {
    const { serials } = req.body;

    if (!Array.isArray(serials) || serials.length === 0) {
      return res.status(400).json({ error: "serials array is required" });
    }

    const createdSerials = await withRetry(() =>
      SerialNumber.insertMany(serials)
    );
    res.status(201).json(createdSerials);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "One or more serial numbers already exist" });
    }
    console.error("Error bulk creating serial numbers:", error);
    res.status(500).json({ error: "Failed to create serial numbers" });
  }
};
