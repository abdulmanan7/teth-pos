import { RequestHandler } from 'express';
import { Order } from '../db/models/Order';
import { Product } from '../db/models/Product';
import { Customer } from '../db/models/Customer';
import { calculateOrderTotal, validateDiscount } from '../utils/discountCalculator';

// Get all orders with optional limit and sort
export const getAllOrders: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 0; // 0 = no limit
    const sort = req.query.sort === 'asc' ? 1 : -1; // -1 = descending (default, most recent first)
    
    let query = Order.find();
    
    // Apply sort by createdAt
    query = query.sort({ createdAt: sort });
    
    // Apply limit if specified
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const orders = await query.exec();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get orders by status
export const getOrdersByStatus: RequestHandler = async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ status });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order
export const getOrder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Create order with stock deduction and discount calculation
export const createOrder: RequestHandler = async (req, res) => {
  try {
    const {
      orderNumber,
      customer,
      items,
      staffId,
      paymentMethod,
      checkoutDiscount,
      taxRate = 0,
      taxRateId,
      taxRateLabel,
    } = req.body;
    
    // Validate items exist
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate checkout discount if provided
    if (checkoutDiscount) {
      const validation = validateDiscount(checkoutDiscount);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Deduct stock for each item and validate discounts
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      // Validate item discount if provided
      if (item.discount) {
        const validation = validateDiscount(item.discount);
        if (!validation.valid) {
          return res.status(400).json({ error: `Invalid discount for ${product.name}: ${validation.error}` });
        }
      }

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Use frontend-calculated totals (already include mixed tax logic)
    const subtotalAfterDiscount = req.body.subtotalAfterDiscount || 0;
    const checkoutDiscountAmount = req.body.checkoutDiscountAmount || 0;
    const totalBeforeTax = req.body.totalBeforeTax || 0;
    const taxAmount = req.body.taxAmount || 0;
    const grandTotal = req.body.total || 0;

    // Update customer stats if not walk-in
    if (customer && customer !== 'Walk-in') {
      const customerDoc = await Customer.findOne({ name: customer });
      if (customerDoc) {
        customerDoc.totalOrders += 1;
        customerDoc.totalSpent += grandTotal;
        await customerDoc.save();
      }
    }

    // Create order with discount information
    const order = new Order({
      orderNumber,
      customer,
      items: items.map((item: any) => {
        const {
          taxRateId: incomingTaxRateId,
          taxRateLabel: incomingTaxRateLabel,
          taxRateValue,
          taxAmount: incomingTaxAmount,
          taxableBase: incomingTaxableBase,
          ...rest
        } = item;
        const baseSubtotal = item.price * item.quantity;
        const discountValue = item.discount
          ? item.discount.type === 'percentage'
            ? (baseSubtotal * item.discount.value) / 100
          : item.discount.value
          : 0;
        const normalizedDiscount = Math.min(Math.max(discountValue, 0), baseSubtotal);
        const totalAfterDiscount = baseSubtotal - normalizedDiscount;

        const taxableBase =
          typeof incomingTaxableBase === 'number'
            ? Math.round(incomingTaxableBase * 100) / 100
            : undefined;
        const itemTaxAmount =
          typeof incomingTaxAmount === 'number'
            ? Math.round(incomingTaxAmount * 100) / 100
            : undefined;

        return {
          ...rest,
          subtotal: Math.round(baseSubtotal * 100) / 100,
          discountAmount: Math.round(normalizedDiscount * 100) / 100,
          totalAfterDiscount: Math.round(totalAfterDiscount * 100) / 100,
          taxRateId: incomingTaxRateId,
          taxRateLabel: incomingTaxRateLabel,
          taxRate: typeof taxRateValue === 'number' ? taxRateValue : undefined,
          taxAmount: itemTaxAmount ?? 0,
          taxableBase: taxableBase ?? undefined,
        };
      }),
      subtotal: req.body.subtotal || 0,
      itemDiscountTotal: req.body.itemDiscountTotal || 0,
      subtotalAfterDiscount,
      checkoutDiscount,
      checkoutDiscountAmount,
      totalBeforeTax,
      taxRate: req.body.taxRate || 0,
      taxAmount,
      taxRateId: req.body.taxRateId,
      taxRateLabel: req.body.taxRateLabel,
      total: grandTotal,
      status: 'completed',
      staffId,
      staffName: req.body.staffName,
      paymentMethod,
      completedAt: new Date(),
    });
    
    await order.save();

    // Create accounting entries for the order
    try {
      const { createOrderAccountingEntries } = await import('../utils/orderAccountingIntegration');
      await createOrderAccountingEntries(order);
    } catch (accountingError) {
      console.error('Error creating accounting entries:', accountingError);
      // Don't fail the order if accounting fails
    }

    res.status(201).json({
      success: true,
      order,
      message: 'Order completed successfully and stock deducted'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Update order status
export const updateOrderStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// Delete order
export const deleteOrder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
