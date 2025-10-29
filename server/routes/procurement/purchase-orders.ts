import { Router, RequestHandler } from 'express';
import { PurchaseOrder } from '../../db/models/PurchaseOrder';
import { Vendor } from '../../db/models/Vendor';
import { Product } from '../../db/models/Product';
import { TransactionHistory } from '../../db/models/TransactionHistory';

const router = Router();

// Generate PO number
const generatePONumber = async (): Promise<string> => {
  const count = await PurchaseOrder.countDocuments();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
};

// GET all purchase orders
const getAllPOs: RequestHandler = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ order_date: -1 });
    res.json(pos);
  } catch (error) {
    console.error('Error fetching POs:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

// GET purchase order by ID
const getPOById: RequestHandler = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }
    res.json(po);
  } catch (error) {
    console.error('Error fetching PO:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
};

// GET POs by vendor
const getPOsByVendor: RequestHandler = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({ vendor_id: req.params.vendorId }).sort({ order_date: -1 });
    res.json(pos);
  } catch (error) {
    console.error('Error fetching vendor POs:', error);
    res.status(500).json({ error: 'Failed to fetch vendor purchase orders' });
  }
};

// POST create purchase order
const createPO: RequestHandler = async (req, res) => {
  try {
    const { vendor_id, items, expected_delivery, notes } = req.body;

    if (!vendor_id || !items || items.length === 0) {
      res.status(400).json({ error: 'Vendor ID and items are required' });
      return;
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    // Verify all products exist and calculate total
    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        res.status(404).json({ error: `Product ${item.product_id} not found` });
        return;
      }

      const line_total = item.quantity * item.purchase_price;
      total_amount += line_total;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        purchase_price: item.purchase_price,
        line_total,
      });
    }

    const po_number = await generatePONumber();

    const po = new PurchaseOrder({
      po_number,
      vendor_id,
      items: validatedItems,
      total_amount,
      status: 'draft',
      payment_status: 'pending',
      order_date: new Date(),
      expected_delivery: expected_delivery ? new Date(expected_delivery) : undefined,
      notes,
    });

    await po.save();

    // Update vendor stats
    vendor.total_purchases += 1;
    vendor.total_spent += total_amount;
    await vendor.save();

    res.status(201).json(po);
  } catch (error) {
    console.error('Error creating PO:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
};

// PUT update purchase order
const updatePO: RequestHandler = async (req, res) => {
  try {
    const { items, expected_delivery, actual_delivery, notes } = req.body;

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    if (items && items.length > 0) {
      let total_amount = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          res.status(404).json({ error: `Product ${item.product_id} not found` });
          return;
        }

        const line_total = item.quantity * item.purchase_price;
        total_amount += line_total;

        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          purchase_price: item.purchase_price,
          line_total,
        });
      }

      po.items = validatedItems;
      po.total_amount = total_amount;
    }

    if (expected_delivery) po.expected_delivery = new Date(expected_delivery);
    if (actual_delivery) po.actual_delivery = new Date(actual_delivery);
    if (notes) po.notes = notes;

    await po.save();
    res.json(po);
  } catch (error) {
    console.error('Error updating PO:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
};

// PUT update PO status
const updatePOStatus: RequestHandler = async (req, res) => {
  try {
    const { status, payment_status } = req.body;

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    const validStatuses = ['draft', 'sent', 'confirmed', 'received', 'invoiced', 'paid'];
    const validPaymentStatuses = ['pending', 'partial', 'paid'];

    if (status && validStatuses.includes(status)) {
      po.status = status as any;
      // NOTE: Inventory is NOT updated here anymore
      // Inventory updates happen through Goods Receipt (GR) process
      // This allows for partial receipts, quality checks, and barcode scanning
    }

    if (payment_status && validPaymentStatuses.includes(payment_status)) {
      po.payment_status = payment_status as any;
    }

    await po.save();
    res.json(po);
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({ error: 'Failed to update purchase order status' });
  }
};

// POST record payment
const recordPayment: RequestHandler = async (req, res) => {
  try {
    const { amount, payment_method, reference, notes } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than 0' });
      return;
    }

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    // Add payment record to history
    const paymentRecord = {
      amount,
      payment_date: new Date(),
      payment_method: payment_method || 'other',
      reference: reference || '',
      notes: notes || '',
    };

    po.payment_history.push(paymentRecord as any);
    po.amount_paid += amount;

    // Auto-update payment status based on amount paid
    if (po.amount_paid >= po.total_amount) {
      po.payment_status = 'paid';
      po.amount_paid = po.total_amount; // Cap at total
    } else if (po.amount_paid > 0) {
      po.payment_status = 'partial';
    }

    await po.save();
    res.json(po);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

// DELETE purchase order
const deletePO: RequestHandler = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    // Update vendor stats
    const vendor = await Vendor.findById(po.vendor_id);
    if (vendor) {
      vendor.total_purchases = Math.max(0, vendor.total_purchases - 1);
      vendor.total_spent = Math.max(0, vendor.total_spent - po.total_amount);
      await vendor.save();
    }

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting PO:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
};

router.get('/', getAllPOs);
router.get('/:id', getPOById);
router.get('/vendor/:vendorId', getPOsByVendor);
router.post('/', createPO);
router.put('/:id', updatePO);
router.put('/:id/status', updatePOStatus);
router.post('/:id/payment', recordPayment);
router.delete('/:id', deletePO);

export default router;
