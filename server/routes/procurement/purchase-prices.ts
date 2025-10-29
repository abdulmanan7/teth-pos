import { Router, RequestHandler } from 'express';
import { PurchasePrice } from '../../db/models/PurchasePrice';
import { Product } from '../../db/models/Product';
import { Vendor } from '../../db/models/Vendor';

const router = Router();

// GET all purchase prices
const getAllPrices: RequestHandler = async (req, res) => {
  try {
    const prices = await PurchasePrice.find().sort({ createdAt: -1 });
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
};

// GET prices for a specific product
const getPricesByProduct: RequestHandler = async (req, res) => {
  try {
    const prices = await PurchasePrice.find({ product_id: req.params.productId, is_active: true }).sort({ purchase_price: 1 });
    res.json(prices);
  } catch (error) {
    console.error('Error fetching product prices:', error);
    res.status(500).json({ error: 'Failed to fetch product prices' });
  }
};

// GET prices from a specific vendor
const getPricesByVendor: RequestHandler = async (req, res) => {
  try {
    const prices = await PurchasePrice.find({ vendor_id: req.params.vendorId, is_active: true }).sort({ purchase_price: 1 });
    res.json(prices);
  } catch (error) {
    console.error('Error fetching vendor prices:', error);
    res.status(500).json({ error: 'Failed to fetch vendor prices' });
  }
};

// GET compare vendors for a product
const comparePrices: RequestHandler = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Get all active prices for this product
    const prices = await PurchasePrice.find({ product_id: productId, is_active: true });
    
    if (prices.length === 0) {
      res.json({ product_id: productId, prices: [], message: 'No prices found for this product' });
      return;
    }

    // Enrich with vendor information
    const enrichedPrices = await Promise.all(
      prices.map(async (price) => {
        const vendor = await Vendor.findById(price.vendor_id);
        return {
          ...price.toObject(),
          vendor_name: vendor?.name || 'Unknown',
          vendor_rating: vendor?.rating || 0,
        };
      })
    );

    // Sort by price
    enrichedPrices.sort((a, b) => a.purchase_price - b.purchase_price);

    res.json({
      product_id: productId,
      prices: enrichedPrices,
      cheapest: enrichedPrices[0],
      average_price: enrichedPrices.reduce((sum, p) => sum + p.purchase_price, 0) / enrichedPrices.length,
    });
  } catch (error) {
    console.error('Error comparing prices:', error);
    res.status(500).json({ error: 'Failed to compare prices' });
  }
};

// POST create purchase price
const createPrice: RequestHandler = async (req, res) => {
  try {
    const { product_id, vendor_id, purchase_price, minimum_quantity, maximum_quantity, lead_time_days, currency, notes } = req.body;

    if (!product_id || !vendor_id || purchase_price === undefined || !minimum_quantity || !maximum_quantity) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Verify product exists
    const product = await Product.findById(product_id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    const price = new PurchasePrice({
      product_id,
      vendor_id,
      purchase_price,
      minimum_quantity,
      maximum_quantity,
      lead_time_days: lead_time_days || 0,
      currency: currency || 'USD',
      is_active: true,
      effective_from: new Date(),
      notes,
    });

    await price.save();
    res.status(201).json(price);
  } catch (error) {
    console.error('Error creating price:', error);
    res.status(500).json({ error: 'Failed to create price' });
  }
};

// PUT update purchase price
const updatePrice: RequestHandler = async (req, res) => {
  try {
    const { purchase_price, minimum_quantity, maximum_quantity, lead_time_days, currency, is_active, notes } = req.body;

    const price = await PurchasePrice.findById(req.params.id);
    if (!price) {
      res.status(404).json({ error: 'Price not found' });
      return;
    }

    if (purchase_price !== undefined) price.purchase_price = purchase_price;
    if (minimum_quantity !== undefined) price.minimum_quantity = minimum_quantity;
    if (maximum_quantity !== undefined) price.maximum_quantity = maximum_quantity;
    if (lead_time_days !== undefined) price.lead_time_days = lead_time_days;
    if (currency) price.currency = currency;
    if (is_active !== undefined) price.is_active = is_active;
    if (notes) price.notes = notes;

    await price.save();
    res.json(price);
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ error: 'Failed to update price' });
  }
};

// DELETE purchase price
const deletePrice: RequestHandler = async (req, res) => {
  try {
    const price = await PurchasePrice.findByIdAndDelete(req.params.id);
    if (!price) {
      res.status(404).json({ error: 'Price not found' });
      return;
    }
    res.json({ message: 'Price deleted successfully' });
  } catch (error) {
    console.error('Error deleting price:', error);
    res.status(500).json({ error: 'Failed to delete price' });
  }
};

router.get('/', getAllPrices);
router.get('/product/:productId', getPricesByProduct);
router.get('/vendor/:vendorId', getPricesByVendor);
router.get('/compare/:productId', comparePrices);
router.post('/', createPrice);
router.put('/:id', updatePrice);
router.delete('/:id', deletePrice);

export default router;
