import mongoose, { Schema, Document } from "mongoose";

export interface ISerialNumber extends Document {
  serial_number: string;
  product_id: string;
  lot_id?: string;
  warehouse_id: string;
  status: "available" | "sold" | "returned" | "defective";
  assigned_to?: string;
  assigned_date?: Date;
  purchase_date?: Date;
  sale_date?: Date;
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const SerialNumberSchema = new Schema<ISerialNumber>(
  {
    serial_number: { type: String, required: true, unique: true },
    product_id: { type: String, required: true },
    lot_id: { type: String },
    warehouse_id: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "sold", "returned", "defective"],
      default: "available",
    },
    assigned_to: { type: String },
    assigned_date: { type: Date },
    purchase_date: { type: Date },
    sale_date: { type: Date },
    notes: { type: String },
    created_by: { type: String },
  },
  { timestamps: true }
);

// Indexes for performance
SerialNumberSchema.index({ product_id: 1, warehouse_id: 1 });
// Note: serial_number has unique: true which creates an index automatically
SerialNumberSchema.index({ status: 1 });
SerialNumberSchema.index({ lot_id: 1 });

export const SerialNumber =
  mongoose.models.SerialNumber ||
  mongoose.model<ISerialNumber>("SerialNumber", SerialNumberSchema);
