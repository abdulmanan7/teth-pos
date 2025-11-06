import mongoose, { Schema, Document } from "mongoose";

export interface IReorderRule extends Document {
  product_id: string;
  warehouse_id?: string;
  minimum_quantity: number;
  reorder_point: number;
  reorder_quantity: number;
  safety_stock?: number;
  lead_time_days?: number;
  preferred_supplier_id?: string;
  auto_create_po?: boolean;
  is_active: boolean;
  last_triggered_date?: Date;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const ReorderRuleSchema = new Schema<IReorderRule>(
  {
    product_id: { type: String, required: true },
    warehouse_id: { type: String },
    minimum_quantity: { type: Number, default: 0 },
    reorder_point: { type: Number, required: true },
    reorder_quantity: { type: Number, required: true },
    safety_stock: { type: Number },
    lead_time_days: { type: Number },
    preferred_supplier_id: { type: String },
    auto_create_po: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    last_triggered_date: { type: Date },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
ReorderRuleSchema.index({ product_id: 1, warehouse_id: 1 });
ReorderRuleSchema.index({ is_active: 1 });

export const ReorderRule = (mongoose.models.ReorderRule ||
  mongoose.model<IReorderRule>("ReorderRule", ReorderRuleSchema)) as mongoose.Model<IReorderRule>;
