import mongoose, { Schema, Document } from "mongoose";

export interface ILotNumber extends Document {
  lot_number: string;
  title?: string;
  product_id: string;
  quantity: number;
  manufacture_date?: Date;
  expiry_date?: Date;
  warehouse_id: string;
  status: "active" | "expired" | "quarantined";
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const LotNumberSchema = new Schema<ILotNumber>(
  {
    lot_number: { type: String, required: true, unique: true },
    title: { type: String },
    product_id: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    manufacture_date: { type: Date },
    expiry_date: { type: Date },
    warehouse_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "expired", "quarantined"],
      default: "active",
    },
    notes: { type: String },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
LotNumberSchema.index({ product_id: 1, warehouse_id: 1 });
// Note: lot_number has unique: true which creates an index automatically
LotNumberSchema.index({ expiry_date: 1 });
LotNumberSchema.index({ status: 1 });

export const LotNumber = (mongoose.models.LotNumber ||
  mongoose.model<ILotNumber>("LotNumber", LotNumberSchema)) as mongoose.Model<ILotNumber>;
