import mongoose, { Schema, Document } from "mongoose";

export interface IStockAlert extends Document {
  product_id: string;
  warehouse_id?: string;
  alert_type: "low_stock" | "out_of_stock" | "overstock";
  current_stock: number;
  threshold: number;
  reorder_point?: number;
  status: "active" | "acknowledged" | "resolved";
  acknowledged_by?: string;
  acknowledged_date?: Date;
  resolved_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    product_id: { type: String, required: true },
    warehouse_id: { type: String },
    alert_type: {
      type: String,
      enum: ["low_stock", "out_of_stock", "overstock"],
      required: true,
    },
    current_stock: { type: Number, required: true },
    threshold: { type: Number, required: true },
    reorder_point: { type: Number },
    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
    },
    acknowledged_by: { type: String },
    acknowledged_date: { type: Date },
    resolved_date: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
StockAlertSchema.index({ product_id: 1 });
StockAlertSchema.index({ warehouse_id: 1 });
StockAlertSchema.index({ status: 1 });
StockAlertSchema.index({ alert_type: 1 });
StockAlertSchema.index({ created_at: -1 });

export const StockAlert =
  mongoose.models.StockAlert ||
  mongoose.model<IStockAlert>("StockAlert", StockAlertSchema);
