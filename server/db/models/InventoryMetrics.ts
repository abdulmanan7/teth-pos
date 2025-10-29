import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryMetrics extends Document {
  date: Date;
  total_products: number;
  total_stock_value: number;
  total_units_in_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
  expired_count: number;
  expiring_soon_count: number;
  average_stock_level: number;
  stock_turnover_rate: number;
  warehouse_distribution: {
    warehouse_id: string;
    warehouse_name: string;
    units: number;
    value: number;
  }[];
  category_distribution: {
    category: string;
    units: number;
    value: number;
    percentage: number;
  }[];
  top_products: {
    product_id: string;
    product_name: string;
    sku: string;
    stock: number;
    value: number;
  }[];
  slow_moving_products: {
    product_id: string;
    product_name: string;
    sku: string;
    stock: number;
    days_in_stock: number;
  }[];
  created_at: Date;
  updated_at: Date;
}

const InventoryMetricsSchema = new Schema<IInventoryMetrics>(
  {
    date: { type: Date, required: true, default: Date.now },
    total_products: { type: Number, required: true },
    total_stock_value: { type: Number, required: true },
    total_units_in_stock: { type: Number, required: true },
    low_stock_count: { type: Number, required: true },
    out_of_stock_count: { type: Number, required: true },
    expired_count: { type: Number, required: true },
    expiring_soon_count: { type: Number, required: true },
    average_stock_level: { type: Number, required: true },
    stock_turnover_rate: { type: Number, required: true },
    warehouse_distribution: [
      {
        warehouse_id: String,
        warehouse_name: String,
        units: Number,
        value: Number,
      },
    ],
    category_distribution: [
      {
        category: String,
        units: Number,
        value: Number,
        percentage: Number,
      },
    ],
    top_products: [
      {
        product_id: String,
        product_name: String,
        sku: String,
        stock: Number,
        value: Number,
      },
    ],
    slow_moving_products: [
      {
        product_id: String,
        product_name: String,
        sku: String,
        stock: Number,
        days_in_stock: Number,
      },
    ],
  },
  { timestamps: true }
);

// Indexes for performance
InventoryMetricsSchema.index({ date: -1 });
InventoryMetricsSchema.index({ created_at: -1 });

export const InventoryMetrics =
  mongoose.models.InventoryMetrics ||
  mongoose.model<IInventoryMetrics>(
    "InventoryMetrics",
    InventoryMetricsSchema
  );
