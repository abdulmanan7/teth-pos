import { RequestHandler } from "express";
import { Product } from "../../db/models/Product";
import { ProductBatch } from "../../db/models/ProductBatch";
import { Warehouse } from "../../db/models/Warehouse";
import { SerialNumber } from "../../db/models/SerialNumber";
import mongoose from "mongoose";

// Retry helper
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
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Generate unique purchase number
 */
function generatePurchaseNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MKT-${timestamp}-${random}`;
}

interface MarketPurchaseItem {
  product_id: string;
  quantity: number;
  cost_per_unit: number;
  expiry_date?: string;
  manufacture_date?: string;
  notes?: string;
  serial_numbers?: string[];
}

interface MarketPurchaseRequest {
  warehouse_id: string;
  supplier_name?: string;
  purchased_by?: string;
  items: MarketPurchaseItem[];
  notes?: string;
}

/**
 * Create market purchase and auto-create batches
 * This is the main endpoint for recording direct market purchases
 */
export const createMarketPurchase: RequestHandler = async (req, res) => {
  try {
    const {
      warehouse_id,
      supplier_name,
      purchased_by,
      items,
      notes,
    }: MarketPurchaseRequest = req.body;

    if (!warehouse_id || !items || items.length === 0) {
      return res.status(400).json({
        error: "warehouse_id and items are required",
      });
    }

    // Verify warehouse exists
    const warehouse = await withRetry(async () =>
      (Warehouse.findById(warehouse_id) as any).exec(),
    );

    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    const purchaseNumber = generatePurchaseNumber();
    const purchaseId = new mongoose.Types.ObjectId().toString();
    let totalAmount = 0;
    const createdBatches = [];

    // Create a batch for each item
    for (const item of items) {
      // Verify product exists
      const product = await withRetry(async () =>
        (Product.findById(item.product_id) as any).exec(),
      );

      if (!product) {
        return res.status(404).json({
          error: `Product ${item.product_id} not found`,
        });
      }

      const batchNumber = `BATCH-${product._id.toString().substring(0, 4)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const lineTotal = item.quantity * item.cost_per_unit;
      totalAmount += lineTotal;

      // Create batch for this item
      const batch = await withRetry(async () =>
        ProductBatch.create({
          product_id: item.product_id,
          warehouse_id,
          batch_number: batchNumber,
          quantity: item.quantity,
          original_quantity: item.quantity,
          expiry_date: item.expiry_date
            ? new Date(item.expiry_date)
            : undefined,
          manufacture_date: item.manufacture_date
            ? new Date(item.manufacture_date)
            : undefined,
          purchase_date: new Date(),
          cost_per_unit: item.cost_per_unit,
          supplier_id: supplier_name || "Open Market",
          status: "active",
          notes:
            item.notes || `Market purchase: ${supplier_name || "Open Market"}`,
          created_by: purchased_by || "system",
          is_market_purchase: true, // Mark as market purchase for tracking
          market_purchase_id: purchaseId, // Link to purchase ID
          market_purchase_number: purchaseNumber, // Store purchase number
        }),
      );

      // Create SerialNumber entries if provided
      if (item.serial_numbers && item.serial_numbers.length > 0) {
        for (const serial of item.serial_numbers) {
          await withRetry(async () =>
            SerialNumber.create({
              serial_number: serial,
              product_id: item.product_id,
              warehouse_id,
              status: "available",
              purchase_date: new Date(),
              notes: `Market purchase: ${supplier_name || "Open Market"}`,
              created_by: purchased_by || "system",
            }),
          );
        }
      }

      createdBatches.push({
        batch_number: batchNumber,
        product_id: item.product_id,
        quantity: item.quantity,
        expiry_date: item.expiry_date,
      });

      // Don't update product stock yet - wait for "Add to Inventory" action
    }

    // Store purchase record in a simple collection for history
    const purchaseRecord = {
      _id: purchaseId,
      purchase_number: purchaseNumber,
      warehouse_id,
      supplier_name: supplier_name || "Open Market",
      purchased_by: purchased_by || "system",
      items,
      total_amount: totalAmount,
      purchase_date: new Date(),
      created_batches: createdBatches,
      notes,
      created_at: new Date(),
    };

    res.status(201).json({
      success: true,
      purchase: purchaseRecord,
      batches_created: createdBatches.length,
      message: `Market purchase recorded! Click "Add to Inventory" to finalize and create accounting entries.`,
    });
  } catch (error: any) {
    console.error("Error creating market purchase:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all market purchases with pagination and sorting
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - sort: Sort field (default: created_at)
 * - order: Sort order 'asc' or 'desc' (default: desc)
 */
export const getMarketPurchases: RequestHandler = async (req, res) => {
  try {
    // Get query parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 10),
    ); // Max 100, default 10
    const sort = (req.query.sort as string) || "created_at";
    const order = (req.query.order as string) === "asc" ? 1 : -1;

    // Validate sort field
    const validSortFields = [
      "created_at",
      "total_amount",
      "supplier_name",
      "purchase_number",
    ];
    const sortField = validSortFields.includes(sort) ? sort : "created_at";

    // Build sort object for database query
    const dbSort: Record<string, 1 | -1> = {};
    
    // Map frontend sort fields to batch fields
    if (sortField === "created_at") {
      dbSort.created_at = order as 1 | -1;
    } else if (sortField === "total_amount") {
      // For total_amount, we'll need to sort after grouping
      dbSort.created_at = -1;
    } else if (sortField === "supplier_name") {
      // For supplier_name, we'll need to sort after grouping
      dbSort.created_at = -1;
    } else if (sortField === "purchase_number") {
      // For purchase_number, we'll need to sort after grouping
      dbSort.created_at = -1;
    } else {
      // Default: sort by created_at descending
      dbSort.created_at = -1;
    }

    // Get all batches created from market purchases with database sorting
    const batches = await withRetry(async () =>
      (
        ProductBatch.find({ is_market_purchase: true }).sort(
          dbSort,
        ) as any
      ).exec(),
    );

    // Group batches by market_purchase_id
    const purchases: any[] = [];
    const grouped: Record<string, any[]> = {};

    for (const batch of batches) {
      // Skip batches without market_purchase_id
      if (!batch.market_purchase_id) {
        console.warn(`Batch ${batch._id} missing market_purchase_id, skipping`);
        continue;
      }

      const purchaseId = batch.market_purchase_id;
      if (!grouped[purchaseId]) {
        grouped[purchaseId] = [];
      }
      grouped[purchaseId].push(batch);
    }

    // Convert grouped batches to purchase records
    for (const [purchaseId, batches] of Object.entries(grouped)) {
      const totalAmount = batches.reduce(
        (sum, b) => sum + b.quantity * (b.cost_per_unit || 0),
        0,
      );
      const firstBatch = batches[0];

      // Use created_at if available, fallback to purchase_date, then current time
      const purchaseDate = firstBatch.created_at || firstBatch.purchase_date || new Date();

      purchases.push({
        _id: purchaseId,
        purchase_number:
          firstBatch.market_purchase_number ||
          `MKT-${purchaseId.substring(0, 8)}`,
        warehouse_id: firstBatch.warehouse_id,
        supplier_name: firstBatch.supplier_id || "Open Market",
        items: batches.map((b) => ({
          product_id: b.product_id,
          quantity: b.quantity,
          cost_per_unit: b.cost_per_unit || 0,
          expiry_date: b.expiry_date,
        })),
        total_amount: totalAmount,
        purchase_date: purchaseDate,
        created_at: purchaseDate,
        inventory_added: firstBatch.inventory_added || false,
      });
    }

    // Sort purchases based on query parameter (for fields that depend on grouped data)
    if (sortField === "total_amount" || sortField === "supplier_name" || sortField === "purchase_number" || sortField === "created_at") {
      purchases.sort((a, b) => {
        let valueA: any = a[sortField as keyof typeof a];
        let valueB: any = b[sortField as keyof typeof b];

        // Handle date sorting (created_at)
        if (sortField === "created_at") {
          const dateA = new Date(valueA).getTime();
          const dateB = new Date(valueB).getTime();
          return (dateA - dateB) * order;
        }

        // Handle numeric sorting (total_amount)
        if (typeof valueA === "number" && typeof valueB === "number") {
          return (valueA - valueB) * order;
        }

        // Handle string sorting (supplier_name, purchase_number)
        if (typeof valueA === "string" && typeof valueB === "string") {
          return valueA.localeCompare(valueB) * order;
        }

        return 0;
      });
    }

    // Apply pagination
    const totalCount = purchases.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPurchases = purchases.slice(startIndex, endIndex);

    res.json({
      data: paginatedPurchases,
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      sort: {
        field: sortField,
        order: order === 1 ? "asc" : "desc",
      },
    });
  } catch (error: any) {
    console.error("Error fetching market purchases:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete market purchase (delete associated batches and reverse accounting)
 */
export const deleteMarketPurchase: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Delete market purchase request for ID:", id);

    if (!id) {
      return res.status(400).json({ error: "Purchase ID is required" });
    }

    // Find batches associated with this purchase ID
    const batches = await withRetry(async () =>
      (
        ProductBatch.find({
          market_purchase_id: id,
          is_market_purchase: true,
        }) as any
      ).exec(),
    );

    console.log(`Found ${batches.length} batches for purchase ${id}`);

    if (batches.length === 0) {
      return res
        .status(404)
        .json({ error: "Market purchase not found or already deleted" });
    }

    // Delete serial numbers associated with this purchase
    // Get all product IDs from batches to delete their serials
    const productIds = batches.map(b => b.product_id);
    const serialResult = await withRetry(async () =>
      (
        SerialNumber.deleteMany({
          product_id: { $in: productIds },
          purchase_date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Delete serials created in last 24 hours for this purchase
          status: "available", // Only delete available serials
        }) as any
      ).exec(),
    );
    console.log(`Deleted ${serialResult.deletedCount} serial numbers`);

    // Delete the batches
    const batchResult = await withRetry(async () =>
      (
        ProductBatch.deleteMany({
          market_purchase_id: id,
          is_market_purchase: true,
        }) as any
      ).exec(),
    );
    console.log(`Deleted ${batchResult.deletedCount} batches`);

    res.json({
      success: true,
      message: "Market purchase deleted successfully.",
      batches_deleted: batches.length,
      serials_deleted: serialResult.deletedCount,
    });
  } catch (error: any) {
    console.error("Error deleting market purchase:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add market purchase to inventory (finalize and create accounting entries)
 */
export const addPurchaseToInventory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Purchase ID is required" });
    }

    // Find all batches for this purchase
    const batches = await withRetry(async () =>
      (
        ProductBatch.find({
          market_purchase_id: id,
          is_market_purchase: true,
          inventory_added: false, // Only process if not already added
        }) as any
      ).exec(),
    );

    if (batches.length === 0) {
      return res
        .status(404)
        .json({ error: "Purchase not found or already added to inventory" });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const batch of batches) {
      totalAmount += batch.quantity * (batch.cost_per_unit || 0);
    }

    // Update product stock for all batches
    for (const batch of batches) {
      const product = await withRetry(async () =>
        (Product.findById(batch.product_id) as any).exec(),
      );
      if (product) {
        product.stock += batch.quantity;
        await withRetry(() => product.save());
      }
    }

    // Create accounting entries
    // DEBIT: Inventory (1510) - Asset increases
    // CREDIT: Cash (1060) - Asset decreases
    const { ChartOfAccount } = await import(
      "../../db/models/accounting/ChartOfAccount"
    );
    const { addTransactionLine } = await import("../../utils/accountingUtils");

    // Get account ObjectIds by code
    const inventoryAccount = await withRetry(async () =>
      (ChartOfAccount.findOne({ code: "1510" }) as any).exec(),
    );
    const cashAccount = await withRetry(async () =>
      (ChartOfAccount.findOne({ code: "1060" }) as any).exec(),
    );

    if (!inventoryAccount || !cashAccount) {
      throw new Error(
        "Required accounting accounts not found. Please set up Chart of Accounts.",
      );
    }

    const now = new Date();

    // DEBIT Inventory
    await withRetry(() =>
      addTransactionLine({
        account_id: inventoryAccount._id.toString(),
        reference: "MarketPurchase",
        reference_id: id,
        date: now,
        debit: totalAmount,
        credit: 0,
        description: `Market Purchase - ${batches[0].market_purchase_number}`,
      }),
    );

    // CREDIT Cash
    await withRetry(() =>
      addTransactionLine({
        account_id: cashAccount._id.toString(),
        reference: "MarketPurchase",
        reference_id: id,
        date: now,
        debit: 0,
        credit: totalAmount,
        description: `Market Purchase - ${batches[0].market_purchase_number}`,
      }),
    );

    // Mark all batches as inventory_added
    await withRetry(async () =>
      (
        ProductBatch.updateMany(
          { market_purchase_id: id, is_market_purchase: true },
          { inventory_added: true },
        ) as any
      ).exec(),
    );

    console.log(`Added purchase ${id} to inventory with total amount: ${totalAmount}`);

    res.json({
      success: true,
      message: "Purchase added to inventory successfully. Accounting entries created.",
      total_amount: totalAmount,
      batches_updated: batches.length,
    });
  } catch (error: any) {
    console.error("Error adding purchase to inventory:", error);
    res.status(500).json({ error: error.message });
  }
};
