import { RequestHandler } from 'express';
import { Order } from '../db/models/Order';
import { Product } from '../db/models/Product';
import { Customer } from '../db/models/Customer';

// Get all orders
export const getAllOrders: RequestHandler = async (req, res) => {
  try {
    const orders = await Order.find();
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

// Create order with stock deduction
export const createOrder: RequestHandler = async (req, res) => {
  try {
    const { orderNumber, customer, items, total, staffId, paymentMethod } = req.body;
    
    // Validate items exist
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Deduct stock for each item
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

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Update customer stats if not walk-in
    if (customer && customer !== 'Walk-in') {
      const customerDoc = await Customer.findOne({ name: customer });
      if (customerDoc) {
        customerDoc.totalOrders += 1;
        customerDoc.totalSpent += total;
        await customerDoc.save();
      }
    }

    // Create order with additional fields
    const order = new Order({
      orderNumber,
      customer,
      items,
      total,
      status: 'completed',
      staffId,
      paymentMethod,
      completedAt: new Date(),
    });
    
    await order.save();
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
