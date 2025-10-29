import { RequestHandler } from "express";
import { BarcodeMapping } from "../../db/models/BarcodeMapping";
import { Product } from "../../db/models/Product";
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

// Scan barcode and return product/lot information
export const scanBarcode: RequestHandler = async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: "Barcode is required" });
    }

    // Try to find barcode mapping
    const mapping = await withRetry(async () =>
      (BarcodeMapping.findOne({
        barcode,
        is_active: true,
      }) as any).exec()
    );

    if (!mapping) {
      // Try direct SKU match
      const product = await withRetry(async () =>
        (Product.findOne({ sku: barcode }) as any).exec()
      );

      if (product) {
        return res.json({
          barcode,
          product,
          barcode_type: "sku",
          found: true,
        });
      }

      return res.json({
        barcode,
        found: false,
        message: "Barcode not found",
      });
    }

    // Get product details
    const product = await withRetry(async () =>
      (Product.findById(mapping.product_id) as any).exec()
    );

    let lot = null;
    if (mapping.lot_id) {
      lot = await withRetry(async () =>
        (LotNumber.findById(mapping.lot_id) as any).exec()
      );
    }

    res.json({
      barcode,
      product,
      lot,
      serial: mapping.serial_number,
      warehouse: mapping.warehouse_id,
      barcode_type: mapping.barcode_type,
      found: true,
    });
  } catch (error) {
    console.error("Error scanning barcode:", error);
    res.status(500).json({ error: "Failed to scan barcode" });
  }
};

// Create barcode mapping
export const createBarcodeMapping: RequestHandler = async (req, res) => {
  try {
    const {
      barcode,
      barcode_type,
      product_id,
      lot_id,
      serial_number,
      warehouse_id,
      created_by,
    } = req.body;

    if (!barcode || !barcode_type || !product_id) {
      return res.status(400).json({
        error: "barcode, barcode_type, and product_id are required",
      });
    }

    // Check if barcode already exists
    const existing = await withRetry(async () =>
      (BarcodeMapping.findOne({ barcode }) as any).exec()
    );

    if (existing) {
      return res.status(409).json({ error: "Barcode already exists" });
    }

    const mapping = new BarcodeMapping({
      barcode,
      barcode_type,
      product_id,
      lot_id,
      serial_number,
      warehouse_id,
      created_by,
      is_active: true,
    });

    await withRetry(() => mapping.save());
    res.status(201).json(mapping);
  } catch (error) {
    console.error("Error creating barcode mapping:", error);
    res.status(500).json({ error: "Failed to create barcode mapping" });
  }
};

// Get all barcode mappings
export const getAllBarcodeMappings: RequestHandler = async (req, res) => {
  try {
    const mappings = await withRetry(async () =>
      (BarcodeMapping.find() as any).sort({ created_at: -1 }).exec()
    );
    res.json(mappings);
  } catch (error) {
    console.error("Error fetching barcode mappings:", error);
    res.status(500).json({ error: "Failed to fetch barcode mappings" });
  }
};

// Get barcode mappings by product
export const getBarcodesByProduct: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const mappings = await withRetry(async () =>
      (BarcodeMapping.find({ product_id: productId }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(mappings);
  } catch (error) {
    console.error("Error fetching product barcodes:", error);
    res.status(500).json({ error: "Failed to fetch barcodes" });
  }
};

// Get barcode mapping by barcode
export const getBarcodeMapping: RequestHandler = async (req, res) => {
  try {
    const { barcode } = req.params;
    const mapping = await withRetry(async () =>
      (BarcodeMapping.findOne({ barcode }) as any).exec()
    );

    if (!mapping) {
      return res.status(404).json({ error: "Barcode not found" });
    }

    res.json(mapping);
  } catch (error) {
    console.error("Error fetching barcode mapping:", error);
    res.status(500).json({ error: "Failed to fetch barcode mapping" });
  }
};

// Update barcode mapping
export const updateBarcodeMapping: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, warehouse_id } = req.body;

    const mapping = await withRetry(async () =>
      (BarcodeMapping.findById(id) as any).exec()
    );

    if (!mapping) {
      return res.status(404).json({ error: "Barcode mapping not found" });
    }

    if (is_active !== undefined) mapping.is_active = is_active;
    if (warehouse_id !== undefined) mapping.warehouse_id = warehouse_id;

    const updated = await withRetry(() => mapping.save());
    res.json(updated);
  } catch (error) {
    console.error("Error updating barcode mapping:", error);
    res.status(500).json({ error: "Failed to update barcode mapping" });
  }
};

// Delete barcode mapping
export const deleteBarcodeMapping: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await withRetry(async () =>
      (BarcodeMapping.findByIdAndDelete(id) as any).exec()
    );

    if (!deleted) {
      return res.status(404).json({ error: "Barcode mapping not found" });
    }

    res.json({ message: "Barcode mapping deleted successfully" });
  } catch (error) {
    console.error("Error deleting barcode mapping:", error);
    res.status(500).json({ error: "Failed to delete barcode mapping" });
  }
};

// Bulk create barcode mappings
export const bulkCreateBarcodes: RequestHandler = async (req, res) => {
  try {
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ error: "barcodes array is required" });
    }

    const created: any[] = [];
    const failed: any[] = [];

    for (const barcode of barcodes) {
      try {
        const { barcode: code, barcode_type, product_id, lot_id, serial_number, warehouse_id } = barcode;

        if (!code || !barcode_type || !product_id) {
          failed.push({
            barcode: code,
            error: "Missing required fields",
          });
          continue;
        }

        // Check if exists
        const existing = await withRetry(async () =>
          (BarcodeMapping.findOne({ barcode: code }) as any).exec()
        );

        if (existing) {
          failed.push({
            barcode: code,
            error: "Barcode already exists",
          });
          continue;
        }

        const mapping = new BarcodeMapping({
          barcode: code,
          barcode_type,
          product_id,
          lot_id,
          serial_number,
          warehouse_id,
          is_active: true,
        });

        await withRetry(() => mapping.save());
        created.push(mapping);
      } catch (error) {
        failed.push({
          barcode: barcode.barcode,
          error: (error as Error).message,
        });
      }
    }

    res.json({
      created: created.length,
      failed: failed.length,
      created_barcodes: created,
      failed_barcodes: failed,
    });
  } catch (error) {
    console.error("Error bulk creating barcodes:", error);
    res.status(500).json({ error: "Failed to bulk create barcodes" });
  }
};

// Generate barcode for product
export const generateProductBarcode: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await withRetry(async () =>
      (Product.findById(productId) as any).exec()
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if SKU barcode already exists
    const existing = await withRetry(async () =>
      (BarcodeMapping.findOne({
        barcode: product.sku,
        barcode_type: "sku",
      }) as any).exec()
    );

    if (existing) {
      return res.json(existing);
    }

    // Create SKU barcode mapping
    const mapping = new BarcodeMapping({
      barcode: product.sku,
      barcode_type: "sku",
      product_id: product._id,
      is_active: true,
    });

    await withRetry(() => mapping.save());
    res.status(201).json(mapping);
  } catch (error) {
    console.error("Error generating barcode:", error);
    res.status(500).json({ error: "Failed to generate barcode" });
  }
};

// Search barcodes
export const searchBarcodes: RequestHandler = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const mappings = await withRetry(async () =>
      (BarcodeMapping.find({
        $or: [
          { barcode: { $regex: query, $options: "i" } },
          { serial_number: { $regex: query, $options: "i" } },
        ],
        is_active: true,
      }) as any)
        .limit(20)
        .exec()
    );

    res.json(mappings);
  } catch (error) {
    console.error("Error searching barcodes:", error);
    res.status(500).json({ error: "Failed to search barcodes" });
  }
};

// Get barcode statistics
export const getBarcodeStats: RequestHandler = async (req, res) => {
  try {
    const totalBarcodes = await withRetry(async () =>
      (BarcodeMapping.countDocuments() as any)
    );

    const activeBarcodes = await withRetry(async () =>
      (BarcodeMapping.countDocuments({ is_active: true }) as any)
    );

    const skuBarcodes = await withRetry(async () =>
      (BarcodeMapping.countDocuments({ barcode_type: "sku" }) as any)
    );

    const lotBarcodes = await withRetry(async () =>
      (BarcodeMapping.countDocuments({ barcode_type: "lot" }) as any)
    );

    const serialBarcodes = await withRetry(async () =>
      (BarcodeMapping.countDocuments({ barcode_type: "serial" }) as any)
    );

    res.json({
      total_barcodes: totalBarcodes,
      active_barcodes: activeBarcodes,
      sku_barcodes: skuBarcodes,
      lot_barcodes: lotBarcodes,
      serial_barcodes: serialBarcodes,
    });
  } catch (error) {
    console.error("Error getting barcode stats:", error);
    res.status(500).json({ error: "Failed to get barcode statistics" });
  }
};
