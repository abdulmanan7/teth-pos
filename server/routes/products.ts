import { RequestHandler } from 'express';
import { Product } from '../db/models/Product';
import { SerialNumber } from '../db/models/SerialNumber';
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
