import { RequestHandler } from 'express';
import { Customer } from '../db/models/Customer';

// Get all customers
export const getAllCustomers: RequestHandler = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get single customer
export const getCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Create customer
export const createCustomer: RequestHandler = async (req, res) => {
  try {
    const { name, email, phone, city } = req.body;
    
    const customer = new Customer({
      name,
      email,
      phone,
      city,
      totalOrders: 0,
      totalSpent: 0,
    });
    
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

// Update customer
export const updateCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, city, totalOrders, totalSpent } = req.body;
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      { name, email, phone, city, totalOrders, totalSpent },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

// Delete customer
export const deleteCustomer: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndDelete(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};
