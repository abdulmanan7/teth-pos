import { RequestHandler } from "express";
import { Product } from "../../db/models/Product";
import { ExpiryNotification } from "../../db/models/ExpiryNotification";

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
 * Set expiry date for a single product (for open market items)
 * Used when business doesn't track lot numbers
 */
export const setProductExpiry: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const { expiry_date, is_perishable, notes } = req.body;

    if (!expiry_date) {
      return res.status(400).json({ error: "Expiry date is required" });
    }

    const product = await withRetry(async () =>
      (Product.findById(productId) as any).exec()
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update product with expiry information
    product.expiry_date = new Date(expiry_date);
    product.is_perishable = is_perishable !== undefined ? is_perishable : true;

    await withRetry(() => product.save());

    res.json({
      success: true,
      product,
      message: "Product expiry date updated successfully",
    });
  } catch (error: any) {
    console.error("Error setting product expiry:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Bulk set expiry dates for multiple products
 * Used when buying 10 items of same product from open market
 */
export const bulkSetExpiry: RequestHandler = async (req, res) => {
  try {
    const { productIds, expiry_date, is_perishable } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Product IDs array is required" });
    }

    if (!expiry_date) {
      return res.status(400).json({ error: "Expiry date is required" });
    }

    const expiryDateObj = new Date(expiry_date);
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Update each product
    for (const productId of productIds) {
      try {
        const product = await withRetry(async () =>
          (Product.findById(productId) as any).exec()
        );

        if (!product) {
          results.failed++;
          results.errors.push(`Product ${productId} not found`);
          continue;
        }

        product.expiry_date = expiryDateObj;
        product.is_perishable = is_perishable !== undefined ? is_perishable : true;
        await withRetry(() => product.save());
        results.updated++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to update ${productId}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk expiry update completed: ${results.updated} updated, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error("Error bulk setting expiry:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get products with expiry dates (perishable items)
 */
export const getPerishableProducts: RequestHandler = async (req, res) => {
  try {
    const products = await withRetry(async () =>
      (Product.find({ is_perishable: true, expiry_date: { $exists: true } })
        .sort({ expiry_date: 1 }) as any).exec()
    );

    res.json(products);
  } catch (error: any) {
    console.error("Error fetching perishable products:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get expired products (without lot tracking)
 */
export const getExpiredProducts: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredProducts = await withRetry(async () =>
      (Product.find({
        is_perishable: true,
        expiry_date: { $lt: today },
      })
        .sort({ expiry_date: 1 }) as any).exec()
    );

    res.json(expiredProducts);
  } catch (error: any) {
    console.error("Error fetching expired products:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get products expiring soon (within 30 days)
 */
export const getExpiringProducts: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringProducts = await withRetry(async () =>
      (Product.find({
        is_perishable: true,
        expiry_date: {
          $gte: today,
          $lte: thirtyDaysFromNow,
        },
      })
        .sort({ expiry_date: 1 }) as any).exec()
    );

    res.json(expiringProducts);
  } catch (error: any) {
    console.error("Error fetching expiring products:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear expiry date from a product
 */
export const clearProductExpiry: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await withRetry(async () =>
      (Product.findById(productId) as any).exec()
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.expiry_date = undefined;
    product.is_perishable = false;

    await withRetry(() => product.save());

    res.json({
      success: true,
      product,
      message: "Product expiry date cleared",
    });
  } catch (error: any) {
    console.error("Error clearing product expiry:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get expiry summary for products (without lots)
 */
export const getProductExpirySummary: RequestHandler = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiredCount = await withRetry(async () =>
      (Product.countDocuments({
        is_perishable: true,
        expiry_date: { $lt: today },
      }) as any)
    );

    const expiringCount = await withRetry(async () =>
      (Product.countDocuments({
        is_perishable: true,
        expiry_date: {
          $gte: today,
          $lte: thirtyDaysFromNow,
        },
      }) as any)
    );

    const perishableCount = await withRetry(async () =>
      (Product.countDocuments({
        is_perishable: true,
        expiry_date: { $exists: true },
      }) as any)
    );

    res.json({
      total_perishable: perishableCount,
      expired: expiredCount,
      expiring_soon: expiringCount,
      healthy: perishableCount - expiredCount - expiringCount,
    });
  } catch (error: any) {
    console.error("Error getting expiry summary:", error);
    res.status(500).json({ error: error.message });
  }
};
