import { Router, RequestHandler } from "express";
import { GoodsReceipt } from "../../db/models/GoodsReceipt";
import { PurchaseOrder } from "../../db/models/PurchaseOrder";
import { Product } from "../../db/models/Product";
import { TransactionHistory } from "../../db/models/TransactionHistory";
import { LotNumber } from "../../db/models/LotNumber";
import { SerialNumber } from "../../db/models/SerialNumber";
import { recordDamagedGoods } from "../../utils/orderAccountingIntegration";

const router = Router();

// Generate GR number
const generateGRNumber = async (): Promise<string> => {
  const count = await GoodsReceipt.countDocuments();
  const year = new Date().getFullYear();
  return `GR-${year}-${String(count + 1).padStart(5, "0")}`;
};

// GET all goods receipts
const getAllGRs: RequestHandler = async (req, res) => {
  try {
    const grs = await GoodsReceipt.find().sort({ receipt_date: -1 });
    res.json(grs);
  } catch (error) {
    console.error("Error fetching GRs:", error);
    res.status(500).json({ error: "Failed to fetch goods receipts" });
  }
};

// GET GR by ID
const getGRById: RequestHandler = async (req, res) => {
  try {
    const gr = await GoodsReceipt.findById(req.params.id);
    if (!gr) {
      res.status(404).json({ error: "Goods receipt not found" });
      return;
    }
    res.json(gr);
  } catch (error) {
    console.error("Error fetching GR:", error);
    res.status(500).json({ error: "Failed to fetch goods receipt" });
  }
};

// GET GRs by PO
const getGRsByPO: RequestHandler = async (req, res) => {
  try {
    const grs = await GoodsReceipt.find({ po_id: req.params.poId }).sort({
      receipt_date: -1,
    });
    res.json(grs);
  } catch (error) {
    console.error("Error fetching PO GRs:", error);
    res.status(500).json({ error: "Failed to fetch goods receipts for PO" });
  }
};

// GET PO with remaining quantities (for creating new GR)
const getPOWithRemaining: RequestHandler = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.poId);
    if (!po) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    // Get all existing GRs for this PO
    const existingGRs = await GoodsReceipt.find({ po_id: req.params.poId });

    // Calculate remaining quantities for each item
    const itemsWithRemaining = po.items.map((poItem, index) => {
      let totalReceived = 0;
      let totalDamaged = 0;

      // Sum up all received and damaged quantities from existing GRs
      existingGRs.forEach((gr) => {
        const grItem = gr.items.find((item) => item.po_item_index === index);
        if (grItem) {
          totalReceived += grItem.received_quantity || 0;
          totalDamaged += grItem.damaged_quantity || 0;
        }
      });

      const totalProcessed = totalReceived + totalDamaged;
      const remaining = poItem.quantity - totalProcessed;

      return {
        product_id: poItem.product_id,
        po_item_index: index,
        ordered_quantity: poItem.quantity,
        already_received: totalReceived,
        already_damaged: totalDamaged,
        total_processed: totalProcessed,
        remaining_quantity: remaining,
        purchase_price: poItem.purchase_price,
      };
    });

    res.json({
      po_id: po._id,
      po_number: po.po_number,
      vendor_id: po.vendor_id,
      items: itemsWithRemaining,
    });
  } catch (error) {
    console.error("Error fetching PO with remaining:", error);
    res.status(500).json({ error: "Failed to fetch PO details" });
  }
};

// POST create goods receipt
const createGR: RequestHandler = async (req, res) => {
  try {
    const { po_id, items, received_by, notes } = req.body;

    if (!po_id || !items || items.length === 0) {
      res.status(400).json({ error: "PO ID and items are required" });
      return;
    }

    // Verify PO exists
    const po = await PurchaseOrder.findById(po_id);
    if (!po) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    // Validate items against PO
    let totalReceived = 0;
    let totalDamaged = 0;

    for (const item of items) {
      if (item.po_item_index >= po.items.length) {
        res
          .status(400)
          .json({ error: `Invalid PO item index: ${item.po_item_index}` });
        return;
      }

      const poItem = po.items[item.po_item_index];
      if (item.product_id !== poItem.product_id) {
        res
          .status(400)
          .json({ error: `Product mismatch at item ${item.po_item_index}` });
        return;
      }

      // Validate quantities
      const receivedQty = item.received_quantity || 0;
      const damagedQty = item.damaged_quantity || 0;
      const totalQty = receivedQty + damagedQty;

      if (receivedQty < 0 || damagedQty < 0) {
        res.status(400).json({
          error: `Quantities cannot be negative for item ${item.po_item_index}`,
        });
        return;
      }

      if (totalQty > poItem.quantity) {
        res.status(400).json({
          error: `Total quantity (${totalQty}) exceeds ordered quantity (${poItem.quantity}) for item ${item.po_item_index}`,
        });
        return;
      }

      totalReceived += receivedQty;
      totalDamaged += damagedQty;
    }

    const receipt_number = await generateGRNumber();

    const gr = new GoodsReceipt({
      po_id,
      po_number: po.po_number,
      vendor_id: po.vendor_id,
      receipt_number,
      items,
      received_by,
      total_received: totalReceived,
      total_damaged: totalDamaged,
      status: "pending", // Will be updated based on completeness
      notes,
    });

    await gr.save();
    res.status(201).json(gr);
  } catch (error) {
    console.error("Error creating GR:", error);
    res.status(500).json({ error: "Failed to create goods receipt" });
  }
};

// PUT update goods receipt
const updateGR: RequestHandler = async (req, res) => {
  try {
    const { items, received_by, notes, status } = req.body;

    const gr = await GoodsReceipt.findById(req.params.id);
    if (!gr) {
      res.status(404).json({ error: "Goods receipt not found" });
      return;
    }

    if (items && items.length > 0) {
      let totalReceived = 0;
      let totalDamaged = 0;

      for (const item of items) {
        totalReceived += item.received_quantity;
        totalDamaged += item.damaged_quantity || 0;
      }

      gr.items = items;
      gr.total_received = totalReceived;
      gr.total_damaged = totalDamaged;
    }

    if (received_by) gr.received_by = received_by;
    if (notes) gr.notes = notes;
    if (status && ["pending", "partial", "complete"].includes(status)) {
      gr.status = status as any;
    }

    await gr.save();
    res.json(gr);
  } catch (error) {
    console.error("Error updating GR:", error);
    res.status(500).json({ error: "Failed to update goods receipt" });
  }
};

// Generate transaction ID
const generateTransactionId = async (): Promise<string> => {
  const count = await TransactionHistory.countDocuments();
  const year = new Date().getFullYear();
  return `TXN-${year}-${String(count + 1).padStart(7, "0")}`;
};

// PUT confirm goods receipt and update inventory
const confirmGR: RequestHandler = async (req, res) => {
  try {
    const gr = await GoodsReceipt.findById(req.params.id);
    if (!gr) {
      res.status(404).json({ error: "Goods receipt not found" });
      return;
    }

    const po = await PurchaseOrder.findById(gr.po_id);
    if (!po) {
      res.status(404).json({ error: "Purchase order not found" });
      return;
    }

    // Calculate total damaged goods value for accounting
    let totalDamagedValue = 0;

    // Update inventory for each item
    for (const grItem of gr.items) {
      const product = await Product.findById(grItem.product_id);
      if (product) {
        // Add received quantity (excluding damaged)
        const goodQuantity =
          grItem.received_quantity - (grItem.damaged_quantity || 0);
        product.stock += goodQuantity;

        // Calculate damaged goods value
        const poItem = po.items[grItem.po_item_index];
        if (grItem.damaged_quantity && grItem.damaged_quantity > 0) {
          totalDamagedValue += grItem.damaged_quantity * poItem.purchase_price;
        }

        await product.save();

        // Get default warehouse (you may want to make this configurable)
        const defaultWarehouseId = product.warehouse_id || "default";

        // Create Lot Numbers if provided
        if (grItem.lot_numbers && grItem.lot_numbers.length > 0) {
          for (const lotNum of grItem.lot_numbers) {
            try {
              // Check if lot number already exists
              const existingLot = await LotNumber.findOne({
                lot_number: lotNum,
              });
              if (existingLot) {
                // Update existing lot quantity
                existingLot.quantity += Math.floor(
                  goodQuantity / grItem.lot_numbers.length,
                );
                await existingLot.save();
              } else {
                // Create new lot number
                await LotNumber.create({
                  title: product.name,
                  lot_number: lotNum,
                  product_id: grItem.product_id,
                  quantity: Math.floor(
                    goodQuantity / grItem.lot_numbers.length,
                  ),
                  warehouse_id: defaultWarehouseId,
                  status: "active",
                  notes: `Created from GR ${gr.receipt_number}`,
                  created_by: gr.received_by || "system",
                });
              }
            } catch (error) {
              console.error(
                `Error creating/updating lot number ${lotNum}:`,
                error,
              );
            }
          }
        }

        // Create Serial Numbers if provided
        if (grItem.serial_numbers && grItem.serial_numbers.length > 0) {
          for (const serialNum of grItem.serial_numbers) {
            try {
              // Check if serial number already exists
              const existingSerial = await SerialNumber.findOne({
                serial_number: serialNum,
              });
              if (!existingSerial) {
                await SerialNumber.create({
                  serial_number: serialNum,
                  product_id: grItem.product_id,
                  warehouse_id: defaultWarehouseId,
                  status: "available",
                  purchase_date: new Date(),
                  notes: `Received via GR ${gr.receipt_number}`,
                  created_by: gr.received_by || "system",
                });
              } else {
                console.warn(
                  `Serial number ${serialNum} already exists, skipping`,
                );
              }
            } catch (error) {
              console.error(
                `Error creating serial number ${serialNum}:`,
                error,
              );
            }
          }
        }

        // Create transaction for good items
        if (goodQuantity > 0) {
          const txnId = await generateTransactionId();
          const transaction = new TransactionHistory({
            transaction_id: txnId,
            transaction_type: "stock_in",
            product_id: grItem.product_id,
            quantity: goodQuantity,
            reference_type: "purchase_order",
            reference_id: gr._id,
            notes: `Received from GR ${gr.receipt_number} (PO ${po.po_number})`,
            user_name: gr.received_by || "system",
            status: "completed",
            approval_required: false,
          });
          await transaction.save();
        }

        // Create transaction for damaged items
        if ((grItem.damaged_quantity || 0) > 0) {
          const txnId = await generateTransactionId();
          const transaction = new TransactionHistory({
            transaction_id: txnId,
            transaction_type: "damage",
            product_id: grItem.product_id,
            quantity: grItem.damaged_quantity || 0,
            reference_type: "purchase_order",
            reference_id: gr._id,
            notes: `Damaged items from GR ${gr.receipt_number}: ${grItem.quality_notes || "No details"}`,
            user_name: gr.received_by || "system",
            status: "completed",
            approval_required: false,
          });
          await transaction.save();
        }
      }
    }

    // Mark GR as complete
    gr.status = "complete";
    await gr.save();

    // Create accounting entry for damaged goods if any
    if (totalDamagedValue > 0) {
      console.log(
        `Creating accounting entry for damaged goods: Rs.${totalDamagedValue}`,
      );
      await recordDamagedGoods(totalDamagedValue, gr._id, gr.receipt_number);
    }

    res.json(gr);
  } catch (error) {
    console.error("Error confirming GR:", error);
    res.status(500).json({ error: "Failed to confirm goods receipt" });
  }
};

// DELETE goods receipt
const deleteGR: RequestHandler = async (req, res) => {
  try {
    const gr = await GoodsReceipt.findByIdAndDelete(req.params.id);
    if (!gr) {
      res.status(404).json({ error: "Goods receipt not found" });
      return;
    }
    res.json({ message: "Goods receipt deleted successfully" });
  } catch (error) {
    console.error("Error deleting GR:", error);
    res.status(500).json({ error: "Failed to delete goods receipt" });
  }
};

// Setup routes - More specific routes first!
router.get("/", getAllGRs);
router.get("/po/:poId", getGRsByPO);
router.get("/po/:poId/remaining", getPOWithRemaining); // Get PO with remaining quantities
router.post("/", createGR);
router.put("/:id/confirm", confirmGR); // Must come before /:id
router.put("/:id", updateGR);
router.get("/:id", getGRById);
router.delete("/:id", deleteGR);

export default router;
