import { ChartOfAccount } from "../db/models/accounting/ChartOfAccount";
import { addTransactionLine } from "./accountingUtils";
import type { IOrder } from "../db/models/Order";

/**
 * Create accounting entries when an order is completed
 *
 * Accounting entries for a sale:
 * 1. DEBIT: Cash (1060) - Money received
 *    CREDIT: Sales Revenue (4100) - Revenue earned
 *
 * 2. DEBIT: Cost of Goods Sold (5010) - Cost of items sold
 *    CREDIT: Inventory (1510) - Reduce inventory value
 */
export async function createOrderAccountingEntries(order: IOrder) {
  try {
    // Get required accounts
    const cashAccount = await ChartOfAccount.findOne({ code: "1060" }); // Cash
    const salesRevenueAccount = await ChartOfAccount.findOne({ code: "4100" }); // Sales Revenue
    const cogsAccount = await ChartOfAccount.findOne({ code: "5010" }); // Cost of Goods Sold
    const inventoryAccount = await ChartOfAccount.findOne({ code: "1510" }); // Inventory

    if (
      !cashAccount ||
      !salesRevenueAccount ||
      !cogsAccount ||
      !inventoryAccount
    ) {
      console.error(
        "Required accounting accounts not found. Please initialize chart of accounts.",
      );
      return;
    }

    const orderDate = order.completedAt || order.createdAt;

    // Entry 1: Record the sale (Cash received, Revenue earned)
    // DEBIT: Cash
    await addTransactionLine({
      account_id: cashAccount._id,
      reference: "Order",
      reference_id: order._id,
      date: orderDate,
      debit: order.total,
      credit: 0,
      description: `Sale - Order ${order.orderNumber} - ${order.customer}`,
    });

    // CREDIT: Sales Revenue
    await addTransactionLine({
      account_id: salesRevenueAccount._id,
      reference: "Order",
      reference_id: order._id,
      date: orderDate,
      debit: 0,
      credit: order.total,
      description: `Sale - Order ${order.orderNumber} - ${order.customer}`,
    });

    // Entry 2: Record cost of goods sold (COGS and Inventory reduction)
    // Calculate total cost of items sold
    // Note: You'll need to add cost/purchase price to your Product model
    // For now, we'll use a simple calculation: 60% of sale price as cost
    const estimatedCost = order.total * 0.6; // This should be replaced with actual product costs

    // DEBIT: Cost of Goods Sold
    await addTransactionLine({
      account_id: cogsAccount._id,
      reference: "Order",
      reference_id: order._id,
      date: orderDate,
      debit: estimatedCost,
      credit: 0,
      description: `COGS - Order ${order.orderNumber}`,
    });

    // CREDIT: Inventory
    await addTransactionLine({
      account_id: inventoryAccount._id,
      reference: "Order",
      reference_id: order._id,
      date: orderDate,
      debit: 0,
      credit: estimatedCost,
      description: `Inventory reduction - Order ${order.orderNumber}`,
    });
  } catch (error) {
    console.error("Error creating order accounting entries:", error);
    // Don't throw error - we don't want to block order creation if accounting fails
  }
}

/**
 * Create accounting entries when a purchase order is completed
 *
 * Accounting entries for a purchase:
 * 1. DEBIT: Inventory (1510) - Increase inventory value
 *    CREDIT: Accounts Payable (2100) - Money owed to supplier
 */
export async function createPurchaseOrderAccountingEntries(
  purchaseOrder: any, // Replace with actual PurchaseOrder type
) {
  try {
    // Get required accounts
    const inventoryAccount = await ChartOfAccount.findOne({ code: "1510" }); // Inventory
    const accountsPayableAccount = await ChartOfAccount.findOne({
      code: "2100",
    }); // Accounts Payable

    if (!inventoryAccount || !accountsPayableAccount) {
      console.error(
        "Required accounting accounts not found. Please initialize chart of accounts.",
      );
      return;
    }

    const poDate = purchaseOrder.actual_delivery || purchaseOrder.order_date;

    // DEBIT: Inventory (increase inventory value)
    await addTransactionLine({
      account_id: inventoryAccount._id,
      reference: "PurchaseOrder",
      reference_id: purchaseOrder._id,
      date: new Date(poDate),
      debit: purchaseOrder.total_amount,
      credit: 0,
      description: `Purchase - PO ${purchaseOrder.po_number}`,
    });

    // CREDIT: Accounts Payable (money owed to supplier)
    await addTransactionLine({
      account_id: accountsPayableAccount._id,
      reference: "PurchaseOrder",
      reference_id: purchaseOrder._id,
      date: new Date(poDate),
      debit: 0,
      credit: purchaseOrder.total_amount,
      description: `Purchase - PO ${purchaseOrder.po_number}`,
    });
  } catch (error) {
    console.error("Error creating purchase order accounting entries:", error);
  }
}

/**
 * Create accounting entries when a payment is made to a supplier
 *
 * Accounting entries for payment:
 * DEBIT: Accounts Payable (2100) - Reduce amount owed
 * CREDIT: Cash (1060) - Money paid out
 */
export async function createPaymentAccountingEntries(payment: any) {
  try {
    const cashAccount = await ChartOfAccount.findOne({ code: "1060" }); // Cash
    const accountsPayableAccount = await ChartOfAccount.findOne({
      code: "2100",
    }); // Accounts Payable

    if (!cashAccount || !accountsPayableAccount) {
      console.error("Required accounting accounts not found.");
      return;
    }

    // DEBIT: Accounts Payable
    await addTransactionLine({
      account_id: accountsPayableAccount._id,
      reference: "Payment",
      reference_id: payment._id,
      date: new Date(payment.payment_date),
      debit: payment.amount,
      credit: 0,
      description: `Payment - ${payment.reference || "Supplier payment"}`,
    });

    // CREDIT: Cash
    await addTransactionLine({
      account_id: cashAccount._id,
      reference: "Payment",
      reference_id: payment._id,
      date: new Date(payment.payment_date),
      debit: 0,
      credit: payment.amount,
      description: `Payment - ${payment.reference || "Supplier payment"}`,
    });
  } catch (error) {
    console.error("Error creating payment accounting entries:", error);
  }
}

/**
 * Create accounting entries for damaged goods in Goods Receipt
 *
 * Accounting entries for damaged goods:
 * DEBIT: Damaged Goods Expense (5010 - COGS) - Record the loss
 * CREDIT: Inventory (1510) - Reduce inventory value
 */
export async function createDamagedGoodsAccountingEntries(goodsReceipt: any) {
  try {
    // Only create entries if there are damaged goods
    if (!goodsReceipt.total_damaged || goodsReceipt.total_damaged === 0) {
      return;
    }

    const inventoryAccount = await ChartOfAccount.findOne({ code: "1510" }); // Inventory
    const cogsAccount = await ChartOfAccount.findOne({ code: "5010" }); // COGS (we'll use this for damaged goods)

    if (!inventoryAccount || !cogsAccount) {
      console.error(
        "Required accounting accounts not found for damaged goods.",
      );
      return;
    }

    // Calculate total value of damaged goods
    // We need to get the purchase price from the PO
    // For now, we'll need to calculate this based on the items
    // This is a simplified version - you may want to pass the actual damaged value
    // For this implementation, we'll use a placeholder that should be calculated from PO prices

    // This function will be called from confirmGR with the actual damaged value
  } catch (error) {
    console.error("Error creating damaged goods accounting entries:", error);
  }
}

/**
 * Create accounting entry for damaged goods with specific value
 *
 * @param damagedValue - Total value of damaged goods
 * @param grId - Goods Receipt ID
 * @param grNumber - Goods Receipt number
 */
export async function recordDamagedGoods(
  damagedValue: number,
  grId: string,
  grNumber: string,
) {
  try {
    if (damagedValue <= 0) {
      return;
    }

    const inventoryAccount = await ChartOfAccount.findOne({ code: "1510" }); // Inventory
    const cogsAccount = await ChartOfAccount.findOne({ code: "5010" }); // COGS

    if (!inventoryAccount || !cogsAccount) {
      console.error(
        "Required accounting accounts not found for damaged goods.",
      );
      return;
    }

    // DEBIT: COGS (Damaged Goods Expense)
    await addTransactionLine({
      account_id: cogsAccount._id,
      reference: "GoodsReceipt",
      reference_id: grId,
      date: new Date(),
      debit: damagedValue,
      credit: 0,
      description: `Damaged goods - GR ${grNumber}`,
    });

    // CREDIT: Inventory (Reduce inventory)
    await addTransactionLine({
      account_id: inventoryAccount._id,
      reference: "GoodsReceipt",
      reference_id: grId,
      date: new Date(),
      debit: 0,
      credit: damagedValue,
      description: `Damaged goods - GR ${grNumber}`,
    });

    console.log(
      `✅ Accounting entries created for damaged goods: Rs.${damagedValue}`,
    );
  } catch (error) {
    console.error("Error recording damaged goods:", error);
  }
}
