import mongoose, { Schema, Document } from "mongoose";

export interface IStockAdjustmentLine {
  product_id: string;
  lot_id?: string;
  serial_id?: string;
  current_quantity: number;
  adjusted_quantity: number;
  difference: number;
  unit_cost?: number;
  line_total?: number;
  notes?: string;
}

export interface IStockAdjustment extends Document {
  adjustment_number: string;
  warehouse_id: string;
  adjustment_date: Date;
  reason: string;
  status: "draft" | "pending_approval" | "approved" | "rejected";
  approved_by?: string;
  approved_date?: Date;
  total_adjustment_value?: number;
  lines: IStockAdjustmentLine[];
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const StockAdjustmentLineSchema = new Schema<IStockAdjustmentLine>({
  product_id: { type: String, required: true },
  lot_id: { type: String },
  serial_id: { type: String },
  current_quantity: { type: Number, required: true },
  adjusted_quantity: { type: Number, required: true },
  difference: { type: Number, required: true },
  unit_cost: { type: Number },
  line_total: { type: Number },
  notes: { type: String },
});

const StockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    adjustment_number: { type: String, required: true, unique: true },
    warehouse_id: { type: String, required: true },
    adjustment_date: { type: Date, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected"],
      default: "draft",
    },
    approved_by: { type: String },
    approved_date: { type: Date },
    total_adjustment_value: { type: Number },
    lines: [StockAdjustmentLineSchema],
    notes: { type: String },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
// Note: adjustment_number already has unique index from schema definition
StockAdjustmentSchema.index({ warehouse_id: 1 });
StockAdjustmentSchema.index({ status: 1 });
StockAdjustmentSchema.index({ adjustment_date: 1 });

export const StockAdjustment =
  mongoose.models.StockAdjustment ||
  mongoose.model<IStockAdjustment>("StockAdjustment", StockAdjustmentSchema);
