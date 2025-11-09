import { RequestHandler } from "express";
import Return from "../db/models/Return";
import { Order } from "../db/models/Order";
import { Product } from "../db/models/Product";
import { createReturnAccountingEntries } from "../utils/orderAccountingIntegration";

// Create a new return request
export const createReturn: RequestHandler = async (req, res) => {
  try {
    const {
      originalOrderId,
      originalOrderNumber,
      customer,
      items,
      returnType,
      refundMethod,
      replacementItems,
      priceAdjustment,
      notes,
    } = req.body;

    // Validate order exists
    const order = await Order.findById(originalOrderId);
    if (!order) {
      return res.status(404).json({ error: "Original order not found" });
    }

    // Calculate totals
    let originalTotal = 0;
    let totalRefund = 0;
    let totalExchange = 0;

    // Calculate refund amount
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }
      const itemTotal = product.price * item.quantity;
      originalTotal += itemTotal;
      totalRefund += itemTotal;
    }

    // Calculate exchange value
    if (replacementItems && replacementItems.length > 0) {
      for (const replacement of replacementItems) {
        const product = await Product.findById(replacement.productId);
        if (!product) {
          return res.status(404).json({ error: `Product ${replacement.productId} not found` });
        }
        totalExchange += product.price * replacement.quantity;
      }
    }

    // Calculate net adjustment
    let netAdjustment = totalRefund - totalExchange + (priceAdjustment || 0);

    // Generate return number
    const returnNumber = `RET-${Date.now()}`;

    // Create return record
    const newReturn = new Return({
      returnNumber,
      originalOrderId,
      originalOrderNumber,
      customer,
      items,
      returnType,
      refundMethod,
      replacementItems,
      priceAdjustment,
      notes,
      originalTotal,
      totalRefund,
      totalExchange,
      netAdjustment,
      status: "pending",
    });

    await newReturn.save();

    // Handle inventory changes based on return reason and type
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        // If item is defective, don't add back to stock (it's damaged/unusable)
        if (item.reason === "defective") {
          // No inventory change for defective items
          continue;
        }
        
        // If item is not defective, add it back to stock
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Handle replacement inventory
    // For replacement with same product, no inventory change (1 out, 1 in)
    if (replacementItems && replacementItems.length > 0) {
      for (const replacement of replacementItems) {
        const product = await Product.findById(replacement.productId);
        if (product) {
          // Same product replacement: no inventory change (1 out, 1 in)
          // This is already handled by the returned item being restocked
          await product.save();
        }
      }
    }

    res.json({
      success: true,
      return: newReturn,
      message: "Return request created successfully",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get all returns
export const getReturns: RequestHandler = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("originalOrderId")
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get return by ID
export const getReturnById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const returnRecord = await Return.findById(id).populate("originalOrderId");
    if (!returnRecord) {
      return res.status(404).json({ error: "Return not found" });
    }
    res.json(returnRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get returns by order ID
export const getReturnsByOrderId: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const returns = await Return.find({ originalOrderId: orderId }).sort({
      createdAt: -1,
    });
    res.json(returns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get returns by customer
export const getReturnsByCustomer: RequestHandler = async (req, res) => {
  try {
    const { customer } = req.params;
    const returns = await Return.find({ customer }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get returns by status
export const getReturnsByStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.params;
    const returns = await Return.find({ status }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Approve return
export const approveReturn: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ error: "Return not found" });
    }

    // Calculate total refund value for accounting
    let totalRefundValue = 0;
    for (const item of returnRecord.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        totalRefundValue += product.price * item.quantity;
      }
    }

    // Create accounting entries for the return
    if (totalRefundValue > 0) {
      await createReturnAccountingEntries(
        totalRefundValue,
        returnRecord._id.toString(),
        returnRecord.returnNumber,
        returnRecord.returnType
      );
    }

    const updatedReturn = await Return.findByIdAndUpdate(
      id,
      {
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      return: updatedReturn,
      message: "Return approved with accounting entries created",
    });
  } catch (error: any) {
    console.error("Error approving return:", error);
    res.status(500).json({ error: error.message });
  }
};

// Reject return
export const rejectReturn: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ error: "Return not found" });
    }

    // Remove returned items from stock (reverse the addition)
    for (const item of returnRecord.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    const updated = await Return.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        notes: reason,
      },
      { new: true }
    );

    res.json({
      success: true,
      return: updated,
      message: "Return rejected",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Complete return (process refund/replacement)
export const completeReturn: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { processedBy } = req.body;

    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ error: "Return not found" });
    }

    if (returnRecord.status !== "approved") {
      return res.status(400).json({ error: "Return must be approved first" });
    }

    // Handle replacement items - deduct from stock and create accounting entries
    let replacementValue = 0;
    if (returnRecord.replacementItems && returnRecord.replacementItems.length > 0) {
      for (const replacement of returnRecord.replacementItems) {
        const product = await Product.findById(replacement.productId);
        if (product) {
          if (product.stock < replacement.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for replacement item: ${replacement.productName}`,
            });
          }
          product.stock -= replacement.quantity;
          replacementValue += (product.price || 0) * replacement.quantity;
          await product.save();
        }
      }

      // Create accounting entries for replacement items
      if (replacementValue > 0) {
        await createReturnAccountingEntries(
          replacementValue,
          returnRecord._id.toString(),
          returnRecord.returnNumber,
          "replacement"
        );
      }
    }

    // Update return status
    const updated = await Return.findByIdAndUpdate(
      id,
      {
        status: "completed",
        processedBy,
        processedAt: new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      return: updated,
      message: "Return completed successfully with accounting entries",
    });
  } catch (error: any) {
    console.error("Error completing return:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update return
export const updateReturn: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const returnRecord = await Return.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!returnRecord) {
      return res.status(404).json({ error: "Return not found" });
    }

    res.json({
      success: true,
      return: returnRecord,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete return
export const deleteReturn: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ error: "Return not found" });
    }

    // Reverse stock adjustments if return was pending
    if (returnRecord.status === "pending") {
      for (const item of returnRecord.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock -= item.quantity;
          await product.save();
        }
      }
    }

    await Return.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Return deleted",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get return statistics
export const getReturnStats: RequestHandler = async (req, res) => {
  try {
    const totalReturns = await Return.countDocuments();
    const pendingReturns = await Return.countDocuments({ status: "pending" });
    const approvedReturns = await Return.countDocuments({ status: "approved" });
    const completedReturns = await Return.countDocuments({ status: "completed" });
    const rejectedReturns = await Return.countDocuments({ status: "rejected" });

    const totalRefunded = await Return.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$netAdjustment" } } },
    ]);

    res.json({
      totalReturns,
      pendingReturns,
      approvedReturns,
      completedReturns,
      rejectedReturns,
      totalRefunded: totalRefunded[0]?.total || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
