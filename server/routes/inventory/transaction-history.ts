import { RequestHandler } from "express";
import { TransactionHistory } from "../../db/models/TransactionHistory";

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

// Create transaction
export const createTransaction: RequestHandler = async (req, res) => {
  try {
    const {
      transaction_type,
      product_id,
      warehouse_id,
      from_warehouse,
      to_warehouse,
      quantity,
      unit_price,
      reference_type,
      reference_id,
      lot_id,
      serial_numbers,
      user_id,
      user_name,
      reason,
      notes,
    } = req.body;

    if (!transaction_type || !product_id || !quantity) {
      return res.status(400).json({
        error: "transaction_type, product_id, and quantity are required",
      });
    }

    const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const total_value = unit_price ? unit_price * quantity : undefined;

    const transaction = new TransactionHistory({
      transaction_id,
      transaction_type,
      product_id,
      warehouse_id,
      from_warehouse,
      to_warehouse,
      quantity,
      unit_price,
      total_value,
      reference_type,
      reference_id,
      lot_id,
      serial_numbers,
      user_id,
      user_name,
      reason,
      notes,
      status: "completed",
    });

    await withRetry(() => transaction.save());
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// Get all transactions
export const getAllTransactions: RequestHandler = async (req, res) => {
  try {
    const transactions = await withRetry(async () =>
      (TransactionHistory.find() as any).sort({ created_at: -1 }).exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get transactions by product
export const getTransactionsByProduct: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const transactions = await withRetry(async () =>
      (TransactionHistory.find({ product_id: productId }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching product transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get transactions by warehouse
export const getTransactionsByWarehouse: RequestHandler = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const transactions = await withRetry(async () =>
      (TransactionHistory.find({
        $or: [
          { warehouse_id: warehouseId },
          { from_warehouse: warehouseId },
          { to_warehouse: warehouseId },
        ],
      }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching warehouse transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get transactions by type
export const getTransactionsByType: RequestHandler = async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = [
      "stock_in",
      "stock_out",
      "adjustment",
      "transfer",
      "return",
      "damage",
      "expiry_disposal",
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    const transactions = await withRetry(async () =>
      (TransactionHistory.find({ transaction_type: type }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions by type:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get transactions by date range
export const getTransactionsByDateRange: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const transactions = await withRetry(async () =>
      (TransactionHistory.find({
        created_at: { $gte: start, $lte: end },
      }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions by date:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get transaction by ID
export const getTransactionById: RequestHandler = async (req, res) => {
  try {
    const transaction = await withRetry(async () =>
      (TransactionHistory.findById(req.params.id) as any).exec()
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

// Get transaction by transaction_id
export const getTransactionByTransactionId: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await withRetry(async () =>
      (TransactionHistory.findOne({ transaction_id: transactionId }) as any).exec()
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

// Get transactions by user
export const getTransactionsByUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await withRetry(async () =>
      (TransactionHistory.find({ user_id: userId }) as any)
        .sort({ created_at: -1 })
        .exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get transaction summary
export const getTransactionSummary: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query: any = {};
    if (startDate && endDate) {
      query.created_at = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const totalTransactions = await withRetry(async () =>
      (TransactionHistory.countDocuments(query) as any)
    );

    const stockInCount = await withRetry(async () =>
      (TransactionHistory.countDocuments({
        ...query,
        transaction_type: "stock_in",
      }) as any)
    );

    const stockOutCount = await withRetry(async () =>
      (TransactionHistory.countDocuments({
        ...query,
        transaction_type: "stock_out",
      }) as any)
    );

    const adjustmentCount = await withRetry(async () =>
      (TransactionHistory.countDocuments({
        ...query,
        transaction_type: "adjustment",
      }) as any)
    );

    const transferCount = await withRetry(async () =>
      (TransactionHistory.countDocuments({
        ...query,
        transaction_type: "transfer",
      }) as any)
    );

    const totalValue = await withRetry(async () => {
      const result = await (TransactionHistory.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$total_value" } } },
      ]) as any).exec();
      return result[0]?.total || 0;
    });

    res.json({
      total_transactions: totalTransactions,
      stock_in: stockInCount,
      stock_out: stockOutCount,
      adjustments: adjustmentCount,
      transfers: transferCount,
      total_value: totalValue,
    });
  } catch (error) {
    console.error("Error getting transaction summary:", error);
    res.status(500).json({ error: "Failed to get summary" });
  }
};

// Get product movement history
export const getProductMovementHistory: RequestHandler = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await withRetry(async () =>
      (TransactionHistory.find({ product_id: productId }) as any)
        .sort({ created_at: -1 })
        .limit(parseInt(limit as string))
        .exec()
    );

    // Calculate running balance
    let runningBalance = 0;
    const withBalance = transactions.reverse().map((txn: any) => {
      if (txn.transaction_type === "stock_in" || txn.transaction_type === "return") {
        runningBalance += txn.quantity;
      } else {
        runningBalance -= txn.quantity;
      }
      return {
        ...txn.toObject(),
        running_balance: runningBalance,
      };
    });

    res.json(withBalance.reverse());
  } catch (error) {
    console.error("Error fetching product movement history:", error);
    res.status(500).json({ error: "Failed to fetch movement history" });
  }
};

// Delete transaction (soft delete by marking cancelled)
export const cancelTransaction: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await withRetry(async () =>
      (TransactionHistory.findById(id) as any).exec()
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    transaction.status = "cancelled";
    if (reason) transaction.notes = `Cancelled: ${reason}`;

    const updated = await withRetry(() => transaction.save());
    res.json(updated);
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    res.status(500).json({ error: "Failed to cancel transaction" });
  }
};

// Get recent transactions
export const getRecentTransactions: RequestHandler = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const transactions = await withRetry(async () =>
      (TransactionHistory.find() as any)
        .sort({ created_at: -1 })
        .limit(parseInt(limit as string))
        .exec()
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
