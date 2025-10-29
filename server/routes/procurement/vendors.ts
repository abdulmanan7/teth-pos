import { Router, RequestHandler } from 'express';
import { Vendor } from '../../db/models/Vendor';

const router = Router();

// GET all vendors
const getAllVendors: RequestHandler = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
};

// GET vendor by ID
const getVendorById: RequestHandler = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
};

// POST create vendor
const createVendor: RequestHandler = async (req, res) => {
  try {
    const { name, code, email, phone, address, city, state, zip_code, contact_person, payment_terms, notes } = req.body;

    if (!name || !code || !email) {
      res.status(400).json({ error: 'Name, code, and email are required' });
      return;
    }

    // Check if code already exists
    const existingVendor = await Vendor.findOne({ code });
    if (existingVendor) {
      res.status(400).json({ error: 'Vendor code already exists' });
      return;
    }

    const vendor = new Vendor({
      name,
      code,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      contact_person,
      payment_terms,
      notes,
      is_active: true,
      rating: 0,
      total_purchases: 0,
      total_spent: 0,
    });

    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
};

// PUT update vendor
const updateVendor: RequestHandler = async (req, res) => {
  try {
    const { name, code, email, phone, address, city, state, zip_code, contact_person, payment_terms, is_active, rating, notes } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    // Check if new code conflicts with other vendors
    if (code && code !== vendor.code) {
      const existingVendor = await Vendor.findOne({ code });
      if (existingVendor) {
        res.status(400).json({ error: 'Vendor code already exists' });
        return;
      }
    }

    if (name) vendor.name = name;
    if (code) vendor.code = code;
    if (email) vendor.email = email;
    if (phone) vendor.phone = phone;
    if (address) vendor.address = address;
    if (city) vendor.city = city;
    if (state) vendor.state = state;
    if (zip_code) vendor.zip_code = zip_code;
    if (contact_person) vendor.contact_person = contact_person;
    if (payment_terms) vendor.payment_terms = payment_terms;
    if (notes) vendor.notes = notes;
    if (is_active !== undefined) vendor.is_active = is_active;
    if (rating !== undefined) vendor.rating = Math.min(5, Math.max(0, rating));

    await vendor.save();
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
};

// DELETE vendor
const deleteVendor: RequestHandler = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
};

router.get('/', getAllVendors);
router.get('/:id', getVendorById);
router.post('/', createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router;
