import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number; // Quantity per unit (e.g., 1L milk, 0.5kg butter)
  stock: number;
  category: string;
  description?: string;
  // Unit of Measurement
  unit?: 'piece' | 'kg' | 'liter' | 'meter' | 'box' | 'pack' | 'dozen' | 'gram' | 'ml' | 'cm' | 'custom';
  unit_custom?: string; // For custom units like "bottle", "jar", etc.
  // Inventory system fields
  warehouse_id?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
      default: 1,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Unit of Measurement
    unit: {
      type: String,
      enum: ['piece', 'kg', 'liter', 'meter', 'box', 'pack', 'dozen', 'gram', 'ml', 'cm', 'custom'],
      default: 'piece',
    },
    unit_custom: {
      type: String,
      trim: true,
    },
    // Inventory system fields
    warehouse_id: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes for inventory queries
ProductSchema.index({ sku: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
