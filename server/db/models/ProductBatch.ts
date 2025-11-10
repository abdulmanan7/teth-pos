import mongoose, { Schema, Document } from "mongoose";

export interface IProductBatch extends Document {
  product_id: string;
  warehouse_id: string;
  batch_number: string; // Auto-generated or manual identifier
  quantity: number; // Current stock quantity in this batch
  original_quantity: number; // Original quantity received
  expiry_date?: Date; // Expiry date for this batch
  manufacture_date?: Date; // When this batch was manufactured
  lot_id?: string; // Optional: Link to lot number if using formal lot tracking
  purchase_date: Date; // When this batch was received
  cost_per_unit?: number; // Cost for accounting purposes
  supplier_id?: string; // Which supplier provided this batch
  status: "active" | "expired" | "quarantined" | "sold_out";
  notes?: string;
  created_by?: string;
  is_market_purchase?: boolean; // Track if this batch came from market purchase
  market_purchase_id?: string; // Reference to market purchase ID for grouping
  market_purchase_number?: string; // Purchase number for market purchases
  inventory_added?: boolean; // Track if this purchase has been added to inventory with accounting
  created_at: Date;
  updated_at: Date;
}

const ProductBatchSchema = new Schema<IProductBatch>(
  {
    product_id: {
      type: String,
      required: true,
      index: true,
    },
    warehouse_id: {
      type: String,
      required: true,
      index: true,
    },
    batch_number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    original_quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiry_date: {
      type: Date,
      index: true,
    },
    manufacture_date: {
      type: Date,
    },
    lot_id: {
      type: String,
      index: true,
    },
    purchase_date: {
      type: Date,
      required: true,
      index: true,
    },
    cost_per_unit: {
      type: Number,
      min: 0,
    },
    supplier_id: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "quarantined", "sold_out"],
      default: "active",
      index: true,
    },
    notes: {
      type: String,
    },
    created_by: {
      type: String,
    },
    is_market_purchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    market_purchase_id: {
      type: String,
      index: true,
    },
    market_purchase_number: {
      type: String,
    },
    inventory_added: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
ProductBatchSchema.index({ product_id: 1, warehouse_id: 1, status: 1 });
ProductBatchSchema.index({ product_id: 1, expiry_date: 1 });
ProductBatchSchema.index({ warehouse_id: 1, status: 1 });
ProductBatchSchema.index({ expiry_date: 1, status: 1 });

export const ProductBatch = (mongoose.models.ProductBatch ||
  mongoose.model<IProductBatch>(
    "ProductBatch",
    ProductBatchSchema
  )) as mongoose.Model<IProductBatch>;
