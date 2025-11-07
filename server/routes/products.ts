import { RequestHandler } from 'express';
import { Product } from '../db/models/Product';
import { SerialNumber } from '../db/models/SerialNumber';
import { LotNumber } from '../db/models/LotNumber';
import { BarcodeMapping } from '../db/models/BarcodeMapping';

// Get all products
export const getAllProducts: RequestHandler = async (req, res) => {
  try {
    // Use aggregation to join with BarcodeMapping for SKU
    const products = await Product.aggregate([
      {
        $lookup: {
          from: 'barcodemappings',
          let: { productId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product_id', '$$productId'] },
                    { $eq: ['$barcode_type', 'sku'] },
                    { $eq: ['$is_active', true] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'skuBarcode'
        }
      },
      {
        $addFields: {
          sku: {
            $ifNull: [
              { $arrayElemAt: ['$skuBarcode.barcode', 0] },
              'N/A'
            ]
          }
        }
      },
      {
        $project: {
          skuBarcode: 0
        }
      }
    ]);
    
    // Add hasSerialNumbers flag to each product
    const productsWithSerialFlag = await Promise.all(
      products.map(async (product) => {
        const serialCount = await SerialNumber.countDocuments({ product_id: product._id });
        return {
          ...product,
          hasSerialNumbers: serialCount > 0,
        };
      })
    );
    
    res.json(productsWithSerialFlag);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get products by category
export const getProductsByCategory: RequestHandler = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product
export const getProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create product
export const createProduct: RequestHandler = async (req, res) => {
  try {
    const { name, price, quantity, stock, category, description, unit, unit_custom, warehouse_id, status } = req.body;
    
    const product = new Product({
      name,
      price,
      quantity: quantity || 1,
      stock: stock || 0,
      category,
      description,
      unit: unit || 'piece',
      unit_custom,
      warehouse_id,
      status: status || 'active',
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product
export const updateProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, quantity, category, description, unit, unit_custom, warehouse_id, status } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      id,
      { name, price, stock, quantity, category, description, unit, unit_custom, warehouse_id, status },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
export const deleteProduct: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Search products by name, SKU, lot number, or serial number
export const searchProducts: RequestHandler = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    // Search in multiple collections
    const [
      productsByName,
      productsBySKU,
      productsByDirectSKU,
      lotNumbers,
      serialNumbers
    ] = await Promise.all([
      // Search by product name
      Product.find({ 
        name: searchRegex,
        $or: [
          { status: { $exists: false } },
          { status: 'active' }
        ]
      }).limit(20),
      
      // Search by barcode (any type - SKU, lot, serial, etc.)
      BarcodeMapping.find({
        barcode: searchRegex,
        is_active: true
      }).limit(20),
      
      // Search by direct SKU field in Product
      Product.find({
        sku: searchRegex,
        $or: [
          { status: { $exists: false } },
          { status: 'active' }
        ]
      }).limit(20),
      
      // Search by lot number
      LotNumber.find({
        lot_number: searchRegex,
        status: 'active'
      }).limit(20),
      
      // Search by serial number
      SerialNumber.find({
        serial_number: searchRegex,
        status: 'available'
      }).limit(20)
    ]);

    // Collect unique product IDs
    const productIds = new Set<string>();
    
    // Add products found by name
    productsByName.forEach(p => productIds.add(p._id.toString()));
    
    // Add products found by barcode (any type)
    productsBySKU.forEach(b => productIds.add(b.product_id));
    
    // Add products found by direct SKU
    productsByDirectSKU.forEach(p => productIds.add(p._id.toString()));
    
    // Add products found by lot number
    lotNumbers.forEach(l => productIds.add(l.product_id));
    
    // Add products found by serial number
    serialNumbers.forEach(s => productIds.add(s.product_id));
    // If no products found, return empty result
    if (productIds.size === 0) {
      return res.json({
        query: searchTerm,
        results: [],
        count: 0
      });
    }

    // Convert string IDs to ObjectId for MongoDB
    const mongoose = await import('mongoose');
    const objectIds = Array.from(productIds).map(id => new mongoose.Types.ObjectId(id));

    // Fetch all unique products with their details
    const products = await Product.aggregate([
      {
        $match: {
          _id: { $in: objectIds }
        }
      },
      {
        $lookup: {
          from: 'barcodemappings',
          let: { productId: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product_id', '$$productId'] },
                    { $eq: ['$barcode_type', 'sku'] },
                    { $eq: ['$is_active', true] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'skuBarcode'
        }
      },
      {
        $addFields: {
          sku: {
            $ifNull: [
              { $arrayElemAt: ['$skuBarcode.barcode', 0] },
              'N/A'
            ]
          }
        }
      },
      {
        $project: {
          skuBarcode: 0
        }
      }
    ]);

    // Add serial number flag and match details
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const productIdStr = product._id.toString();
        const serialCount = await SerialNumber.countDocuments({ product_id: productIdStr });
        
        // Find matching lot or serial for this product
        const matchingLot = lotNumbers.find(l => l.product_id === productIdStr);
        const matchingSerial = serialNumbers.find(s => s.product_id === productIdStr);
        
        return {
          ...product,
          hasSerialNumbers: serialCount > 0,
          matchedLot: matchingLot ? matchingLot.lot_number : null,
          matchedSerial: matchingSerial ? matchingSerial.serial_number : null,
        };
      })
    );

    res.json({
      query: searchTerm,
      results: productsWithDetails,
      count: productsWithDetails.length
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};
